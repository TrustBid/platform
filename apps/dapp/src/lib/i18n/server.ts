import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config';
import { dictionaries } from './dictionaries';

/** Locale actual leído de la cookie (para Server Components). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/** `t` para Server Components. Re-render automático al cambiar de idioma (router.refresh). */
export async function getServerT(): Promise<(key: string) => string> {
  const locale = await getLocale();
  return (key: string) =>
    dictionaries[locale][key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
}
