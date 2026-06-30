'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import elipseBg from '@/assets/Elipse.jpg';
import { connectWalletWithModal } from '@/lib/wallet/adapter';
import { sep10Login, getJwt } from '@/lib/auth/sep10';

// ── Constants ──────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';
const TOTAL_STEPS = 6;

const ORG_TYPES = [
  { value: 'ong',        label: 'ONG' },
  { value: 'fundacion',  label: 'Fundación' },
  { value: 'asociacion', label: 'Asociación civil' },
  { value: 'empresa_b',  label: 'Empresa B / Social' },
  { value: 'cooperativa',label: 'Cooperativa' },
  { value: 'otra',       label: 'Otra' },
];

const COUNTRIES = [
  { code: 'AR', name: 'Argentina' }, { code: 'BO', name: 'Bolivia' },
  { code: 'BR', name: 'Brasil' },    { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },  { code: 'CR', name: 'Costa Rica' },
  { code: 'CU', name: 'Cuba' },      { code: 'DO', name: 'República Dominicana' },
  { code: 'EC', name: 'Ecuador' },   { code: 'SV', name: 'El Salvador' },
  { code: 'GT', name: 'Guatemala' }, { code: 'HN', name: 'Honduras' },
  { code: 'MX', name: 'México' },    { code: 'NI', name: 'Nicaragua' },
  { code: 'PA', name: 'Panamá' },    { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Perú' },      { code: 'PR', name: 'Puerto Rico' },
  { code: 'UY', name: 'Uruguay' },   { code: 'VE', name: 'Venezuela' },
  { code: 'US', name: 'Estados Unidos' }, { code: 'ES', name: 'España' },
  { code: 'DE', name: 'Alemania' },  { code: 'FR', name: 'Francia' },
  { code: 'GB', name: 'Reino Unido' }, { code: 'CA', name: 'Canadá' },
  { code: 'AU', name: 'Australia' }, { code: 'JP', name: 'Japón' },
  { code: 'CN', name: 'China' },     { code: 'IN', name: 'India' },
];

const INTERVENTION_AREAS = [
  { slug: 'education',        label: 'Educación' },
  { slug: 'health',           label: 'Salud y bienestar' },
  { slug: 'environment',      label: 'Medio ambiente' },
  { slug: 'economic_dev',     label: 'Desarrollo económico' },
  { slug: 'human_rights',     label: 'Derechos humanos' },
  { slug: 'housing',          label: 'Vivienda' },
  { slug: 'food_security',    label: 'Seguridad alimentaria' },
  { slug: 'water_sanitation', label: 'Agua y saneamiento' },
  { slug: 'gender_equality',  label: 'Género e igualdad' },
  { slug: 'youth',            label: 'Niñez y juventud' },
  { slug: 'elderly',          label: 'Adulto mayor' },
  { slug: 'disability',       label: 'Discapacidad' },
  { slug: 'migration',        label: 'Migración y refugio' },
  { slug: 'culture',          label: 'Cultura y patrimonio' },
  { slug: 'technology',       label: 'Tecnología e innovación' },
  { slug: 'governance',       label: 'Transparencia y gobernanza' },
];

const TARGET_POPULATIONS = [
  { slug: 'children',    label: 'Niños y niñas (0–12)' },
  { slug: 'adolescents', label: 'Adolescentes (13–17)' },
  { slug: 'youth',       label: 'Jóvenes (18–29)' },
  { slug: 'adults',      label: 'Adultos (30–59)' },
  { slug: 'elderly',     label: 'Adultos mayores (60+)' },
  { slug: 'women',       label: 'Mujeres' },
  { slug: 'lgbtiq',      label: 'Población LGBTIQ+' },
  { slug: 'disability',  label: 'Personas con discapacidad' },
  { slug: 'indigenous',  label: 'Comunidades indígenas' },
  { slug: 'migrants',    label: 'Migrantes y refugiados' },
  { slug: 'homeless',    label: 'Personas en situación de calle' },
  { slug: 'rural',       label: 'Población rural' },
  { slug: 'urban_vuln',  label: 'Población urbana vulnerable' },
];

const GEO_SCOPES = [
  { value: 'local',          label: 'Local',               desc: 'Ciudad o municipio' },
  { value: 'regional',       label: 'Departamental / Regional', desc: 'Región o departamento' },
  { value: 'nacional',       label: 'Nacional',            desc: 'Todo el país' },
  { value: 'internacional',  label: 'Internacional',       desc: 'Varios países' },
];

const ODS_COLORS: Record<number, string> = {
  1:'#E5243B', 2:'#DDA63A', 3:'#4C9F38', 4:'#C5192D', 5:'#FF3A21',
  6:'#26BDE2', 7:'#FCC30B', 8:'#A21942', 9:'#FD6925', 10:'#DD1367',
  11:'#FD9D24', 12:'#BF8B2E', 13:'#3F7E44', 14:'#0A97D9', 15:'#56C02B',
  16:'#00689D', 17:'#19486A',
};
const ODS_LABELS: Record<number, string> = {
  1:'Fin de la pobreza', 2:'Hambre cero', 3:'Salud y bienestar', 4:'Educación de calidad',
  5:'Igualdad de género', 6:'Agua y saneamiento', 7:'Energía asequible', 8:'Trabajo decente',
  9:'Industria e innovación', 10:'Reducción de desigualdades', 11:'Ciudades sostenibles',
  12:'Consumo responsable', 13:'Acción por el clima', 14:'Vida submarina',
  15:'Vida terrestre', 16:'Paz y justicia', 17:'Alianzas',
};

const BUDGET_RANGES = [
  'Menos de $50,000 USD',
  '$50,000 – $200,000 USD',
  '$200,001 – $1,000,000 USD',
  '$1,000,001 – $5,000,000 USD',
  'Más de $5,000,000 USD',
  'Prefiero no indicarlo',
];

const USER_ROLES = [
  { id: 'admin',       label: 'Administrador',         desc: 'Gestiona proyectos, fondos y equipo.' },
  { id: 'responsable', label: 'Responsable de proyecto', desc: 'Ejecuta y reporta el avance de proyectos.' },
  { id: 'donante',     label: 'Donante / Verificador', desc: 'Verifica el destino de fondos.' },
] as const;

// ── Form state ─────────────────────────────────────────────────────────────────

interface FormData {
  legalName: string; acronym: string; fiscalId: string; orgType: string;
  country: string; stateProvince: string; address1: string; address2: string;
  postalCode: string; phone: string;
  website: string; instagram: string; linkedin: string; socialX: string; facebook: string;
  interventionAreas: string[]; targetPopulations: string[]; geographicScope: string;
  odsGoals: number[]; annualBudgetRange: string;
  role: string;
}

const initialForm: FormData = {
  legalName: '', acronym: '', fiscalId: '', orgType: '',
  country: '', stateProvince: '', address1: '', address2: '', postalCode: '', phone: '',
  website: '', instagram: '', linkedin: '', socialX: '', facebook: '',
  interventionAreas: [], targetPopulations: [], geographicScope: '',
  odsGoals: [], annualBudgetRange: '',
  role: 'admin',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}{optional && <span className="ml-1 normal-case font-normal text-gray-400">(opcional)</span>}
    </span>
  );
}

