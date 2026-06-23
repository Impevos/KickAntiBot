import { useEffect, useState } from 'react';
import {
  User,
  Tv,
  Mail,
  Calendar,
  Save,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChannel } from '../context/ChannelContext';
import { authService, channelService } from '../services/api-services';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate } from '../lib/utils';
import { ApiError } from '../lib/api';
import type { Channel, User as UserType } from '../types/api';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { refreshChannels } = useChannel();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [kickChannelId, setKickChannelId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [saved, setSaved] = useState(false);
  const [channelError, setChannelError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [channelActionLoading, setChannelActionLoading] = useState<
    string | null
  >(null);

  const loadProfile = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await authService.getMe();
      setProfile(data);
      setDisplayName(data.displayName);
      setAvatarUrl(data.avatarUrl || '');
    } catch (err: unknown) {
      setLoadError(
        err instanceof ApiError ? err.message : 'Profil yüklenemedi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
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

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setChannelError('');
    setIsAddingChannel(true);
    try {
      await channelService.createChannel({ kickChannelId, channelName });
      setKickChannelId('');
      setChannelName('');
      await Promise.all([refreshUser(), refreshChannels(), loadProfile()]);
    } catch (err: unknown) {
      setChannelError(
        err instanceof ApiError ? err.message : 'Kanal eklenemedi.',
      );
    } finally {
      setIsAddingChannel(false);
    }
  };

  const startEditChannel = (channel: Channel) => {
    setEditingChannelId(channel.id);
    setEditChannelName(channel.channelName);
    setEditIsActive(channel.isActive);
    setChannelError('');
  };

  const cancelEditChannel = () => {
    setEditingChannelId(null);
    setEditChannelName('');
    setEditIsActive(true);
  };

  const handleUpdateChannel = async (id: string) => {
    setChannelActionLoading(id);
    setChannelError('');
    try {
      await channelService.updateChannel(id, {
        channelName: editChannelName,
        isActive: editIsActive,
      });
      cancelEditChannel();
      await Promise.all([refreshUser(), refreshChannels(), loadProfile()]);
    } catch (err: unknown) {
      setChannelError(
        err instanceof ApiError ? err.message : 'Kanal güncellenemedi.',
      );
    } finally {
      setChannelActionLoading(null);
    }
  };

  const handleDeleteChannel = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" kanalını silmek istediğinize emin misiniz?`)) {
      return;
    }
    setChannelActionLoading(id);
    setChannelError('');
    try {
      await channelService.deleteChannel(id);
      await Promise.all([refreshUser(), refreshChannels(), loadProfile()]);
    } catch (err: unknown) {
      setChannelError(
        err instanceof ApiError ? err.message : 'Kanal silinemedi.',
      );
    } finally {
      setChannelActionLoading(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Profil yükleniyor..." />;
  }

  if (loadError || !profile) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {loadError || 'Profil yüklenemedi.'}
      </div>
    );
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
                className="rounded-xl bg-surface p-4"
              >
                {editingChannelId === channel.id ? (
                  <div className="space-y-3">
                    <Input
                      label="Kanal Görünen Adı"
                      value={editChannelName}
                      onChange={(e) => setEditChannelName(e.target.value)}
                    />
                    <label className="flex items-center gap-2 text-sm text-white">
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        className="accent-kick"
                      />
                      Kanal aktif
                    </label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateChannel(channel.id)}
                        isLoading={channelActionLoading === channel.id}
                      >
                        <Check className="h-4 w-4" />
                        Kaydet
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditChannel}
                      >
                        <X className="h-4 w-4" />
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
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
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditChannel(channel)}
                        className="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-white"
                        title="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteChannel(channel.id, channel.channelName)
                        }
                        disabled={channelActionLoading === channel.id}
                        className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted">
            Henüz bağlı Kick kanalı bulunmuyor.
          </p>
        )}

        <form onSubmit={handleAddChannel} className="mt-6 space-y-3 border-t border-border pt-6">
          <p className="text-sm font-medium text-white">Yeni Kanal Ekle</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Kick Kanal ID (slug)"
              placeholder="kanal-adi"
              value={kickChannelId}
              onChange={(e) => setKickChannelId(e.target.value)}
              required
            />
            <Input
              label="Kanal Görünen Adı"
              placeholder="Kanal Adım"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              required
            />
          </div>
          {channelError && (
            <p className="text-sm text-red-400">{channelError}</p>
          )}
          <Button type="submit" isLoading={isAddingChannel}>
            <Plus className="h-4 w-4" />
            Kanal Ekle
          </Button>
        </form>
      </Card>
    </div>
  );
}
