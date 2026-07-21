import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AppRole } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Network, Shield, Users, User, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

type Mode = 'login' | 'signup';

const ROLE_OPTIONS: { key: AppRole; label: string; description: string; icon: typeof Shield }[] = [
  { key: 'employee', label: 'Pracownik', description: 'Odczyt struktury, dokumentów i procesów', icon: User },
  { key: 'hr', label: 'HR', description: 'Zarządzanie pracownikami i dokumentami', icon: Users },
  { key: 'admin', label: 'Administrator', description: 'Pełny dostęp (wymaga nadania przez admina)', icon: Shield },
];

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email.trim(), password);
        if (err) {
          setError(
            err.includes('Invalid login')
              ? 'Nieprawidłowy email lub hasło.'
              : err.includes('not confirmed')
              ? 'Konto nie zostało potwierdzone.'
              : err
          );
        }
      } else {
        if (password.length < 6) {
          setError('Hasło musi mieć co najmniej 6 znaków.');
          setBusy(false);
          return;
        }
        if (selectedRole === 'admin') {
          setError('Rola Administrator nie jest dostępna przy samodzielnej rejestracji. Wybierz Pracownik lub HR, a administrator nadá rolę po zalogowaniu.');
          setBusy(false);
          return;
        }
        const { error: err } = await signUp(email.trim(), password, displayName.trim() || email.split('@')[0], selectedRole);
        if (err) {
          setError(err.includes('already') ? 'Konto z tym adresem już istnieje. Zaloguj się.' : err);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (role: AppRole) => {
    setMode('login');
    if (role === 'admin') {
      setEmail('admin@nordtech.pl');
    } else if (role === 'hr') {
      setEmail('hr@nordtech.pl');
    } else {
      setEmail('pracownik@nordtech.pl');
    }
    setPassword('NordtechOrg2026!Secure');
    setError(null);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-48 w-48 rounded-full bg-brand-400/10 blur-2xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
            <Network size={20} />
          </div>
          <div>
            <p className="font-semibold">Nordtech Solutions</p>
            <p className="text-xs text-white/50">Struktura organizacyjna</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
            Zarządzaj strukturą<br />organizacyjną firmy
          </h1>
          <p className="mt-4 text-white/60 max-w-md">
            Kompleksowy panel: pracownicy, działy, organigram, procesy, dokumenty i raporty —
            z kontrolą dostępu opartą na rolach.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: Network, text: 'Wizualny organigram i hierarchia działów' },
              { icon: Users, text: 'Katalog pracowników z kompetencjami' },
              { icon: Shield, text: 'Role: Administrator, HR, Pracownik' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10">
                  <f.icon size={15} />
                </span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Nordtech Solutions Sp. z o.o.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-ink-100">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Network size={20} />
            </div>
            <div>
              <p className="font-semibold text-ink-900">Nordtech Solutions</p>
              <p className="text-xs text-ink-400">Struktura organizacyjna</p>
            </div>
          </div>

          <div className="card p-6 sm:p-8 animate-scale-in">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-ink-900">{mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}</h2>
              <p className="text-sm text-ink-500 mt-1">
                {mode === 'login' ? 'Wprowadź dane, aby przejść do panelu.' : 'Wybierz rolę i wypełnij formularz.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <Input
                  label="Imię i nazwisko"
                  placeholder="np. Jan Kowalski"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              )}

              <Input
                label="Email"
                type="email"
                placeholder="ty@firma.pl"
                icon={<Mail size={15} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <div>
                <label className="label">Hasło</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-9 pr-9"
                    placeholder={mode === 'signup' ? 'Min. 6 znaków' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="label">Rola w systemie</label>
                  <div className="space-y-2">
                    {ROLE_OPTIONS.map((r) => {
                      const Icon = r.icon;
                      const disabled = r.key === 'admin';
                      return (
                        <button
                          key={r.key}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedRole(r.key)}
                          className={cn(
                            'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                            selectedRole === r.key
                              ? 'border-brand-300 bg-brand-50/50 ring-1 ring-brand-100'
                              : 'border-ink-200 hover:border-ink-300',
                            disabled && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <span className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                            selectedRole === r.key ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'
                          )}>
                            <Icon size={15} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-ink-900">{r.label}</p>
                            <p className="text-xs text-ink-500">{r.description}</p>
                          </div>
                          {disabled && <Badge variant="neutral" size="sm">Zablokowane</Badge>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={busy}>
                {busy ? 'Przetwarzanie…' : mode === 'login' ? 'Zaloguj się' : 'Zarejestruj'}
                {!busy && <ArrowRight size={16} />}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-ink-500">
              {mode === 'login' ? (
                <>Nie masz konta?{' '}
                  <button onClick={() => { setMode('signup'); setError(null); }} className="font-medium text-brand-600 hover:text-brand-700">
                    Zarejestruj się
                  </button>
                </>
              ) : (
                <>Masz już konto?{' '}
                  <button onClick={() => { setMode('login'); setError(null); }} className="font-medium text-brand-600 hover:text-brand-700">
                    Zaloguj się
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Demo accounts */}
          <div className="mt-5 card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2 flex items-center gap-1.5">
              <Sparkles size={12} /> Konta demo (kliknij, aby wypełnić)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'hr', 'employee'] as AppRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => fillDemo(r)}
                  className="rounded-lg border border-ink-200 px-2 py-1.5 text-xs font-medium text-ink-600 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 transition-all"
                >
                  {r === 'admin' ? 'Administrator' : r === 'hr' ? 'HR' : 'Pracownik'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ink-400 mt-2">Hasło dla wszystkich kont demo: <code className="text-ink-600">NordtechOrg2026!Secure</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
