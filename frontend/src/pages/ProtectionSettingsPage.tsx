import { useEffect, useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Save } from 'lucide-react';
import { useChannel } from '../context/ChannelContext';
import {
  useProtectionSettings,
  useUpdateProtectionSettings,
} from '../hooks/use-protection-settings';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { detectProtectionLevel } from '../lib/utils';
import { ApiError } from '../lib/api';
import {
  PROTECTION_PRESETS,
  type ProtectionLevel,
  type ProtectionSettings,
} from '../types/api';

const levelInfo: Record<
  ProtectionLevel,
  { title: string; description: string; icon: typeof Shield }
> = {
  LOW: {
    title: 'Düşük Koruma',
    description: 'Sadece bildirim gönderir, otomatik engelleme yapmaz.',
    icon: Shield,
  },
  MEDIUM: {
    title: 'Orta Koruma',
    description: 'Şüpheli kullanıcıları otomatik engeller, ban uygulamaz.',
    icon: ShieldCheck,
  },
  HIGH: {
    title: 'Yüksek Koruma',
    description: 'Agresif tespit ve otomatik ban ile maksimum koruma.',
    icon: ShieldAlert,
  },
};

export function ProtectionSettingsPage() {
  const { activeChannel } = useChannel();
  const { data, isLoading, error } = useProtectionSettings(activeChannel?.id);
  const updateMutation = useUpdateProtectionSettings(activeChannel?.id);

  const [settings, setSettings] = useState<ProtectionSettings | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ProtectionLevel>('MEDIUM');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setSettings(data);
      setSelectedLevel(detectProtectionLevel(data));
    }
  }, [data]);

  const handleLevelSelect = (level: ProtectionLevel) => {
    setSelectedLevel(level);
    if (settings) {
      setSettings({ ...settings, ...PROTECTION_PRESETS[level] });
    }
  };

  const handleToggle = (key: keyof ProtectionSettings) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaved(false);
    try {
      const updated = await updateMutation.mutateAsync({
        autoBlockEnabled: settings.autoBlockEnabled,
        autoBanEnabled: settings.autoBanEnabled,
        alertOnDetection: settings.alertOnDetection,
        riskScoreThreshold: settings.riskScoreThreshold,
        maxMessagesPerMinute: settings.maxMessagesPerMinute,
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // mutation error handled by isError if needed
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Ayarlar yükleniyor..." />;
  }

  if (error || !settings) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error instanceof ApiError
          ? error.message
          : 'Koruma ayarları yüklenemedi.'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white">Koruma Seviyesi</h2>
        <p className="mt-1 text-sm text-muted">
          Kanalınız için uygun koruma seviyesini seçin
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(levelInfo) as ProtectionLevel[]).map((level) => {
          const info = levelInfo[level];
          const Icon = info.icon;
          const isSelected = selectedLevel === level;

          return (
            <button
              key={level}
              type="button"
              onClick={() => handleLevelSelect(level)}
              className={`rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? 'border-kick bg-kick/10 ring-1 ring-kick/30'
                  : 'border-border bg-surface-elevated hover:border-border hover:bg-surface-hover'
              }`}
            >
              <Icon
                className={`h-6 w-6 ${isSelected ? 'text-kick' : 'text-muted'}`}
              />
              <p className="mt-3 font-semibold text-white">{info.title}</p>
              <p className="mt-1 text-xs text-muted">{info.description}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-white">
          Detaylı Ayarlar
        </h2>
        <div className="space-y-5">
          {[
            {
              key: 'alertOnDetection' as const,
              label: 'Tespit Bildirimi',
              desc: 'Bot tespit edildiğinde bildirim gönder',
            },
            {
              key: 'autoBlockEnabled' as const,
              label: 'Otomatik Engelleme',
              desc: 'Risk eşiğini aşan kullanıcıları otomatik engelle',
            },
            {
              key: 'autoBanEnabled' as const,
              label: 'Otomatik Ban',
              desc: 'Kritik risk skorunda otomatik ban uygula',
            },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-xl bg-surface p-4"
            >
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(key)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  settings[key] ? 'bg-kick' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                    settings[key] ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}

          <div className="space-y-3 rounded-xl bg-surface p-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-white">Risk Skoru Eşiği</span>
                <span className="font-medium text-kick">
                  {settings.riskScoreThreshold}
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={95}
                value={settings.riskScoreThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    riskScoreThreshold: Number(e.target.value),
                  })
                }
                className="mt-2 w-full accent-kick"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-white">Dakika Başına Max Mesaj</span>
                <span className="font-medium text-kick">
                  {settings.maxMessagesPerMinute}
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                value={settings.maxMessagesPerMinute}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxMessagesPerMinute: Number(e.target.value),
                  })
                }
                className="mt-2 w-full accent-kick"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} isLoading={updateMutation.isPending}>
          <Save className="h-4 w-4" />
          Ayarları Kaydet
        </Button>
        {saved && (
          <span className="text-sm text-kick">Ayarlar kaydedildi!</span>
        )}
        {updateMutation.isError && (
          <span className="text-sm text-red-400">
            {updateMutation.error instanceof ApiError
              ? updateMutation.error.message
              : 'Kaydetme başarısız.'}
          </span>
        )}
      </div>
    </div>
  );
}
