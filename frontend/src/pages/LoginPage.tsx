import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ApiError } from '../lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Giriş yapılamadı. Lütfen tekrar deneyin.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-surface-elevated p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kick/15">
            <ShieldCheck className="h-6 w-6 text-kick" />
          </div>
          <span className="text-xl font-bold text-white">Kick Anti-Bot</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Kick kanalınızı
            <br />
            <span className="text-kick">bot saldırılarından</span> koruyun
          </h2>
          <p className="max-w-md text-muted">
            Gerçek zamanlı bot tespiti, otomatik koruma ve detaylı aktivite
            raporları ile yayınlarınızı güvende tutun.
          </p>
        </div>
        <p className="text-xs text-muted">© 2026 Kick Anti-Bot Koruma Sistemi</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="mb-4 flex justify-center lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kick/15">
                <ShieldCheck className="h-7 w-7 text-kick" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">Giriş Yap</h1>
            <p className="mt-1 text-sm text-muted">
              Hesabınıza giriş yaparak panele erişin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Şifre"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Giriş Yap
            </Button>
          </form>

          <p className="text-center text-sm text-muted">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="font-medium text-kick hover:underline">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
