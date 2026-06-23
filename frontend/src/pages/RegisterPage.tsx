import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ApiError } from '../lib/api';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, displayName);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Kayıt oluşturulamadı. Lütfen tekrar deneyin.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kick/15">
              <ShieldCheck className="h-7 w-7 text-kick" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Kayıt Ol</h1>
          <p className="mt-1 text-sm text-muted">
            Kick Anti-Bot koruma paneline katılın
          </p>
        </div>

        {success ? (
          <div className="rounded-xl border border-kick/30 bg-kick/10 px-4 py-6 text-center">
            <p className="font-medium text-kick">Kayıt başarılı!</p>
            <p className="mt-1 text-sm text-muted">
              Giriş sayfasına yönlendiriliyorsunuz...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Görünür Ad"
              placeholder="Yayıncı Adınız"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
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
              placeholder="En az 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Şifre Tekrar"
              type="password"
              placeholder="Şifrenizi tekrar girin"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Kayıt Ol
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted">
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="font-medium text-kick hover:underline">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}
