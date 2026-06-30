'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatUsd } from '@/lib/format';
import { explorerTxUrl, shortCode } from '@/lib/stellar-explorer';
import { submitDonation } from '@/lib/api/public';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { connectWalletWithModal } from '@/lib/wallet/adapter';
import { WalletKitSigner } from '@/lib/stellar/walletKitSigner';
import { StellarClient, XLM } from '@trustbid/stellar-sdk';
import type { DonationIntent } from '@/types/public';

const PRESETS = [50, 100, 500];

// Schema base solo para el tipo del form; los mensajes localizados se arman en el componente.
const amountSchema = z.object({ amountUsd: z.coerce.number().positive().max(1_000_000) });
type AmountForm = z.input<typeof amountSchema>;

type ProjectLite = {
  id: string;
  name: string;
  currency: string;
  category: string;
  /** Dirección Stellar (testnet) de la org que recibe la donación. */
  recipientAddress: string | null;
};

export function DonateFlow({ project }: { project: ProjectLite }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(0);
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletNote, setWalletNote] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [intent, setIntent] = useState<DonationIntent | null>(null);

  const localizedSchema = useMemo(
    () =>
      z.object({
        amountUsd: z.coerce
          .number({ message: t('donate.amountRequired') })
          .positive(t('donate.amountPositive'))
          .max(1_000_000, t('donate.amountTooHigh')),
      }),
    [t],
  );

  const form = useForm<AmountForm>({
    resolver: zodResolver(localizedSchema),
    defaultValues: { amountUsd: '' as unknown as number },
  });

  const STEPS = [
    t('donate.steps.amount'),
    t('donate.steps.wallet'),
    t('donate.steps.confirm'),
    t('donate.steps.done'),
  ];

  const onAmountSubmit = form.handleSubmit((data) => {
    setAmount(Number(data.amountUsd));
    setStep(2);
  });

  const handleConnect = async () => {
    setWalletNote(null);
    setConnecting(true);
    try {
      const conn = await connectWalletWithModal();
      if (conn) {
        setWallet(conn.address);
        setStep(3);
      } else {
        setWalletNote(t('donate.walletError'));
      }
    } catch {
      setWalletNote(t('donate.walletError'));
    } finally {
      setConnecting(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (!wallet) throw new Error('NO_WALLET');
      if (!project.recipientAddress) throw new Error('NO_RECIPIENT');

      // Pago REAL en Stellar testnet: donante → dirección de la org.
      const client = new StellarClient('testnet');
      // Si la cuenta del donante no existe aún en testnet, la fondeamos (friendbot).
      if (!(await client.accountExists(wallet))) {
        await client.fundTestnet(wallet);
      }
      const signer = new WalletKitSigner(wallet, client.config.networkPassphrase);
      const res = await client.executePayment(signer, {
        destination: project.recipientAddress,
        asset: XLM,
        amount: String(amount),
      });
      const txHash = res.hash;

      // Registrar la donación con el hash real (best-effort: el pago ya ocurrió).
      let result: DonationIntent;
      try {
        result = await submitDonation({
          projectId: project.id,
          amountUsd: amount,
          walletAddress: wallet,
          txHash,
        });
      } catch {
        result = {
          id: txHash,
          projectId: project.id,
          amountUsd: amount,
          status: 'pending',
          verificationCode: txHash,
          createdAt: new Date().toISOString(),
        };
      }
      setIntent(result.verificationCode ? result : { ...result, verificationCode: txHash });
      setStep(4);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'NO_WALLET') setSubmitError('Conectá tu wallet antes de confirmar.');
      else if (msg === 'NO_RECIPIENT') setSubmitError('Este proyecto no tiene dirección de recepción configurada.');
      else if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('denied')) setSubmitError('Firma cancelada en la wallet.');
      else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('mainnet')) setSubmitError('Tu wallet está en Mainnet. Cambiá a Testnet para donar en la demo.');
      else if (msg.includes('destination') || msg.includes('op_no_destination')) setSubmitError('La cuenta receptora de la org no existe en testnet todavía.');
      else setSubmitError(t('donate.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-6 p-6">
        {/* Stepper */}
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold',
                      done && 'border-blue-600 bg-blue-600 text-white',
                      active && 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40',
                      !active && !done && 'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : n}
                  </div>
                  <span className={cn('text-[11px]', active ? 'font-semibold text-blue-600' : 'text-zinc-500')}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('mx-1 h-0.5 flex-1', step > n ? 'bg-blue-600' : 'bg-border')} />
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-border pt-5">
          <p className="text-xs font-medium text-zinc-500">{t('donate.donatingTo')}</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{project.name}</p>
        </div>

        {/* STEP 1 — Amount */}
        {step === 1 && (
          <form onSubmit={onAmountSubmit} className="space-y-4">
            <Label>{t('donate.chooseAmount')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => form.setValue('amountUsd', p, { shouldValidate: true })}
                  className={cn(
                    'rounded-lg border py-3 text-sm font-semibold transition-colors',
                    Number(form.watch('amountUsd')) === p
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-border bg-background text-zinc-700 hover:border-blue-500/50 dark:text-zinc-300',
                  )}
                >
                  ${p}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom">{t('donate.otherAmount')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                <Input
                  id="custom"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="0.00"
                  className="pl-7"
                  {...form.register('amountUsd')}
                />
              </div>
              {form.formState.errors.amountUsd && (
                <p className="text-xs font-medium text-red-600">
                  {form.formState.errors.amountUsd.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">
              {t('donate.continue')} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        )}

        {/* STEP 2 — Connect wallet */}
        {step === 2 && (
          <div className="space-y-4">
            <Label>{t('donate.connectWallet')}</Label>
            <button
              type="button"
              disabled={connecting}
              onClick={handleConnect}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:border-blue-500/60 disabled:opacity-60 dark:text-zinc-200"
            >
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-600" /> Connect Stellar wallet
              </span>
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              )}
            </button>
            {walletNote && (
              <p className="rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                {walletNote}
              </p>
            )}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                <ArrowLeft className="h-4 w-4" /> {t('donate.back')}
              </button>
              {walletNote && (
                <Button onClick={() => setStep(3)} variant="outline" className="text-sm">
                  {t('donate.continueNoWallet')}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 — Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <Label>{t('donate.confirmTitle')}</Label>
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <Row label={t('donate.project')} value={project.name} />
              <Row label={t('donate.amount')} value={formatUsd(amount)} />
              <Row label={t('donate.network')} value={`Stellar · ${project.currency}`} />
              <Row label={t('donate.wallet')} value={wallet ? shortCode(wallet) : t('donate.walletUnset')} />
            </div>
            {submitError && <p className="text-xs font-medium text-red-600">{submitError}</p>}
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={submitting} className="flex-1">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> {t('donate.back')}
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> {t('donate.processing')}
                  </>
                ) : (
                  t('donate.confirmBtn')
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — Success */}
        {step === 4 && intent && (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t('donate.successTitle')}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {formatUsd(intent.amountUsd)} {t('donate.successFor')} {project.name}.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-4 text-left text-sm">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('donate.verificationCode')}
              </p>
              {intent.verificationCode ? (
                <a
                  href={explorerTxUrl(intent.verificationCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-sm text-blue-600 hover:underline"
                >
                  {shortCode(intent.verificationCode)} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                  <Clock className="h-4 w-4" /> {t('donate.codePending')}
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-500">{t('donate.reference')}: {intent.id}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
                <Link href={`/public/projects/${project.id}`}>{t('donate.viewProject')}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/public/projects">{t('donate.viewOthers')}</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-white">{value}</span>
    </div>
  );
}
