import { Search, Menu, Bell, Globe } from 'lucide-react';
import { Input } from '../ui/Input';
import { useLang, LANGUAGES, LANG_LABELS } from '../../hooks/useLang';
import { cn } from '../../lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMobileMenu: () => void;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, onMobileMenu, search, onSearchChange, searchPlaceholder, actions }: HeaderProps) {
  const { lang, setLang, t } = useLang();

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-ink-200">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
        <button
          onClick={onMobileMenu}
          className="lg:hidden rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 transition-colors"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-semibold text-ink-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-ink-500 truncate hidden sm:block">{subtitle}</p>}
        </div>

        {onSearchChange && (
          <div className="hidden md:block w-64">
            <Input
              icon={<Search size={15} />}
              placeholder={searchPlaceholder ?? t('common.search')}
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {actions}

          {/* Language switcher — driven by LANGUAGES registry */}
          <div className="flex items-center rounded-lg bg-ink-100 p-0.5 gap-0.5">
            <Globe size={14} className="ml-1 text-ink-400" />
            {LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  'px-2 py-1 rounded-md text-xs font-semibold transition-all',
                  lang === l ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                )}
              >
                {LANG_LABELS[l].short}
              </button>
            ))}
          </div>

          <button className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100 transition-colors" aria-label={t('common.close')}>
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
          </button>
        </div>
      </div>
      {onSearchChange && (
        <div className="md:hidden px-4 pb-3">
          <Input
            icon={<Search size={15} />}
            placeholder={searchPlaceholder ?? t('common.search')}
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
    </header>
  );
}
