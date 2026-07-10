import React, { useState, useEffect } from 'react';
import { Customer, Payment, CompanySettings, AppState, Project } from './types';
import { initialCustomers, initialPayments, defaultCompanySettings, initialProjects } from './initialData';
import {
  getCustomersFromDB,
  saveCustomerToDB,
  deleteCustomerFromDB,
  getPaymentsFromDB,
  savePaymentToDB,
  deletePaymentFromDB,
  getProjectsFromDB,
  saveProjectToDB,
  deleteProjectFromDB,
  getSettingsFromDB,
  saveSettingsToDB
} from './lib/firebase';

// Subcomponents
import Dashboard from './components/Dashboard';
import CustomerSearchOperator from './components/CustomerSearchOperator';
import CustomerCRUD from './components/CustomerCRUD';
import PaymentCRUD from './components/PaymentCRUD';
import AdminPanel from './components/AdminPanel';
import PrintViews from './components/PrintViews';
import ProjectReports from './components/ProjectReports';
import LoginScreen from './components/LoginScreen';

// Icons
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  Receipt, 
  Settings, 
  ChevronRight, 
  Home, 
  User, 
  HelpCircle,
  Database,
  CheckCircle,
  CalendarDays,
  FileSpreadsheet,
  LogOut
} from 'lucide-react';

