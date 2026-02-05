import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import {
  BarChart3, QrCode, FileText, Settings, Users, DollarSign, Shield, Package, Facebook,
  ToggleLeft, ToggleRight, Moon, Sun, LogOut, User, ChevronUp, ChevronDown, UserCheck, Tag, CheckSquare, CircleDollarSign, ChartNoAxesCombined, Target, Store, Calendar, TrendingUp
} from 'lucide-react';

import type { PageProps } from '@/types/PageProps';

interface SidebarProps {
  url: string;
}

const Sidebar: React.FC<SidebarProps> = ({ url }) => {
  const { auth } = usePage<PageProps>().props;
  const user = auth.user;

  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    setShowProfileDropdown(false);
    Inertia.post('/logout');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const menuItems = [
    { path: '/consultor/dashboard', icon: BarChart3, label: 'Dashboard', gradient: 'from-primary to-secondary' },
    { path: '/consultor/crm', icon: Package, label: 'CRM', gradient: 'from-secondary to-primary' },
    { path: '/consultor/registros', icon: ChartNoAxesCombined, label: 'Registros', gradient: 'from-secondary to-primary' },
    { path: '/gerenciar-tags', icon: Tag, label: 'Gestão de Tags', gradient: 'from-secondary to-primary' }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-metallic dark:bg-gradient-metallic-dark shadow-2xl dark:shadow-metallic-dark z-50 border-r border-white/40 dark:border-dark-border transition-all duration-300 flex flex-col">
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center justify-center mb-4">
          <div className="p-2 backdrop-blur-sm">
            <img src="/images/logo.png" alt="SKY Logo" className="w-15 h-15 object-contain dark:hidden" />
            <img src="/images/logo-dark2.png" alt="SKY Logo" className="w-15 h-15 object-contain hidden dark:block" />
          </div>
        </div>

        <div className="mb-3 p-2 bg-white/60 dark:bg-dark-card/60 backdrop-blur-glass rounded-xl border border-white/60 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isDarkMode ? <Moon className="w-3 h-3 text-primary dark:text-secondary" /> : <Sun className="w-3 h-3 text-primary dark:text-secondary" />}
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text">
                {isDarkMode ? 'Escuro' : 'Claro'}
              </span>
            </div>
            <button onClick={toggleTheme} className="flex items-center space-x-1 text-primary dark:text-secondary transition-colors">
              {isDarkMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto scrollbar-thin">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = url === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                prefetch
                className={`
                  flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group
                  ${isActive
                    ? `bg-gradient-to-r ${item.gradient} shadow-glow-primary dark:shadow-glow-dark text-white transform scale-105`
                    : 'text-gray-700 dark:text-dark-text hover:bg-white/60 dark:hover:bg-dark-card/60 hover:text-primary dark:hover:text-secondary hover:scale-105 hover:shadow-xl dark:hover:shadow-glass-dark backdrop-blur-sm'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : 'group-hover:animate-bounce'}`} />
                <span className="font-semibold text-sm">{item.label}</span>
                {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-shrink-0 p-4 profile-dropdown-container">
        {showProfileDropdown && (
          <div className="mb-3 bg-white/90 dark:bg-dark-card/90 backdrop-blur-glass rounded-xl border border-white/60 dark:border-dark-border shadow-xl dark:shadow-glass-dark animate-fade-in">
            <div className="p-2">
              <Link
                href={"/profile-settings"}
                prefetch
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
                onClick={() => setShowProfileDropdown(false)}
              >
                <User className="w-3 h-3 text-gray-600 dark:text-dark-text-secondary" />
                <span className="text-gray-700 dark:text-dark-text font-medium text-sm">Meu Perfil</span>
              </Link>

              <div className="border-t border-gray-200 dark:border-dark-border my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400"
              >
                <LogOut className="w-3 h-3" />
                <span className="font-medium text-sm">Sair</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={toggleProfileDropdown}
          className="w-full bg-white/70 dark:bg-dark-card/70 backdrop-blur-glass rounded-xl p-3 border border-white/60 dark:border-dark-border shadow-xl dark:shadow-glass-dark hover:bg-white/80 dark:hover:bg-dark-card/80 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
  <div className="flex items-center space-x-2">
    <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg bg-gradient-primary flex items-center justify-center">
      {user.client_detail?.profile_image ? (
        <img
          src={user.client_detail.profile_image.startsWith('http')
            ? user.client_detail.profile_image
            : `/${user.client_detail.profile_image}`}
          alt={user.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white font-bold text-sm">
          {user.name?.[0] || 'C'}
        </span>
      )}
    </div>
    <div className="text-left">
      <p className="text-dark dark:text-dark-text font-semibold text-sm">
        {user.name?.split(' ')[0] || 'Consultor'}
      </p>
      <p className="text-primary dark:text-secondary text-xs">
        Consultor
      </p>
    </div>
  </div>
  <div className="text-gray-500 dark:text-dark-text-secondary">
    {showProfileDropdown ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    )}
  </div>
</div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
