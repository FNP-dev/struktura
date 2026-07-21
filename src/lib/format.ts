export function initials(first: string, last: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

export function fullName(e: { first_name: string; last_name: string }): string {
  return `${e.first_name} ${e.last_name}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatSalary(min: number | null, max: number | null): string {
  const fmt = (n: number) => new Intl.NumberFormat('pl-PL').format(n);
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)} PLN`;
  if (min != null) return `od ${fmt(min)} PLN`;
  if (max != null) return `do ${fmt(max)} PLN`;
  return '—';
}

export function tenureYears(hireDate: string | null): string {
  if (!hireDate) return '—';
  const years = (Date.now() - new Date(hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years < 1) return '< 1 rok';
  const y = Math.floor(years);
  if (y === 1) return '1 rok';
  if (y < 5) return `${y} lata`;
  return `${y} lat`;
}