export default function App() {
  // --- Authentication / Security State ---
  const [authEnabled, setAuthEnabled] = useState<boolean>(() => {
    const val = localStorage.getItem('ar_prop_auth_enabled');
    if (val === null) {
      // Default to enabling security
      localStorage.setItem('ar_prop_auth_enabled', 'true');
      return true;
    }
    return val === 'true';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const val = localStorage.getItem('ar_prop_auth_enabled');
    const isSecured = val === null ? true : val === 'true';
    if (!isSecured) return true;
    
    const sessionLoggedIn = sessionStorage.getItem('ar_prop_is_logged_in') === 'true';
    const rememberMeLoggedIn = localStorage.getItem('ar_prop_remember_me') === 'true';
    return sessionLoggedIn || rememberMeLoggedIn;
  });

  // Track if auth settings change
  useEffect(() => {
    const checkAuthStatus = () => {
      const isSecured = localStorage.getItem('ar_prop_auth_enabled') !== 'false';
      setAuthEnabled(isSecured);
      if (!isSecured) {
        setIsLoggedIn(true);
      } else {
        const sessionLoggedIn = sessionStorage.getItem('ar_prop_is_logged_in') === 'true';
        const rememberMeLoggedIn = localStorage.getItem('ar_prop_remember_me') === 'true';
        setIsLoggedIn(sessionLoggedIn || rememberMeLoggedIn);
      }
    };
    
    window.addEventListener('storage', checkAuthStatus);
    // Custom event listener for local changes within the same window
    window.addEventListener('auth-settings-changed', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('auth-settings-changed', checkAuthStatus);
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ar_prop_is_logged_in');
    localStorage.removeItem('ar_prop_remember_me');
    setIsLoggedIn(false);
  };

  // --- Core Application State ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Print Modal/View states
  const [activePrintDoc, setActivePrintDoc] = useState<'receipt' | 'acknowledgment' | 'schedule' | 'history' | 'deed' | null>(null);
  const [printCustomer, setPrintCustomer] = useState<Customer | null>(null);
  const [printPayment, setPrintPayment] = useState<Payment | null>(null);

  // Live Bangladesh Clock
  const [currentDateText, setCurrentDateText] = useState('');

  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Dhaka',
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        setCurrentDateText(formatter.format(now));
      } catch (err) {
        setCurrentDateText(new Date().toLocaleString());
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Load Initial State from Firestore Cloud with LocalStorage Fallback ---
  useEffect(() => {
    const initializeData = async () => {
      // Timeout helper to prevent infinite loading on network blocks or database configurations
      function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
        return Promise.race([
          promise,
          new Promise<T>((resolve) => setTimeout(() => {
            console.warn(`Firestore operation timed out after ${ms}ms. Using fallback.`);
            resolve(fallbackValue);
          }, ms))
        ]);
      }

      try {
        // Load cloud data in parallel with a 3.5 second timeout to guarantee fast loading
        const [dbCustomers, dbPayments, dbProjects, dbSettings] = await Promise.all([
          withTimeout(getCustomersFromDB(), 3500, []),
          withTimeout(getPaymentsFromDB(), 3500, []),
          withTimeout(getProjectsFromDB(), 3500, []),
          withTimeout(getSettingsFromDB(), 3500, null)
        ]);

        // Prioritize Firestore cloud data if present
        if (dbCustomers.length > 0 || dbPayments.length > 0 || dbProjects.length > 0 || dbSettings) {
          setCustomers(dbCustomers);
          setPayments(dbPayments);
          setProjects(dbProjects);
          if (dbSettings) {
            setCompanySettings(dbSettings);
          } else {
            setCompanySettings(defaultCompanySettings);
          }

          // Update local cache
          localStorage.setItem('ar_prop_customers', JSON.stringify(dbCustomers));
          localStorage.setItem('ar_prop_payments', JSON.stringify(dbPayments));
          localStorage.setItem('ar_prop_projects', JSON.stringify(dbProjects));
          if (dbSettings) {
            localStorage.setItem('ar_prop_settings', JSON.stringify(dbSettings));
          }
        } else {
          // Firestore is empty! See if we have local cache to upload (no-loss migration)
          const storedCustomers = localStorage.getItem('ar_prop_customers');
          const storedPayments = localStorage.getItem('ar_prop_payments');
          const storedSettings = localStorage.getItem('ar_prop_settings');
          const storedProjects = localStorage.getItem('ar_prop_projects');

          let initialCust = initialCustomers;
          let initialPay = initialPayments;
          let initialSet = defaultCompanySettings;
          let initialProj = initialProjects;

          if (storedCustomers && storedPayments && storedSettings) {
            try {
              initialCust = JSON.parse(storedCustomers);
              initialPay = JSON.parse(storedPayments);
              initialSet = JSON.parse(storedSettings);
              if (storedProjects) {
                initialProj = JSON.parse(storedProjects);
              }
            } catch (err) {
              console.error('Failed to parse local storage fallback:', err);
            }
          }

          // Set state
          setCustomers(initialCust);
          setPayments(initialPay);
          setCompanySettings(initialSet);
          setProjects(initialProj);

          // Upload current dataset to Firestore cloud to preserve it forever
          for (const c of initialCust) {
            await saveCustomerToDB(c);
          }
          for (const p of initialPay) {
            await savePaymentToDB(p);
          }
          for (const pr of initialProj) {
            await saveProjectToDB(pr);
          }
          await saveSettingsToDB(initialSet);

          // Set local storage
          localStorage.setItem('ar_prop_customers', JSON.stringify(initialCust));
          localStorage.setItem('ar_prop_payments', JSON.stringify(initialPay));
          localStorage.setItem('ar_prop_settings', JSON.stringify(initialSet));
          localStorage.setItem('ar_prop_projects', JSON.stringify(initialProj));
        }
      } catch (error) {
        console.error('Failed to initialize or sync Firestore database:', error);
        
        // Offline Fallback to Local Storage
        const storedCustomers = localStorage.getItem('ar_prop_customers');
        const storedPayments = localStorage.getItem('ar_prop_payments');
        const storedSettings = localStorage.getItem('ar_prop_settings');
        const storedProjects = localStorage.getItem('ar_prop_projects');

        if (storedCustomers && storedPayments && storedSettings) {
          setCustomers(JSON.parse(storedCustomers));
          setPayments(JSON.parse(storedPayments));
          setCompanySettings(JSON.parse(storedSettings));
          if (storedProjects) {
            setProjects(JSON.parse(storedProjects));
          }
        } else {
          setCustomers(initialCustomers);
          setPayments(initialPayments);
          setCompanySettings(defaultCompanySettings);
          setProjects(initialProjects);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // --- State persistence helpers ---
  const saveCustomersToStorage = (updatedCustomers: Customer[]) => {
    setCustomers(updatedCustomers);
    localStorage.setItem('ar_prop_customers', JSON.stringify(updatedCustomers));
  };

  const savePaymentsToStorage = (updatedPayments: Payment[]) => {
    setPayments(updatedPayments);
    localStorage.setItem('ar_prop_payments', JSON.stringify(updatedPayments));
  };

  const saveSettingsToStorage = (updatedSettings: CompanySettings) => {
    setCompanySettings(updatedSettings);
    localStorage.setItem('ar_prop_settings', JSON.stringify(updatedSettings));
  };

  const saveProjectsToStorage = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('ar_prop_projects', JSON.stringify(updatedProjects));
  };

  // --- State Manipulation Handlers ---

  // Add Customer
  const handleAddCustomer = (newCustomer: Customer, initialPayment?: Payment) => {
    const updated = [...customers, newCustomer];
    saveCustomersToStorage(updated);
    saveCustomerToDB(newCustomer); // Save to Firestore
    
    if (initialPayment) {
      const updatedPayments = [...payments, initialPayment];
      savePaymentsToStorage(updatedPayments);
      savePaymentToDB(initialPayment); // Save to Firestore
      
      // Auto-open print receipt view for booking payment
      setPrintCustomer(newCustomer);
      setActivePrintDoc('receipt');
      setPrintPayment(initialPayment);
    }
  };

  // Edit Customer
  const handleEditCustomer = (updatedCustomer: Customer) => {
    const updated = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    saveCustomersToStorage(updated);
    saveCustomerToDB(updatedCustomer); // Save to Firestore
  };

  // Delete Customer (Cascade delete payments)
  const handleDeleteCustomer = (id: string) => {
    const target = customers.find(c => c.id === id);
    if (!target) return;
    
    const updatedCustomers = customers.filter(c => c.id !== id);
    const updatedPayments = payments.filter(p => p.customerId !== target.customerId);
    
    saveCustomersToStorage(updatedCustomers);
    savePaymentsToStorage(updatedPayments);

    deleteCustomerFromDB(id); // Delete from Firestore
    
    // Cascade delete payments from Firestore
    const targetPayments = payments.filter(p => p.customerId === target.customerId);
    for (const p of targetPayments) {
      deletePaymentFromDB(p.id);
    }
  };

  // Add Payment
  const handleAddPayment = (newPayment: Payment) => {
    const updated = [...payments, newPayment];
    savePaymentsToStorage(updated);
    savePaymentToDB(newPayment); // Save to Firestore
  };

  // Edit Payment
  const handleEditPayment = (updatedPayment: Payment) => {
    const updated = payments.map(p => p.id === updatedPayment.id ? updatedPayment : p);
    savePaymentsToStorage(updated);
    savePaymentToDB(updatedPayment); // Save to Firestore
  };

  // Delete Payment
  const handleDeletePayment = (id: string) => {
    const updated = payments.filter(p => p.id !== id);
    savePaymentsToStorage(updated);
    deletePaymentFromDB(id); // Delete from Firestore
  };

  // Save Settings
  const handleSaveSettings = (updatedSettings: CompanySettings) => {
    saveSettingsToStorage(updatedSettings);
    saveSettingsToDB(updatedSettings); // Save to Firestore
  };

  // Add Project
  const handleAddProject = (newProj: Project) => {
    const updated = [...projects, newProj];
    saveProjectsToStorage(updated);
    saveProjectToDB(newProj); // Save to Firestore
  };

  // Delete Project
  const handleDeleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    saveProjectsToStorage(updated);
    deleteProjectFromDB(id); // Delete from Firestore
  };

  // Restore State from JSON Backup
  const handleRestoreState = async (newState: AppState) => {
    setCustomers(newState.customers);
    setPayments(newState.payments);
    setCompanySettings(newState.companySettings);
    if (newState.projects) {
      setProjects(newState.projects);
      localStorage.setItem('ar_prop_projects', JSON.stringify(newState.projects));
    }
    
    localStorage.setItem('ar_prop_customers', JSON.stringify(newState.customers));
    localStorage.setItem('ar_prop_payments', JSON.stringify(newState.payments));
    localStorage.setItem('ar_prop_settings', JSON.stringify(newState.companySettings));

    // Update entire state to Firestore
    for (const c of newState.customers) {
      await saveCustomerToDB(c);
    }
    for (const p of newState.payments) {
      await savePaymentToDB(p);
    }
    if (newState.projects) {
      for (const pr of newState.projects) {
        await saveProjectToDB(pr);
      }
    }
    await saveSettingsToDB(newState.companySettings);
  };

  // Get current state to download backup
  const getCurrentState = (): AppState => {
    return {
      customers,
      payments,
      companySettings,
      projects
    };
  };

  // Quick Action to print a document
  const handleQuickPrint = (
    customer: Customer, 
    docType: 'receipt' | 'acknowledgment' | 'schedule' | 'history' | 'deed', 
    payment: Payment | null
  ) => {
    setPrintCustomer(customer);
    setActivePrintDoc(docType);
    setPrintPayment(payment);
  };

  // Direct redirection from customer profile action button to payment processing
  const handleNavigateToCustomerSearch = (cId: string) => {
    setActiveTab('search');
    // We can let the Operator screen auto-load this search by setting searchQuery in the operator component!
    // To support this effortlessly, we'll pass a mechanism if needed, but since search searches instantly,
    // the user can just paste or we can search. Let's make it so we trigger search query automatically!
    // Since App state controls, let's keep it simple. Let's make the search query have state or just auto-fill.
  };

  // Get Tab Icon
  const renderTabIcon = (tabId: string) => {
    switch (tabId) {
      case 'dashboard': return <LayoutDashboard className="w-4.5 h-4.5" />;
      case 'search': return <Search className="w-4.5 h-4.5" />;
      case 'customers': return <Users className="w-4.5 h-4.5" />;
      case 'payments': return <Receipt className="w-4.5 h-4.5" />;
      case 'reports': return <FileSpreadsheet className="w-4.5 h-4.5" />;
      case 'admin': return <Settings className="w-4.5 h-4.5" />;
      default: return <ChevronRight className="w-4.5 h-4.5" />;
    }
  };

  // Get Tab Label (English & Bengali)
  const renderTabLabel = (tabId: string) => {
    switch (tabId) {
      case 'dashboard': return { bn: 'ড্যাশবোর্ড', en: 'Dashboard' };
      case 'search': return { bn: 'কালেকশন প্যানেল', en: 'Operator Collection' };
      case 'customers': return { bn: 'গ্রাহক তালিকা', en: 'Customer Directory' };
      case 'payments': return { bn: 'পেমেন্ট খতিয়ান', en: 'Payment Ledger' };
      case 'reports': return { bn: 'প্রকল্প রিপোর্ট', en: 'Project Reports' };
      case 'admin': return { bn: 'অ্যাডমিন প্যানেল', en: 'Admin Panel & Backup' };
      default: return { bn: 'ট্যাব', en: 'Tab' };
    }
  };

  // Helper to select colors dynamically
  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'blue':
        return { primary: '#1E3A8A', hover: '#111E45' };
      case 'red':
        return { primary: '#722F37', hover: '#4E2025' };
      case 'green':
        return { primary: '#0F4C3A', hover: '#092D22' };
      case 'natural':
      default:
        return { primary: '#123C24', hover: '#0B2516' }; // Keep deep forest emerald as default for elite eco-housing trust!
    }
  };

  const { primary, hover } = getThemeColors(companySettings.themeColor || 'natural');

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] flex flex-col items-center justify-center p-6 font-sans">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-2xl border-4 border-[#123C24]/15"></div>
            <div className="absolute inset-0 rounded-2xl border-4 border-t-[#123C24] animate-spin"></div>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-stone-850 text-xs">ক্লাউড ডাটাবেস লোড হচ্ছে...</h3>
            <p className="text-[10px] text-stone-500 font-bold">নিরাপদ সার্ভার সংযোগ নিশ্চিত করা হচ্ছে</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-natural-bg flex text-natural-text font-sans antialiased overflow-hidden"
      style={{
        '--color-natural-primary': primary,
        '--color-natural-primary-hover': hover,
      } as React.CSSProperties}
    >
      
      {/* ======================================= */}
      {/* 1. SIDEBAR NAVIGATION RAIL (no-print)   */}
      {/* ======================================= */}
      <aside className="w-72 bg-natural-sidebar text-natural-text flex flex-col justify-between border-r border-natural-border no-print flex-shrink-0 relative z-30">
        
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-natural-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-natural-primary flex items-center justify-center font-extrabold text-white text-base tracking-wider shadow-md shadow-natural-primary/20">
              AR
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-natural-text line-clamp-1 uppercase">AR Properties</h1>
              <p className="text-[10px] text-natural-primary font-bold tracking-wider uppercase">Real Estate ERP</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {(['dashboard', 'search', 'customers', 'payments', 'reports', 'admin'] as const).map(tab => {
              const isActive = activeTab === tab;
              const labels = renderTabLabel(tab);
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white text-natural-primary shadow-sm border border-natural-border' 
                      : 'text-natural-muted hover:text-natural-text hover:bg-[#EBE7E0]/60'
                  }`}
                >
                  {renderTabIcon(tab)}
                  <div className="text-left">
                    <p className="leading-none">{labels.bn}</p>
                    <p className="text-[9px] opacity-60 font-light mt-0.5">{labels.en}</p>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-natural-primary" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & metadata */}
        <div className="p-4 mx-4 mb-4 bg-natural-primary/5 rounded-2xl border border-natural-primary/10 text-center text-xs space-y-1.5">
          <p className="font-medium text-natural-primary flex items-center justify-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-natural-primary" />
            <span>সুরক্ষিত ক্লাউড ডাটাবেস</span>
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-natural-muted uppercase tracking-wide font-mono">লাইভ সংযোগ (Firestore)</span>
          </div>
        </div>

      </aside>

      {/* ======================================= */}
      {/* 2. MAIN SYSTEM CONTENT AREA             */}
      {/* ======================================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Sticky Top Header bar (no-print) */}
        <header className="bg-white border-b border-natural-border h-20 flex items-center justify-between px-8 no-print relative z-20 flex-shrink-0">
          <div>
            <h2 className="text-base font-serif text-natural-text flex items-center gap-2">
              <span>{renderTabLabel(activeTab).bn}</span>
              <span className="text-xs text-natural-muted font-sans font-normal">/ {renderTabLabel(activeTab).en}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-natural-muted">
            {/* Operator Account Badge */}
            <div className="flex items-center gap-2 bg-natural-sidebar border border-natural-border rounded-xl px-3.5 py-1.5">
              <div className="w-6 h-6 rounded-full bg-natural-primary text-white flex items-center justify-center font-bold text-[10px]">
                OP
              </div>
              <div>
                <p className="text-[10px] text-natural-text font-bold leading-none">ক্যাশ কাউন্টার (Cash Counter)</p>
                <p className="text-[9px] text-natural-muted mt-0.5">arpropertiesanddevelopers@gmail.com</p>
              </div>
            </div>

            {/* Log Out Button (Only shown if auth is enabled) */}
            {authEnabled && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-2 bg-rose-50/50 hover:bg-rose-50 border border-rose-150 hover:border-rose-200 text-rose-700 hover:text-rose-800 rounded-xl cursor-pointer transition-all duration-200 font-bold text-[10px] tracking-wide"
                title="লগআউট করুন এবং লক করুন"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>লগআউট (Log Out)</span>
              </button>
            )}

            {/* Local Clock */}
            <div className="flex items-center gap-1.5 text-natural-muted font-medium">
              <CalendarDays className="w-4 h-4 text-natural-primary" />
              <span className="font-mono text-natural-text text-[11px] sm:text-xs">{currentDateText || 'Loading...'}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content Frame */}
        <main className="flex-1 overflow-y-auto p-8 no-print bg-slate-50/50">
          <div className="max-w-6xl mx-auto">
            
            {/* Active Tab Router */}
            {activeTab === 'dashboard' && (
              <Dashboard
                customers={customers}
                payments={payments}
                companySettings={companySettings}
                onNavigateToTab={setActiveTab}
                onQuickPrint={handleQuickPrint}
              />
            )}

            {activeTab === 'search' && (
              <CustomerSearchOperator
                customers={customers}
                payments={payments}
                onAddPayment={handleAddPayment}
                onQuickPrint={handleQuickPrint}
                onEditCustomer={handleEditCustomer}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerCRUD
                customers={customers}
                payments={payments}
                projects={projects}
                onAddCustomer={handleAddCustomer}
                onEditCustomer={handleEditCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onNavigateToCustomerSearch={handleNavigateToCustomerSearch}
                onQuickPrint={handleQuickPrint}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentCRUD
                payments={payments}
                customers={customers}
                onAddPayment={handleAddPayment}
                onEditPayment={handleEditPayment}
                onDeletePayment={handleDeletePayment}
                onQuickPrint={handleQuickPrint}
              />
            )}

            {activeTab === 'reports' && (
              <ProjectReports
                customers={customers}
                payments={payments}
                projects={projects}
                companySettings={companySettings}
                onQuickPrint={handleQuickPrint}
              />
            )}

            {activeTab === 'admin' && (
              <AdminPanel
                settings={companySettings}
                onSaveSettings={handleSaveSettings}
                onRestoreState={handleRestoreState}
                getCurrentState={getCurrentState}
                projects={projects}
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
                customers={customers}
                payments={payments}
              />
            )}

          </div>
        </main>

      </div>

      {/* ======================================= */}
      {/* 3. A4 PRINT VIEWS POPUP (no-print rules) */}
      {/* ======================================= */}
      {printCustomer && activePrintDoc && (
        <PrintViews
          customer={printCustomer}
          payments={payments.filter(p => p.customerId === printCustomer.customerId)}
          companySettings={companySettings}
          activePrintDoc={activePrintDoc}
          selectedPayment={printPayment}
          onClose={() => {
            setActivePrintDoc(null);
            setPrintCustomer(null);
            setPrintPayment(null);
          }}
        />
      )}

    </div>
  );
}
