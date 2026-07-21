import {
  Crown, Cpu, Code, Monitor, Server, Package, Compass, Palette, TrendingUp,
  Handshake, Megaphone, Users, UserPlus, Briefcase, Landmark, Calculator,
  Building2, type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  crown: Crown,
  cpu: Cpu,
  code: Code,
  monitor: Monitor,
  server: Server,
  package: Package,
  compass: Compass,
  palette: Palette,
  'trending-up': TrendingUp,
  handshake: Handshake,
  megaphone: Megaphone,
  users: Users,
  'user-plus': UserPlus,
  briefcase: Briefcase,
  landmark: Landmark,
  calculator: Calculator,
  building: Building2,
};

export const DEPARTMENT_ICONS = ICON_MAP;

export function getDepartmentIcon(name?: string | null): LucideIcon {
  if (!name) return Building2;
  return ICON_MAP[name] ?? Building2;
}

// Tailwind gradient per department level for visual hierarchy
export const LEVEL_STYLES: Record<number, { label: string; ring: string; bg: string; text: string }> = {
  0: { label: 'Zarząd', ring: 'ring-brand-300', bg: 'bg-brand-50', text: 'text-brand-700' },
  1: { label: 'Pion', ring: 'ring-sky-300', bg: 'bg-sky-50', text: 'text-sky-700' },
  2: { label: 'Dział', ring: 'ring-violet-300', bg: 'bg-violet-50', text: 'text-violet-700' },
  3: { label: 'Zespół', ring: 'ring-ink-300', bg: 'bg-ink-100', text: 'text-ink-700' },
};

export function levelStyle(level: number) {
  return LEVEL_STYLES[level] ?? LEVEL_STYLES[2];
}
