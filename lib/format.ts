import i18n from './i18n';

const locale = () => (i18n.language === 'nb' ? 'nb-NO' : 'en-GB');
const tr = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts) as unknown as string;

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const fmtTime = (d: string | Date) =>
  new Date(d).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });

export const fmtDateTime = (d: string | Date) => `${fmtDate(d)} · ${fmtTime(d)}`;

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return tr('time.now');
  if (min < 60) return tr('time.minutes', { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return tr('time.hours', { n: h });
  const d = Math.floor(h / 24);
  if (d < 7) return tr('time.days', { n: d });
  return fmtDate(iso);
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '?';

export const authorLine = (authors: string[] | null | undefined) => (authors ?? []).join(', ');
