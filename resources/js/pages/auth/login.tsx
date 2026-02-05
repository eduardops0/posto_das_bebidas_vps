import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, LogIn, Shield, Moon, Sun } from 'lucide-react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginProps {
  onLogin: (isAdmin: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const { errors } = usePage().props as { errors: Record<string, string> };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  Inertia.post('/login', {
    email: credentials.email,
    password: credentials.password,
    remember: rememberMe
  }, {
    onFinish: () => setIsLoading(false),
    onError: (errors) => {
      if (errors.email || errors.password) {
        alert(errors.email || errors.password);
      }
    }
  });
};

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-accent via-white to-primary/10 dark:from-dark-bg dark:via-dark-surface dark:to-dark-card transition-colors duration-300 flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-2xl border border-white/60 dark:border-dark-border shadow-glass dark:shadow-glass-dark hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 z-10"
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-primary dark:text-secondary" />
        ) : (
          <Moon className="w-5 h-5 text-primary dark:text-secondary" />
        )}
      </button>

      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-glass rounded-3xl p-8 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-border animate-fade-in">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-primary rounded-3xl shadow-glow-primary dark:shadow-glow-dark">
                <img 
                  src="images/logo.png" 
                  alt="SKY Logo" 
                  className="w-16 h-16 object-contain dark:hidden"
                />
                <img 
                  src="images/logo-dark2.png" 
                  alt="SKY Logo" 
                  className="w-16 h-16 object-contain hidden dark:block"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              Faça login para acessar seu painel CRM
            </p>
          </div>
        
          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-secondary"
                  placeholder="Digite seu email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-12 py-4 border border-gray-200 dark:border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-secondary"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary hover:text-gray-600 dark:hover:text-dark-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="w-4 h-4 text-primary border-gray-300 dark:border-dark-border rounded focus:ring-primary/50 bg-white dark:bg-dark-surface"
                />
                <span className="text-sm text-gray-700 dark:text-dark-text">Lembrar-me</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-primary text-white rounded-2xl hover:shadow-glow-primary dark:hover:shadow-glow-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              © 2025 SKY CRM System. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;