import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Kanal koruma durumunuzun genel özeti',
  },
  '/bot-activity': {
    title: 'Bot Aktivite',
    subtitle: 'Şüpheli kullanıcılar ve bot hareketleri',
  },
  '/protection': {
    title: 'Koruma Ayarları',
    subtitle: 'Bot koruma seviyesi ve otomasyon ayarları',
  },
  '/logs': {
    title: 'Log / Geçmiş',
    subtitle: 'Sistem işlem geçmişi',
  },
  '/profile': {
    title: 'Profil',
    subtitle: 'Hesap ve Kick kanal bilgileri',
  },
};

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const pageInfo = pageTitles[pathname] || { title: 'Panel' };

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