const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/25 focus:border-[#0F52BA] transition';

function PillToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition',
        active
          ? 'bg-[#0F52BA] text-white border-[#0F52BA]'
          : 'bg-white text-gray-600 border-gray-200 hover:border-[#0F52BA]/40',
      )}
    >
      {label}
    </button>
  );
}

// ── Step titles ────────────────────────────────────────────────────────────────

const STEP_META = [
  { title: 'Identidad legal', desc: 'Información oficial de tu organización.' },
  { title: 'Ubicación y contacto', desc: 'Datos de sede y contacto directo.' },
  { title: 'Presencia digital', desc: 'Sitio web y redes sociales.' },
  { title: 'Impacto y alcance', desc: 'Áreas de trabajo y población que atienden.' },
  { title: 'ODS y presupuesto', desc: 'Objetivos de desarrollo y rango presupuestal.' },
  { title: 'Tu rol y wallet', desc: 'Cómo te identificas y con qué wallet ingresarás.' },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleArr = (field: 'interventionAreas' | 'targetPopulations' | 'odsGoals', val: string | number) => {
    setForm((prev) => {
      const arr = prev[field] as (string | number)[];
      return {
        ...prev,
        [field]: arr.includes(val as never)
          ? arr.filter((v) => v !== val)
          : [...arr, val],
      };
    });
  };

  const canProceed = (): boolean => {
    if (step === 1) return form.legalName.trim().length > 0 && form.acronym.trim().length > 0 && form.orgType !== '';
    if (step === 2) return form.country !== '' && form.address1.trim().length > 0 && form.phone.trim().length > 0;
    if (step === 4) return form.interventionAreas.length > 0 && form.geographicScope !== '';
    if (step === 6) return true;
    return true;
  };

  const handleRegister = async () => {
    setError(null);
    setConnecting(true);
    try {
      const address = await connectWalletWithModal();
      if (!address) { setConnecting(false); return; }
      await sep10Login(address);

      const jwt = getJwt();
      await fetch(`${API}/my/organization`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          name: form.legalName,
          legal_name: form.legalName,
          acronym: form.acronym,
          fiscal_id: form.fiscalId || undefined,
          org_type: form.orgType,
          country: form.country,
          state_province: form.stateProvince || undefined,
          address_1: form.address1,
          address_2: form.address2 || undefined,
          postal_code: form.postalCode || undefined,
          phone: form.phone,
          website: form.website || undefined,
          social_instagram: form.instagram || undefined,
          social_linkedin: form.linkedin || undefined,
          social_x: form.socialX || undefined,
          social_facebook: form.facebook || undefined,
          intervention_area_slugs: form.interventionAreas,
          target_population_slugs: form.targetPopulations,
          geographic_scope: form.geographicScope || undefined,
          ods_goal_ids: form.odsGoals,
          annual_budget_range: form.annualBudgetRange || undefined,
          onboarding_completed: false,
        }),
      });

      router.push('/dashboard');
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      if (raw === 'NETWORK_MISMATCH') {
        setError('Tu wallet está en Mainnet. Cambia a Testnet en Freighter → Settings → Network.');
      } else if (raw === 'USER_REJECTED') {
        setError('Firma cancelada. Aprueba el challenge en tu wallet para continuar.');
      } else if (raw.includes('fetch') || raw.includes('Failed')) {
        setError('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.');
      } else {
        setError(raw || 'No se pudo completar el registro. Intenta de nuevo.');
      }
    } finally {
      setConnecting(false);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;
  const meta = STEP_META[step - 1];

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-white">
      {/* Left panel */}
      <div className="hidden md:flex relative w-full h-full bg-[#020817] select-none items-center justify-center p-12">
        <div className="relative w-full h-full flex flex-col items-center justify-center max-w-lg">
          <Image src={elipseBg} alt="TrustBid" priority className="w-full h-auto object-contain max-h-[70vh]" />
          <div className="absolute bottom-12 left-0 right-0 text-center px-4">
            <p className="text-sm font-semibold text-white/90 tracking-wide">TrustBid</p>
            <p className="text-xs text-white/50 mt-1 leading-relaxed max-w-xs mx-auto">
              Transparencia de fondos verificable en Stellar blockchain.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-start justify-center bg-white p-6 sm:p-10 md:p-14 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Paso {step} de {TOTAL_STEPS}</span>
              <span>{Math.round(progress)}% completado</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0F52BA] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step header */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{meta.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{meta.desc}</p>
          </div>

          {/* ── STEP 1: Identidad legal ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block"><FieldLabel>Nombre legal de la organización</FieldLabel>
                  <input className={inputCls} type="text" placeholder="Nombre completo según registro legal"
                    value={form.legalName} onChange={(e) => set('legalName', e.target.value)} />
                </label>
              </div>
              <div>
                <label className="block"><FieldLabel>Acrónimo</FieldLabel>
                  <input className={inputCls} type="text" maxLength={30} placeholder="Ej. ACNUR, UNICEF"
                    value={form.acronym} onChange={(e) => set('acronym', e.target.value)} />
                </label>
                <p className="text-xs text-gray-400 mt-1">Nombre corto usado en comunicaciones.</p>
              </div>
              <div>
                <label className="block"><FieldLabel optional>Identificador fiscal</FieldLabel>
                  <input className={inputCls} type="text" placeholder="NIT, RFC, CUIT, RUT…"
                    value={form.fiscalId} onChange={(e) => set('fiscalId', e.target.value)} />
                </label>
              </div>
              <div>
                <FieldLabel>Tipo de organización</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {ORG_TYPES.map((t) => (
                    <button
                      key={t.value} type="button"
                      onClick={() => set('orgType', t.value)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl border text-sm font-medium text-left transition',
                        form.orgType === t.value
                          ? 'border-[#0F52BA] bg-[#0F52BA]/5 text-[#0F52BA]'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Ubicación y contacto ───────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <FieldLabel>País</FieldLabel>
                <div className="relative">
                  <select className={cn(inputCls, 'appearance-none pr-10 cursor-pointer')}
                    value={form.country} onChange={(e) => set('country', e.target.value)}>
                    <option value="">Seleccionar país</option>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                  <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>
              <div>
                <label className="block"><FieldLabel optional>Estado / Departamento / Provincia</FieldLabel>
                  <input className={inputCls} type="text" placeholder="Estado, departamento o provincia"
                    value={form.stateProvince} onChange={(e) => set('stateProvince', e.target.value)} />
                </label>
              </div>
              <div>
                <label className="block"><FieldLabel>Dirección</FieldLabel>
                  <input className={inputCls} type="text" placeholder="Calle, número, barrio"
                    value={form.address1} onChange={(e) => set('address1', e.target.value)} />
                </label>
              </div>
              <div>
                <label className="block"><FieldLabel optional>Dirección línea 2</FieldLabel>
                  <input className={inputCls} type="text" placeholder="Oficina, piso, apartamento"
                    value={form.address2} onChange={(e) => set('address2', e.target.value)} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block"><FieldLabel optional>Código postal</FieldLabel>
                    <input className={inputCls} type="text" placeholder="Código postal"
                      value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
                  </label>
                </div>
                <div>
                  <label className="block"><FieldLabel>Teléfono de contacto</FieldLabel>
                    <input className={inputCls} type="tel" placeholder="+57 300 000 0000"
                      value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Presencia digital ──────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block"><FieldLabel optional>Sitio web</FieldLabel>
                  <input className={inputCls} type="url" placeholder="https://tuorganizacion.org"
                    value={form.website} onChange={(e) => set('website', e.target.value)} />
                </label>
              </div>
              {[
                { field: 'instagram', label: 'Instagram', ph: '@usuario' },
                { field: 'linkedin',  label: 'LinkedIn',  ph: 'linkedin.com/company/...' },
                { field: 'socialX',   label: 'X (Twitter)', ph: '@usuario' },
                { field: 'facebook',  label: 'Facebook',  ph: 'facebook.com/...' },
              ].map(({ field, label, ph }) => (
                <div key={field}>
                  <label className="block"><FieldLabel optional>{label}</FieldLabel>
                    <input className={inputCls} type="text" placeholder={ph}
                      value={form[field as keyof FormData] as string}
                      onChange={(e) => set(field as keyof FormData, e.target.value)} />
                  </label>
                </div>
              ))}
              <p className="text-xs text-gray-400 leading-relaxed">
                Esta información se mostrará en tu perfil público para donantes y verificadores.
              </p>
            </div>
          )}

          {/* ── STEP 4: Impacto y alcance ──────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <FieldLabel>Áreas de intervención</FieldLabel>
                <p className="text-xs text-gray-400 mb-3">Selecciona todas las que apliquen.</p>
                <div className="flex flex-wrap gap-2">
                  {INTERVENTION_AREAS.map((a) => (
                    <PillToggle key={a.slug} label={a.label}
                      active={form.interventionAreas.includes(a.slug)}
                      onClick={() => toggleArr('interventionAreas', a.slug)} />
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel optional>Población objetivo</FieldLabel>
                <p className="text-xs text-gray-400 mb-3">Selecciona los grupos que atienden.</p>
                <div className="flex flex-wrap gap-2">
                  {TARGET_POPULATIONS.map((p) => (
                    <PillToggle key={p.slug} label={p.label}
                      active={form.targetPopulations.includes(p.slug)}
                      onClick={() => toggleArr('targetPopulations', p.slug)} />
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Alcance geográfico</FieldLabel>
                <div className="space-y-2">
                  {GEO_SCOPES.map((g) => (
                    <button key={g.value} type="button"
                      onClick={() => set('geographicScope', g.value)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition',
                        form.geographicScope === g.value
                          ? 'border-[#0F52BA] bg-[#0F52BA]/5'
                          : 'border-gray-200 hover:border-gray-300',
                      )}
                    >
                      <div>
                        <p className={cn('text-sm font-semibold', form.geographicScope === g.value ? 'text-[#0F52BA]' : 'text-gray-800')}>{g.label}</p>
                        <p className="text-xs text-gray-400">{g.desc}</p>
                      </div>
                      <div className={cn('w-4 h-4 rounded-full border-2 transition-colors', form.geographicScope === g.value ? 'border-[#0F52BA] bg-[#0F52BA]' : 'border-gray-300')} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: ODS y presupuesto ──────────────────────────── */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <FieldLabel optional>Alineación con los ODS</FieldLabel>
                <p className="text-xs text-gray-400 mb-3">Selecciona los Objetivos de Desarrollo Sostenible con los que se alinea tu organización.</p>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((n) => {
                    const active = form.odsGoals.includes(n);
                    return (
                      <button key={n} type="button" title={ODS_LABELS[n]}
                        onClick={() => toggleArr('odsGoals', n)}
                        className={cn(
                          'aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition border-2',
                          active ? 'text-white border-transparent' : 'text-gray-500 bg-gray-50 border-gray-200 hover:border-gray-300',
                        )}
                        style={active ? { backgroundColor: ODS_COLORS[n], borderColor: ODS_COLORS[n] } : {}}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                {form.odsGoals.length > 0 && (
                  <p className="text-xs text-[#0F52BA] mt-2 font-medium">
                    {form.odsGoals.sort((a,b)=>a-b).map(n => `ODS ${n}`).join(', ')}
                  </p>
                )}
              </div>
              <div>
                <FieldLabel optional>Presupuesto anual de operación</FieldLabel>
                <div className="space-y-2">
                  {BUDGET_RANGES.map((r) => (
                    <button key={r} type="button"
                      onClick={() => set('annualBudgetRange', r)}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl border text-sm text-left font-medium transition',
                        form.annualBudgetRange === r
                          ? 'border-[#0F52BA] bg-[#0F52BA]/5 text-[#0F52BA]'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300',
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 6: Rol y wallet ───────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <FieldLabel>Tu rol en la organización</FieldLabel>
                <div className="space-y-2">
                  {USER_ROLES.map(({ id, label, desc }) => (
                    <button key={id} type="button"
                      onClick={() => set('role', id)}
                      className={cn(
                        'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition',
                        form.role === id
                          ? 'border-[#0F52BA] bg-[#0F52BA]/5'
                          : 'border-gray-200 hover:border-gray-300',
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-semibold', form.role === id ? 'text-[#0F52BA]' : 'text-gray-900')}>{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                      <div className={cn('w-4 h-4 rounded-full border-2 transition-colors flex-shrink-0', form.role === id ? 'border-[#0F52BA] bg-[#0F52BA]' : 'border-gray-300')} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                <p className="text-sm font-semibold text-gray-900 mb-1">Autenticación con wallet Stellar</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  TrustBid usa wallets Stellar como método de autenticación. Compatible con Freighter, Albedo y otras. Tus claves privadas nunca salen de tu wallet.
                </p>
              </div>

              {error && (
                <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}

              <button
                type="button"
                disabled={connecting}
                onClick={handleRegister}
                className="w-full py-3.5 px-4 bg-[#0F52BA] hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm active:scale-[0.99] transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {connecting && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {connecting ? 'Conectando wallet…' : 'Conectar wallet y crear cuenta'}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className={cn('flex mt-8', step > 1 ? 'justify-between' : 'justify-end')}>
            {step > 1 && (
              <button type="button" onClick={() => setStep((s) => s - 1)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                Atrás
              </button>
            )}
            {step < TOTAL_STEPS && (
              <button type="button"
                disabled={!canProceed()}
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-2.5 rounded-xl bg-[#0F52BA] text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                Continuar
              </button>
            )}
          </div>

          {/* Sign in link */}
          <p className="text-center text-sm text-gray-400 mt-8">
            ¿Ya tienes cuenta?{' '}
            <button type="button" onClick={() => router.push('/login')}
              className="text-[#0F52BA] hover:underline font-semibold">
              Iniciar sesión
            </button>
          </p>

        </div>
      </div>
    </main>
  );
}
