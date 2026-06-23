import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  Users,
  ScrollText,
  UserCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/bot-activity', icon: Users, label: 'Bot Aktivite' },
  { to: '/protection', icon: Shield, label: 'Koruma Ayarları' },
  { to: '/logs', icon: ScrollText, label: 'Log / Geçmiş' },
  { to: '/profile', icon: UserCircle, label: 'Profil' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface-elevated transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-kick/15">
              <ShieldCheck className="h-5 w-5 text-kick" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Kick Anti-Bot</p>
              <p className="text-[10px] text-muted">Koruma Paneli</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-surface-hover lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-kick/10 text-kick'
                    : 'text-muted hover:bg-surface-hover hover:text-white',
                )
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 rounded-xl bg-surface-hover px-3 py-2">
            <Shield className="h-4 w-4 text-kick" />
            <div>
              <p className="text-xs font-medium text-white">Koruma Aktif</p>
              <p className="text-[10px] text-muted">Sistem izlemede</p>
            </div>
            <span className="ml-auto h-2 w-2 rounded-full bg-kick animate-pulse" />
          </div>
        </div>
      </aside>
    </>
  );
}
