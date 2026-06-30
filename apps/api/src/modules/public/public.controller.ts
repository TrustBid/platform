import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { PublicService } from './public.service';
import { ProjectsQueryDto } from './dto/projects-query.dto';
import { CreateDonationDto } from './dto/create-donation.dto';

@Public()
@Controller()
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly config: ConfigService,
  ) {}

  // GET /.well-known/stellar.toml  (SEP-1)
  @Get('.well-known/stellar.toml')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Access-Control-Allow-Origin', '*')
  getStellarToml(): string {
    const network = this.config.get<string>('STELLAR_NETWORK', 'testnet');
    const isMainnet = network === 'public';
    const passphrase = isMainnet
      ? 'Public Global Stellar Network ; September 2015'
      : 'Test SDF Network ; September 2015';
    const signingKey = this.config.get<string>(
      'STELLAR_SERVER_PUBLIC_KEY',
      'GAOJ53SVIVOVP4O376PZBPTZRWHC5ML5JV4PSV26GT56MQSRR2J25EQO',
    );
    const apiUrl = this.config.get<string>(
      'API_URL',
      'https://api-production-9557.up.railway.app',
    );
    const usdcIssuer = isMainnet
      ? 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
      : 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

    return [
      `NETWORK_PASSPHRASE="${passphrase}"`,
      `SIGNING_KEY="${signingKey}"`,
      `WEB_AUTH_ENDPOINT="${apiUrl}/auth"`,
      '',
      '[DOCUMENTATION]',
      'ORG_NAME="TrustBid"',
      'ORG_URL="https://trustbid.app"',
      'ORG_DESCRIPTION="Plataforma de transparencia de fondos para ONGs sobre Stellar."',
      '',
      '[[CURRENCIES]]',
      'code="USDC"',
      `issuer="${usdcIssuer}"`,
      `status="${isMainnet ? 'live' : 'test'}"`,
      'is_asset_anchored=false',
      'desc="USD Coin"',
    ].join('\n');
  }

  // GET /ngo
  @Get('ngo')
  getNgo() {
    return this.publicService.getNgo();
  }

  // GET /projects[?q=&category=]
  @Get('projects')
  getProjects(@Query() query: ProjectsQueryDto) {
    return this.publicService.getProjects(query);
  }

  // GET /projects/:id
  @Get('projects/:id')
  getProject(@Param('id', ParseUUIDPipe) id: string) {
    return this.publicService.getProject(id);
  }

  // GET /categories
  @Get('categories')
  getCategories() {
    return this.publicService.getCategories();
  }

  // POST /donations
  @Post('donations')
  createDonation(@Body() body: CreateDonationDto) {
    return this.publicService.createDonation(body);
  }
}
