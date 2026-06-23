import { useEffect, useState } from 'react';
import { User, Tv, Mail, Calendar, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api-services';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate } from '../lib/utils';
import type { User as UserType } from '../types/api';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    authService
      .getMe()
      .then((data) => {
        setProfile(data);
        setDisplayName(data.displayName);
        setAvatarUrl(data.avatarUrl || '');
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      await authService.updateProfile({
        displayName,
        avatarUrl: avatarUrl || undefined,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profile) {
    return <LoadingSpinner label="Profil yükleniyor..." />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-kick/15 text-3xl font-bold text-kick">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-white">{profile.displayName}</h2>
            <p className="text-sm text-muted">{profile.email}</p>
            <span className="mt-2 inline-block rounded-md bg-kick/10 px-2 py-0.5 text-xs font-medium text-kick">
              {profile.role}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
          <User className="h-4 w-4 text-kick" />
          Hesap Bilgileri
        </h2>
        <div className="space-y-4">
          <Input
            label="Görünür Ad"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Avatar URL"
            placeholder="https://..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
              <Mail className="h-4 w-4 text-muted" />
              <div>
                <p className="text-xs text-muted">E-posta</p>
                <p className="text-sm text-white">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
              <Calendar className="h-4 w-4 text-muted" />
              <div>
                <p className="text-xs text-muted">Kayıt Tarihi</p>
                <p className="text-sm text-white">
                  {profile.createdAt ? formatDate(profile.createdAt) : '-'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} isLoading={isSaving}>
              <Save className="h-4 w-4" />
              Profili Güncelle
            </Button>
            {saved && (
              <span className="text-sm text-kick">Profil güncellendi!</span>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
          <Tv className="h-4 w-4 text-kick" />
          Bağlı Kick Kanalları
          <span className="ml-auto text-sm font-normal text-muted">
            {profile.channels?.length ?? profile.channelCount ?? 0} kanal
          </span>
        </h2>
        {profile.channels && profile.channels.length > 0 ? (
          <div className="space-y-3">
            {profile.channels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center gap-4 rounded-xl bg-surface p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kick/10 text-sm font-bold text-kick">
                  {channel.channelName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{channel.channelName}</p>
                  <p className="text-xs text-muted">@{channel.kickChannelId}</p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    channel.isActive
                      ? 'bg-kick/10 text-kick'
                      : 'bg-zinc-500/10 text-zinc-400'
                  }`}
                >
                  {channel.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted">
            Henüz bağlı Kick kanalı bulunmuyor.
          </p>
        )}
      </Card>
    </div>
  );
}
