import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChannel } from '../../context/ChannelContext';
import { Button } from '../ui/Button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { channels, activeChannel, setActiveChannelId } = useChannel();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-muted hover:bg-surface-hover lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {channels.length > 0 && (
            <div className="relative hidden sm:block">
              <select
                value={activeChannel?.id || ''}
                onChange={(e) => setActiveChannelId(e.target.value)}
                className="appearance-none rounded-xl border border-border bg-surface-elevated py-2 pl-3 pr-8 text-sm text-white outline-none focus:border-kick/50"
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.channelName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>
          )}

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kick/15 text-sm font-bold text-kick">
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm text-muted">{user?.displayName}</span>
          </div>

          <Button variant="ghost" size="sm" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Çıkış</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
