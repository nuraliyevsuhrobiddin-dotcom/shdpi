import React, { useState, useEffect } from 'react';
import { Page, AnalysisResult, User, Subject, UserRole, SubscriptionTier, ApiLog, AppLanguage, AiMode, GlobalSettings } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AnalysisOutput from './components/AnalysisOutput';
import HistoryPage from './components/HistoryPage';
import AdminPanel from './components/AdminPanel';
import AuthPage from './components/AuthPage';
import SettingsPage from './components/SettingsPage';
import Navbar from './components/Navbar';
import UpgradeModal from './components/UpgradeModal';

const ADMIN_EMAIL = 'nuraliyevsuhrobiddin@gmail.com';

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  systemPrompt: "Siz kimyo, biologiya va farmatsevtika laboratoriya standartlari bo'yicha chuqur bilimga ega bo'lgan professional ilmiy laboratoriya nazoratchisisiz. Berilgan protokolni diqqat bilan tahlil qiling. Mantiqiy xatolar, reagentlarning noto'g'ri nisbatlari, xavfsizlik qoidalarini buzish va ilmiy talqin xatolarini aniqlang. Barcha javoblarni O'ZBEK tilida bering. Tuzilmaviy tahlil taqdim eting.",
  freeAnalysisLimit: 3,
  premiumPrice: 19,
  universityPrice: 500,
  maintenanceMode: false
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);

  // Initial load from LocalStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('bioxato_user');
    const savedHistory = localStorage.getItem('bioxato_history');
    const savedUsers = localStorage.getItem('bioxato_all_users');
    const savedLogs = localStorage.getItem('bioxato_api_logs');
    const savedGlobalSettings = localStorage.getItem('bioxato_global_settings');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedGlobalSettings) setGlobalSettings(JSON.parse(savedGlobalSettings));
    
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Mock initial data
      const mockUsers: User[] = [
        { 
          id: '1', email: ADMIN_EMAIL, name: 'Suhrobiddin Admin', isPremium: true, tier: SubscriptionTier.UNIVERSITY, 
          analysesUsed: 24, role: UserRole.ADMIN, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          language: AppLanguage.UZ, aiMode: AiMode.NORMAL, twoFactorEnabled: true
        }
      ];
      setUsers(mockUsers);
    }

    if (savedLogs) {
      setApiLogs(JSON.parse(savedLogs));
    } else {
      setApiLogs([
        { id: 'l1', timestamp: new Date().toISOString(), endpoint: '/api/analyze', status: 200, latency: 1200, userEmail: ADMIN_EMAIL, method: 'POST' }
      ]);
    }
  }, []);

  // Sync state with LocalStorage
  useEffect(() => {
    if (user) localStorage.setItem('bioxato_user', JSON.stringify(user));
    else localStorage.removeItem('bioxato_user');
    
    localStorage.setItem('bioxato_history', JSON.stringify(history));
    localStorage.setItem('bioxato_all_users', JSON.stringify(users));
    localStorage.setItem('bioxato_api_logs', JSON.stringify(apiLogs));
    localStorage.setItem('bioxato_global_settings', JSON.stringify(globalSettings));
  }, [user, history, users, apiLogs, globalSettings]);

  const handleLogin = (email: string) => {
    const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    let existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!existingUser) {
      existingUser = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: email.split('@')[0],
        isPremium: isAdmin,
        tier: isAdmin ? SubscriptionTier.UNIVERSITY : SubscriptionTier.FREE,
        analysesUsed: 0,
        role: isAdmin ? UserRole.ADMIN : UserRole.USER,
        createdAt: new Date().toISOString(),
        language: AppLanguage.UZ,
        aiMode: AiMode.NORMAL,
        twoFactorEnabled: false
      };
      setUsers(prev => [...prev, existingUser!]);
    } else if (isAdmin && existingUser.role !== UserRole.ADMIN) {
      // Auto-assign admin role on login if it's the specific email
      existingUser = { ...existingUser, role: UserRole.ADMIN };
      setUsers(prev => prev.map(u => u.id === existingUser!.id ? existingUser! : u));
    }

    if (existingUser.isBanned) {
      alert("Hisobingiz bloklangan. Iltimos admin bilan bog'laning.");
      return;
    }

    setUser(existingUser);
    setCurrentPage(Page.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage(Page.LANDING);
  };

  const handleUpgradeSuccess = () => {
    if (user) {
      const updatedUser: User = { ...user, isPremium: true, tier: SubscriptionTier.PREMIUM };
      setUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    }
  };

  const addAnalysis = (result: AnalysisResult) => {
    setHistory(prev => [result, ...prev]);
    setCurrentAnalysis(result);
    
    // Log API request
    const newLog: ApiLog = {
      id: Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      endpoint: '/api/analyze',
      status: 200,
      latency: result.processingTimeMs || 1500,
      userEmail: user?.email || 'anonymous',
      method: 'POST'
    };
    setApiLogs(prev => [newLog, ...prev]);

    if (user) {
      const updatedUser: User = { 
        ...user, 
        analysesUsed: user.analysesUsed + 1,
        lastAnalysisDate: new Date().toISOString()
      };
      setUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    }
  };

  const manageUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } as User : u));
    if (user && user.id === userId) {
      setUser(prev => prev ? { ...prev, ...updates } as User : null);
    }
  };

  const deleteUser = (userId: string) => {
    if (user && user.id === userId) {
      alert("O'zingizni o'chira olmaysiz!");
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const updateGlobalSettings = (updates: Partial<GlobalSettings>) => {
    setGlobalSettings(prev => ({ ...prev, ...updates }));
  };

  const navigate = (page: Page) => {
    if (page === Page.ADMIN && user?.role !== UserRole.ADMIN) {
      setCurrentPage(Page.DASHBOARD);
      return;
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.LANDING:
        return <LandingPage onStart={() => navigate(user ? Page.DASHBOARD : Page.AUTH)} />;
      case Page.AUTH:
        return <AuthPage onLogin={handleLogin} />;
      case Page.DASHBOARD:
        return user ? (
          <Dashboard 
            user={user} 
            globalSettings={globalSettings}
            onAnalysisComplete={addAnalysis} 
            onNavigate={navigate} 
            onUpgradeClick={() => setIsUpgradeModalOpen(true)}
          />
        ) : <AuthPage onLogin={handleLogin} />;
      case Page.ANALYSIS_RESULT:
        return currentAnalysis ? <AnalysisOutput result={currentAnalysis} onBack={() => navigate(Page.DASHBOARD)} /> : <LandingPage onStart={() => navigate(Page.AUTH)} />;
      case Page.HISTORY:
        return <HistoryPage history={history} onSelect={(res) => { setCurrentAnalysis(res); navigate(Page.ANALYSIS_RESULT); }} />;
      case Page.ADMIN:
        return user?.role === UserRole.ADMIN ? (
          <AdminPanel 
            history={history} 
            users={users} 
            apiLogs={apiLogs}
            onManageUser={manageUser}
            onDeleteUser={deleteUser}
          />
        ) : <LandingPage onStart={() => navigate(Page.AUTH)} />;
      case Page.SETTINGS:
        return user ? (
          <SettingsPage 
            user={user} 
            globalSettings={globalSettings}
            onUpdateUser={(updates) => manageUser(user.id, updates)}
            onUpdateGlobalSettings={updateGlobalSettings}
          />
        ) : <AuthPage onLogin={handleLogin} />;
      default:
        return <LandingPage onStart={() => navigate(Page.AUTH)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        user={user} 
        currentPage={currentPage} 
        onNavigate={navigate} 
        onLogout={handleLogout} 
      />
      <main className="flex-grow pt-16">
        {renderPage()}
      </main>
      
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        onConfirm={handleUpgradeSuccess} 
      />

      <footer className="bg-[#030812] border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6 justify-center md:justify-start">
                <span className="text-white text-2xl font-bold tracking-tighter">BIOXATO<span className="text-[#00d2ff]">.AI</span></span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
                Laboratoriya protokollarini sun'iy intellekt yordamida tahlil qilish va ilmiy xavfsizlikni ta'minlash bo'yicha dunyodagi birinchi professional o'zbek tilidagi platforma.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest text-[#00d2ff]">Platforma</h4>
              <div className="flex flex-col space-y-4 text-sm text-gray-500">
                <button onClick={() => navigate(Page.LANDING)} className="hover:text-white transition-colors">Asosiy sahifa</button>
                <button onClick={() => navigate(Page.DASHBOARD)} className="hover:text-white transition-colors">Tahlil paneli</button>
                <button onClick={() => navigate(Page.SETTINGS)} className="hover:text-white transition-colors">Sozlamalar</button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest text-[#00d2ff]">Huquqiy</h4>
              <div className="flex flex-col space-y-4 text-sm text-gray-500">
                <a href="#" className="hover:text-white transition-colors">Maxfiylik siyosati</a>
                <a href="#" className="hover:text-white transition-colors">Xizmat ko'rsatish shartlari</a>
                <a href="mailto:nuraliyevsuhrobiddin@gmail.com" className="hover:text-white transition-colors">Bog'lanish</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <div>&copy; 2026 BIOXATO.AI. Barcha huquqlar himoyalangan.</div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               <span>Tizim barqaror ishlamoqda</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;