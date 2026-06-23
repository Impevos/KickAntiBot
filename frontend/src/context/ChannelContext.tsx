import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { channelService } from '../services/api-services';
import { useAuth } from './AuthContext';
import type { Channel } from '../types/api';

interface ChannelContextValue {
  channels: Channel[];
  activeChannel: Channel | null;
  setActiveChannelId: (id: string) => void;
  isLoading: boolean;
  refreshChannels: () => Promise<void>;
}

const ChannelContext = createContext<ChannelContextValue | null>(null);

export function ChannelProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshChannels = useCallback(async () => {
    if (!isLoggedIn) {
      setChannels([]);
      setActiveChannelId(null);
      return;
    }

    setIsLoading(true);
    try {
      const list = await channelService.getChannels();
      setChannels(list);
      const saved = localStorage.getItem('activeChannelId');
      const valid = list.find((c) => c.id === saved);
      setActiveChannelId(valid?.id ?? list[0]?.id ?? null);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refreshChannels();
  }, [refreshChannels]);

  const setActiveChannelIdHandler = (id: string) => {
    setActiveChannelId(id);
    localStorage.setItem('activeChannelId', id);
  };

  const activeChannel =
    channels.find((c) => c.id === activeChannelId) ?? channels[0] ?? null;

  return (
    <ChannelContext.Provider
      value={{
        channels,
        activeChannel,
        setActiveChannelId: setActiveChannelIdHandler,
        isLoading,
        refreshChannels,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannel() {
  const ctx = useContext(ChannelContext);
  if (!ctx) throw new Error('useChannel must be used within ChannelProvider');
  return ctx;
}
