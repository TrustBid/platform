import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrivyClient, verifyAccessToken } from '@privy-io/node';
import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';

// TODO(privy-stellar): Stellar es soporte Tier 2 en Privy — firma vía rawSign
// manual (sin SDK de alto nivel). VALIDAR EN SANDBOX antes de producción:
// esta cuenta maneja fondos de ONGs. La firma (rawSign) llega en la fase 3;
// acá (fase 1) sólo verificamos identidad y leemos la wallet embebida.
// Ref: docs.privy.io/recipes/use-tier-2

/**
 * Riel de auth para usuarios NO nativos cripto (Privy: login email/OTP + wallet
 * Stellar embebida). El front sólo autentica; el backend valida el access token
 * (JWKS) y, como Stellar es Tier 2, CREA la wallet embebida server-side si el
 * usuario aún no la tiene (pregenerateWallets) — la creación client-side del
 * React SDK es solo EVM/Solana.
 *
 * Init lazy: si faltan las env de Privy, la API igual bootea (SEP-10 sigue
 * funcionando) y sólo falla este riel al invocarlo.
 */
@Injectable()
export class PrivyService {
  private appId?: string;
  private client?: PrivyClient;
  private jwks?: JWTVerifyGetKey;

  constructor(private readonly config: ConfigService) {}

  private init() {
    if (this.client && this.jwks && this.appId) return;
    const appId = this.config.get<string>('PRIVY_APP_ID');
    const appSecret = this.config.get<string>('PRIVY_APP_SECRET');
    if (!appId || !appSecret) {
      throw new ServiceUnavailableException({
        code: 'privy_not_configured',
        message: 'PRIVY_APP_ID / PRIVY_APP_SECRET no configurados',
      });
    }
    this.appId = appId;
    this.client = new PrivyClient({ appId, appSecret });
    this.jwks = createRemoteJWKSet(
      new URL(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`),
    );
  }

  /**
   * Verifica el access token de Privy y asegura (crea si falta) la wallet
   * Stellar embebida del usuario, devolviendo su pubkey.
   */
  async verifyAndEnsureStellarWallet(
    accessToken: string,
  ): Promise<{ privyUserId: string; stellarPublicKey: string }> {
    this.init();

    let userId: string;
    try {
      const claims = await verifyAccessToken({
        access_token: accessToken,
        app_id: this.appId!,
        verification_key: this.jwks!,
      });
      userId = claims.user_id;
    } catch {
      throw new UnauthorizedException({
        code: 'invalid_privy_token',
        message: 'Access token de Privy inválido o expirado',
      });
    }

    const user = await this.client!.users()._get(userId);
    let stellarAddress = this.findStellarAddress(user.linked_accounts);

    // Tier 2: si no existe, la creamos server-side (pregenerate para el usuario).
    if (!stellarAddress) {
      const updated = await this.client!.users().pregenerateWallets(userId, {
        wallets: [{ chain_type: 'stellar' }],
      });
      stellarAddress = this.findStellarAddress(updated.linked_accounts);
    }

    if (!stellarAddress) {
      throw new UnauthorizedException({
        code: 'no_stellar_wallet',
        message: 'No se pudo obtener ni crear la wallet Stellar embebida del usuario',
      });
    }

    return { privyUserId: userId, stellarPublicKey: stellarAddress };
  }

  // Busca el embedded wallet con chain_type 'stellar' entre las cuentas linkeadas.
  private findStellarAddress(linkedAccounts: ReadonlyArray<unknown>): string | null {
    for (const a of linkedAccounts) {
      if (
        a && typeof a === 'object' &&
        'chain_type' in a && (a as { chain_type: unknown }).chain_type === 'stellar' &&
        'address' in a && typeof (a as { address: unknown }).address === 'string'
      ) {
        return (a as { address: string }).address;
      }
    }
    return null;
  }
}
