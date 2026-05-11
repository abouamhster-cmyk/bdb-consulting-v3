'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, Building2, Settings, MessageCircle, 
  Eye, Activity, Calendar, Palette, Sparkles, 
  Database, FolderKanban, Kanban, Bell, Webhook,
  HelpCircle, Shield, FileText, LogOut, Menu, X,
  ChevronLeft, ChevronRight, ChevronDown, CreditCard,
  Users, Key, Target, BarChart3, Rocket, User 
} from 'lucide-react';

// Composant User avant son utilisation
//const UserIcon = ({ className }: { className?: string }) => (
//  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
 //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//  </svg>
//);

// MODE BYPASS - METTRE A false EN PRODUCTION
const BYPASS_AUTH = true;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    campaign: true,
    settings: false,
    support: false,
    legal: false,
    admin: false
  });
  const pathname = usePathname();
  const router = useRouter();

  const isBypassMode = BYPASS_AUTH;
  const user = isBypassMode ? { id: 'bypass-user', email: 'demo@bdb-consulting.com' } : null;

  // Routes où le menu ne doit PAS s'afficher (pages publiques)
  const publicRoutes = ['/', '/auth', '/pricing', '/legal/privacy', '/legal/terms'];
  const isPublicPage = publicRoutes.includes(pathname);

  // Vérifier l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      if (isBypassMode) {
        setIsAuthenticated(true);
        setLoadingAuth(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user && !isPublicPage) {
        router.replace('/auth');
      } else if (user) {
        setIsAuthenticated(true);
      }
      
      setLoadingAuth(false);
    };

    checkAuth();
  }, [pathname]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    if (!isBypassMode) {
      await supabase.auth.signOut();
    }
    router.replace('/auth');
  };

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (href: string) => pathname === href;

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  // Menu principal
  const mainNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Veille', href: '/monitoring', icon: Bell },
  ];

  // Menu Campagne
  const campaignNav = [
    { name: 'Configuration', href: '/setup', icon: Building2 },
    { name: 'Paramètres', href: '/params', icon: Target },
    { name: 'Veille concurrentielle', href: '/competitive-intelligence', icon: Eye },
    { name: 'Squelette', href: '/skeleton', icon: Kanban },
    { name: 'Workflow', href: '/campaign-vertical', icon: Sparkles },
    { name: 'Campagnes', href: '/campaigns', icon: FolderKanban },
  ];

  // Menu Paramètres
  const settingsNav = [
    { name: 'Profil', href: '/settings/profile', icon: User },
    { name: 'Sécurité', href: '/settings/security', icon: Shield },
    { name: 'Facturation', href: '/settings/billing', icon: CreditCard },
    { name: 'Notifications', href: '/settings/notifications', icon: Bell },
    { name: 'Équipe', href: '/settings/team', icon: Users },
    { name: 'Clés API', href: '/settings/api-keys', icon: Key },
    { name: 'Intégrations', href: '/settings/integrations', icon: Webhook },
    { name: 'Personnalisation', href: '/settings/branding', icon: Palette },
    { name: 'Données', href: '/settings/data', icon: Database },
    { name: 'Activité', href: '/settings/activity', icon: Activity },
  ];

  // Menu Support
  const supportNav = [
    { name: "Centre d'aide", href: '/help', icon: HelpCircle },
    { name: 'Support', href: '/support', icon: MessageCircle },
  ];

  // Menu Légal
  const legalNav = [
    { name: 'Tarifs', href: '/pricing', icon: CreditCard },
    { name: 'Confidentialité', href: '/legal/privacy', icon: Shield },
    { name: 'CGU', href: '/legal/terms', icon: FileText },
  ];

  // Menu Admin (visible uniquement pour admin)
  const adminNav = [
    { name: 'Administration', href: '/admin', icon: Shield },
    { name: 'Paiements', href: '/admin/payments', icon: CreditCard },
  ];

  const getInitials = () => 'D';
  const getDisplayName = () => 'Démo';

  // Pendant le chargement de l'auth, on peut afficher un loader ou rien
  if (loadingAuth && !isPublicPage) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Si on est sur une page publique OU non authentifié, on affiche juste le contenu sans menu
  if (isPublicPage || (!isAuthenticated && !isBypassMode)) {
    return <>{children}</>;
  }

  // Sinon, on affiche le layout complet avec le menu
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar - Version améliorée avec fond sombre/gradient */}
      <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl transition-all duration-300 z-40 ${sidebarWidth} hidden md:flex md:flex-col`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-white text-base truncate">BDB Consulting</span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white flex-shrink-0"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          {/* Main nav */}
          <div className="space-y-0.5 mb-4">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Campagne Submenu */}
          <div className="mb-2">
            <button
              onClick={() => toggleSubmenu('campaign')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-slate-300 hover:bg-slate-700 hover:text-white ${!isCollapsed ? '' : 'justify-center'}`}
            >
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="flex-shrink-0" />
                {!isCollapsed && <span>Campagne</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown size={16} className={`transition-transform text-slate-400 ${openSubmenus.campaign ? 'rotate-180' : ''}`} />
              )}
            </button>
            {(!isCollapsed && openSubmenus.campaign) && (
              <div className="ml-4 pl-2 border-l border-slate-700 space-y-0.5 mt-1">
                {campaignNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        active
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paramètres Submenu */}
          <div className="mb-2">
            <button
              onClick={() => toggleSubmenu('settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-slate-300 hover:bg-slate-700 hover:text-white ${!isCollapsed ? '' : 'justify-center'}`}
            >
              <div className="flex items-center gap-3">
                <Settings size={18} className="flex-shrink-0" />
                {!isCollapsed && <span>Paramètres</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown size={16} className={`transition-transform text-slate-400 ${openSubmenus.settings ? 'rotate-180' : ''}`} />
              )}
            </button>
            {(!isCollapsed && openSubmenus.settings) && (
              <div className="ml-4 pl-2 border-l border-slate-700 space-y-0.5 mt-1">
                {settingsNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        active
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Support Submenu */}
          <div className="mb-2">
            <button
              onClick={() => toggleSubmenu('support')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-slate-300 hover:bg-slate-700 hover:text-white ${!isCollapsed ? '' : 'justify-center'}`}
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className="flex-shrink-0" />
                {!isCollapsed && <span>Aide & Support</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown size={16} className={`transition-transform text-slate-400 ${openSubmenus.support ? 'rotate-180' : ''}`} />
              )}
            </button>
            {(!isCollapsed && openSubmenus.support) && (
              <div className="ml-4 pl-2 border-l border-slate-700 space-y-0.5 mt-1">
                {supportNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        active
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Légal Submenu */}
          <div className="mb-2">
            <button
              onClick={() => toggleSubmenu('legal')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-slate-300 hover:bg-slate-700 hover:text-white ${!isCollapsed ? '' : 'justify-center'}`}
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="flex-shrink-0" />
                {!isCollapsed && <span>Légal</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown size={16} className={`transition-transform text-slate-400 ${openSubmenus.legal ? 'rotate-180' : ''}`} />
              )}
            </button>
            {(!isCollapsed && openSubmenus.legal) && (
              <div className="ml-4 pl-2 border-l border-slate-700 space-y-0.5 mt-1">
                {legalNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        active
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin Submenu */}
          <div className="mb-2">
            <button
              onClick={() => toggleSubmenu('admin')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-slate-300 hover:bg-slate-700 hover:text-white ${!isCollapsed ? '' : 'justify-center'}`}
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="flex-shrink-0" />
                {!isCollapsed && <span>Admin</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown size={16} className={`transition-transform text-slate-400 ${openSubmenus.admin ? 'rotate-180' : ''}`} />
              )}
            </button>
            {(!isCollapsed && openSubmenus.admin) && (
              <div className="ml-4 pl-2 border-l border-slate-700 space-y-0.5 mt-1">
                {adminNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        active
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-sm font-semibold text-white">{getInitials()}</span>
            </div>
            
            {!isCollapsed ? (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{getDisplayName()}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 mt-0.5"
                >
                  <LogOut size={12} /> Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                title="Déconnexion"
              >
                <LogOut size={16} className="text-slate-400 hover:text-red-400" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setIsMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-800 to-slate-900 z-50 md:hidden shadow-xl flex flex-col">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-bold">B</span>
                </div>
                <span className="font-semibold text-white">BDB Consulting</span>
              </div>
              <button onClick={() => setIsMobileOpen(false)} className="p-1 rounded-lg hover:bg-slate-700">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 px-3">
              {[...mainNav, ...campaignNav, ...settingsNav, ...supportNav, ...legalNav, ...adminNav].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">{getInitials()}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{getDisplayName()}</p>
                  <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1">
                    <LogOut size={12} /> Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Mobile Menu Button */}
      {isMobile && !isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-md border border-slate-700 md:hidden"
        >
          <Menu size={20} className="text-white" />
        </button>
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 ${!isMobile && (isCollapsed ? 'md:ml-20' : 'md:ml-64')}`}>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}