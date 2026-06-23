import type { ReactNode } from 'react';
import { useChannel } from '../context/ChannelContext';
import { LoadingSpinner, EmptyState } from './ui/LoadingSpinner';

export function ChannelGate({ children }: { children: ReactNode }) {
  const { activeChannel, isLoading } = useChannel();

  if (isLoading) {
    return <LoadingSpinner label="Kanallar yükleniyor..." />;
  }

  if (!activeChannel) {
    return (
      <EmptyState
        title="Bağlı Kick kanalı yok"
        description="Profil sayfasından kanal ekleyebilir veya yöneticinizle iletişime geçebilirsiniz."
      />
    );
  }

  return children;
}
