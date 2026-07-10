import React, { useState, useRef, useEffect } from 'react';
import { CompanySettings, AppState, Project, Customer, Payment } from '../types';
import { 
  Save, 
  Download, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Palette, 
  Building2, 
  Settings2, 
  Database,
  Cloud,
  RefreshCw,
  ExternalLink,
  FileSpreadsheet,
  UserCheck,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logoutUser, syncToGoogleSheets, initAuth } from '../lib/googleSync';

interface AdminPanelProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  onRestoreState: (state: AppState) => void;
  getCurrentState: () => AppState;
  projects: Project[];
  onAddProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  customers: Customer[];
  payments: Payment[];
}

export default function AdminPanel({
  settings,
  onSaveSettings,
  onRestoreState,
  getCurrentState,
  projects,
  onAddProject,
  onDeleteProject,
  customers,
  payments
}: AdminPanelProps) {
  // Admin Tabs
  const [adminTab, setAdminTab] = useState<'profile' | 'projects' | 'theme' | 'backup' | 'google-sync' | 'security'>('profile');

  // Security Settings States
  const [authEnabled, setAuthEnabled] = useState(() => {
    return localStorage.getItem('ar_prop_auth_enabled') !== 'false';
  });
  const [authUsername, setAuthUsername] = useState(() => {
    return localStorage.getItem('ar_prop_auth_username') || 'admin';
  });
  const [authPassword, setAuthPassword] = useState(() => {
    return localStorage.getItem('ar_prop_auth_password') || 'admin';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [securitySaveSuccess, setSecuritySaveSuccess] = useState(false);

  const handleSaveSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ar_prop_auth_enabled', authEnabled ? 'true' : 'false');
    localStorage.setItem('ar_prop_auth_username', authUsername.trim());
    localStorage.setItem('ar_prop_auth_password', authPassword);
    
    setSecuritySaveSuccess(true);
    
    // Dispatch a custom event to update App.tsx auth states immediately
    window.dispatchEvent(new Event('auth-settings-changed'));
    
    setTimeout(() => {
      setSecuritySaveSuccess(false);
    }, 3000);
  };

  // Google OAuth & Sync States
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncUrl, setSyncUrl] = useState('');
  const [syncError, setSyncError] = useState('');
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsGoogleLoggingIn(true);
    setSyncError('');
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      const errorCode = err.code || '';
      let errorMsg = 'গুগল লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      if (errorCode === 'auth/unauthorized-domain') {
        errorMsg = 'গুগল লগইন ব্যর্থ হয়েছে (unauthorized-domain): এই ডোমেইনটি ফায়ারবেস অথরাইজড ডোমেইন (Authorized Domains) তালিকায় যুক্ত করা নেই। দয়া করে ফায়ারবেস কনসোলে আপনার ডোমেইনটি যুক্ত করুন অথবা নিচের ডোমেইন সমাধান গাইডটি পড়ুন।';
      } else if (errorCode === 'auth/popup-blocked') {
        errorMsg = 'গুগল লগইন ব্যর্থ হয়েছে (popup-blocked): আপনার ব্রাউজারে পপ-আপ ব্লক করা আছে। অনুগ্রহ করে ব্রাউজার থেকে পপ-আপ এবং রিডাইরেক্ট উইন্ডো এলাও করুন।';
      } else if (errorCode === 'auth/popup-closed-by-user') {
        errorMsg = 'গুগল লগইন ব্যর্থ হয়েছে (popup-closed): পপ-আপ উইন্ডোটি আপনি বন্ধ করে দিয়েছেন। অনুগ্রহ করে আবার ট্রাই করুন।';
      } else if (err.message) {
        errorMsg = `গুগল লগইন ব্যর্থ হয়েছে: ${err.message} (${errorCode || 'unknown-code'})`;
      }
      setSyncError(errorMsg);
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutUser();
      setGoogleUser(null);
      setGoogleToken(null);
      setSyncUrl('');
      setSyncStatus('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncToSheets = async () => {
    if (!googleToken) {
      setSyncError('অনুগ্রহ করে প্রথমে গুগল অ্যাকাউন্ট কানেক্ট করুন!');
      return;
    }
    
    // Explicit User Confirmation for overwrite
    const confirmed = window.confirm(
      'আপনি কি গুগল ড্রাইভে গ্রাহক ও পেমেন্ট ডাটা সিঙ্ক করতে চান? এটি বিদ্যমান থাকলে স্প্রেডশিট আপডেট করবে।'
    );
    if (!confirmed) return;

    setIsSyncing(true);
    setSyncError('');
    try {
      const result = await syncToGoogleSheets(customers, payments, googleToken, (status) => {
        setSyncStatus(status);
      });
      setSyncUrl(result.spreadsheetUrl);
    } catch (err: any) {
      console.error(err);
      setSyncError(err.message || 'গুগল শিট সিঙ্ক করতে সমস্যা হয়েছে।');
    } finally {
      setIsSyncing(false);
    }
  };

  // Settings Form States
  const [name, setName] = useState(settings.name);
  const [slogan, setSlogan] = useState(settings.slogan);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [website, setWebsite] = useState(settings.website || '');
  const [bankDetails, setBankDetails] = useState(settings.bankDetails || '');
  
  // Project Form States
  const [newProjName, setNewProjName] = useState('');
  const [newProjAddress, setNewProjAddress] = useState('');

  // Status flags
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [projectSuccess, setProjectSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme configuration presets
  const themeOptions = [
    { id: 'natural', name: 'ক্ল্যাসিক ব্রোঞ্জ (Classic Bronze)', primary: '#5A5A40', bg: 'bg-[#5A5A40]', preview: 'bg-[#5A5A40]' },
    { id: 'blue', name: 'রয়্যাল ব্লু (Royal Blue)', primary: '#1d4ed8', bg: 'bg-[#1d4ed8]', preview: 'bg-blue-700' },
    { id: 'red', name: 'রুবি রেড (Ruby Red)', primary: '#be123c', bg: 'bg-[#be123c]', preview: 'bg-rose-700' },
    { id: 'green', name: 'ফরেস্ট গ্রিন (Forest Green)', primary: '#15803d', bg: 'bg-[#15803d]', preview: 'bg-emerald-700' },
  ] as const;

  // Submit Settings Edit
  const handleSubmitSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim() || !email.trim()) {
      alert('অনুগ্রহ করে প্রয়োজনীয় তারকাচিহ্নিত (*) সকল তথ্য প্রদান করুন!');
      return;
    }

    const updatedSettings: CompanySettings = {
      ...settings,
      name: name.trim(),
      slogan: slogan.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim(),
      bankDetails: bankDetails.trim()
    };

    onSaveSettings(updatedSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Switch Theme Color
  const handleSelectTheme = (themeId: 'natural' | 'blue' | 'red' | 'green') => {
    const updatedSettings: CompanySettings = {
      ...settings,
      themeColor: themeId
    };
    onSaveSettings(updatedSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Submit Project Add
  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjAddress.trim()) {
      alert('অনুগ্রহ করে প্রকল্পের নাম এবং ঠিকানা উভয়ই লিখুন!');
      return;
    }

    const newProj: Project = {
      id: 'proj-' + Date.now(),
      name: newProjName.trim(),
      address: newProjAddress.trim()
    };

    onAddProject(newProj);
    setNewProjName('');
    setNewProjAddress('');
    setProjectSuccess(true);
    setTimeout(() => setProjectSuccess(false), 3000);
  };

  // Trigger JSON Backup Download
  const handleDownloadBackup = () => {
    try {
      const state = getCurrentState();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(state, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `AR_Property_Backup_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      alert('ব্যাকআপ ফাইল তৈরি করতে সমস্যা হয়েছে!');
    }
  };

  // Handle JSON Backup File Upload & Restore
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError('');
    setRestoreSuccess(false);
    const fileReader = new FileReader();
    const files = e.target.files;

    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Validation checks
        if (
          parsed &&
          Array.isArray(parsed.customers) &&
          Array.isArray(parsed.payments) &&
          parsed.companySettings
        ) {
          // Success restore
          onRestoreState(parsed as AppState);
          setRestoreSuccess(true);
          
          // Sync state values with newly restored settings
          setName(parsed.companySettings.name);
          setSlogan(parsed.companySettings.slogan);
          setAddress(parsed.companySettings.address);
          setPhone(parsed.companySettings.phone);
          setEmail(parsed.companySettings.email);
          setWebsite(parsed.companySettings.website || '');
          setBankDetails(parsed.companySettings.bankDetails || '');

          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          setRestoreError('ভুল ফাইল ফরম্যাট! ব্যাকআপ ফাইলটিতে কাস্টমার, পেমেন্ট এবং সেটিংসের সঠিক তথ্য থাকতে হবে।');
        }
      } catch (err) {
        setRestoreError('ফাইলটি রিড করতে ব্যর্থ হয়েছে! ফাইলটি কোনো বৈধ ব্যাকআপ জেসন (.json) ফাইল কিনা নিশ্চিত করুন।');
      }
    };

    fileReader.readAsText(files[0]);
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div>
        <h2 className="text-xl font-serif font-bold text-natural-text">সিস্টেম অ্যাডমিন প্যানেল (System Admin Panel)</h2>
        <p className="text-xs text-natural-muted mt-1">
          এখানে কোম্পানির প্রোফাইল, প্রকল্পের তালিকা, রিয়েল-টাইম কালার থিম এবং ডাটাবেজ ব্যাকআপ পুরোপুরি নিয়ন্ত্রণ করতে পারবেন।
        </p>
      </div>

      {/* Grid container with tab sidebar and content area */}
      <div className="bg-white rounded-3xl border border-natural-border shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-4">
        
        {/* Navigation Sidebar inside Card */}
        <div className="bg-natural-sidebar p-6 border-r border-natural-border space-y-1.5 flex flex-col md:col-span-1">
          <p className="text-[10px] uppercase font-bold text-natural-muted tracking-wider mb-3 px-3">অ্যাডমিন মডিউল</p>
          
          <button
            onClick={() => setAdminTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              adminTab === 'profile'
                ? 'bg-white text-natural-primary shadow-sm border border-natural-border'
                : 'text-natural-muted hover:text-natural-text hover:bg-[#EBE7E0]/40'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            কোম্পানি প্রোফাইল
          </button>

          <button
            onClick={() => setAdminTab('projects')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              adminTab === 'projects'
                ? 'bg-white text-natural-primary shadow-sm border border-natural-border'
                : 'text-natural-muted hover:text-natural-text hover:bg-[#EBE7E0]/40'
            }`}
          >
            <Building2 className="w-4 h-4" />
            প্রকল্প তালিকা (Projects)
          </button>

          <button
            onClick={() => setAdminTab('theme')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              adminTab === 'theme'
                ? 'bg-white text-natural-primary shadow-sm border border-natural-border'
                : 'text-natural-muted hover:text-natural-text hover:bg-[#EBE7E0]/40'
            }`}
          >
            <Palette className="w-4 h-4" />
            কালার থিম পরিবর্তন
          </button>

          <button
            onClick={() => setAdminTab('backup')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              adminTab === 'backup'
                ? 'bg-white text-natural-primary shadow-sm border border-natural-border'
                : 'text-natural-muted hover:text-natural-text hover:bg-[#EBE7E0]/40'
            }`}
          >
            <Database className="w-4 h-4" />
            ব্যাকআপ ও রিস্টোর
          </button>

          <button
            onClick={() => setAdminTab('google-sync')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              adminTab === 'google-sync'
                ? 'bg-white text-natural-primary shadow-sm border border-natural-border'
                : 'text-natural-muted hover:text-natural-text hover:bg-[#EBE7E0]/40'
            }`}
          >
            <Cloud className="w-4 h-4" />
            গুগল ড্রাইভ সিঙ্ক (Sync)
          </button>

          <button
            onClick={() => setAdminTab('security')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              adminTab === 'security'
                ? 'bg-white text-natural-primary shadow-sm border border-natural-border'
                : 'text-natural-muted hover:text-natural-text hover:bg-[#EBE7E0]/40'
            }`}
          >
            <Lock className="w-4 h-4" />
            সিস্টেম সিকিউরিটি (Security)
          </button>
        </div>

        {/* Tab Content Display Area */}
        <div className="p-8 md:col-span-3">
          
          {/* 1. COMPANY PROFILE TAB */}
          {adminTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-serif font-bold text-natural-text">কোম্পানির বিবরণ এবং রশিদ তথ্য</h3>
                <p className="text-xs text-natural-muted mt-1">এখানে পরিবর্তিত সকল তথ্য মানি রিসিট, অঙ্গীকারনামা এবং অন্যান্য প্রিন্ট ডকুমেন্টের প্যাডে স্বয়ংক্রিয়ভাবে আপডেট হবে।</p>
              </div>

              <form onSubmit={handleSubmitSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-natural-muted font-bold">কোম্পানির নাম (Company Name) *</label>
                    <input
                      type="text"
                      placeholder="কোম্পানির নাম লিখুন..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white focus:border-natural-primary rounded-xl px-3 py-2.5 outline-none font-bold text-natural-text"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-natural-muted font-bold">স্লোগান বা মোটো (Slogan / Motto)</label>
                    <input
                      type="text"
                      placeholder="স্লোগান লিখুন..."
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white focus:border-natural-primary rounded-xl px-3 py-2.5 outline-none font-medium italic text-natural-muted"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-natural-muted font-bold">অফিসের ঠিকানা (Office Address) *</label>
                    <input
                      type="text"
                      placeholder="ঠিকানা লিখুন..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white focus:border-natural-primary rounded-xl px-3 py-2.5 outline-none font-medium text-natural-text"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">ফোন বা মোবাইল নাম্বার (Contact Phone) *</label>
                    <input
                      type="text"
                      placeholder="০১৭xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white focus:border-natural-primary rounded-xl px-3 py-2.5 outline-none font-mono text-natural-text"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">ইমেইল এড্রেস (Office Email) *</label>
                    <input
                      type="email"
                      placeholder="support@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white focus:border-natural-primary rounded-xl px-3 py-2.5 outline-none font-mono text-natural-text"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">কোম্পানির ওয়েবসাইট (Website URL)</label>
                    <input
                      type="text"
                      placeholder="www.company.com.bd"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white focus:border-natural-primary rounded-xl px-3 py-2.5 outline-none font-mono text-natural-text"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-natural-muted font-bold">ব্যাংক একাউন্ট বিবরণী (Bank Account Details)</label>
                    <textarea
                      placeholder="ব্যাংক ও ব্রাঞ্চের নাম, হিসাব নম্বর..."
                      value={bankDetails}
                      onChange={(e) => setBankDetails(e.target.value)}
                      rows={3}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white focus:border-natural-primary rounded-xl px-3 py-2.5 outline-none font-medium text-natural-text"
                    ></textarea>
                  </div>

                </div>

                {saveSuccess && (
                  <div className="bg-natural-sidebar border border-natural-border text-natural-primary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-natural-primary" />
                    কোম্পানির প্রোফাইল সফলভাবে আপডেট করা হয়েছে!
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs px-6 py-3 rounded-xl shadow flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Save className="w-4 h-4" />
                    প্রোফাইল সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. PROJECTS MANAGEMENT TAB */}
          {adminTab === 'projects' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-serif font-bold text-natural-text">প্রকল্প ব্যবস্থাপনা (Project Directory)</h3>
                <p className="text-xs text-natural-muted mt-1">এখানে নতুন রিয়েল এস্টেট প্রকল্প যুক্ত করতে পারেন অথবা বিদ্যমান প্রকল্প বাতিল করতে পারেন।</p>
              </div>

              {/* Add Project Inline Form */}
              <form onSubmit={handleAddProjectSubmit} className="bg-natural-sidebar/50 border border-natural-border p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-natural-text flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-natural-primary" />
                  নতুন প্রজেক্ট যুক্ত করুন (Add Project)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">প্রকল্পের নাম (Project Name) *</label>
                    <input
                      type="text"
                      placeholder="যেমন: আর আর সিটি গার্ডেন..."
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full border border-natural-border bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">প্রকল্পের ঠিকানা (Project Location) *</label>
                    <input
                      type="text"
                      placeholder="যেমন: ব্লক সি, বাড্ডা, ঢাকা..."
                      value={newProjAddress}
                      onChange={(e) => setNewProjAddress(e.target.value)}
                      className="w-full border border-natural-border bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                      required
                    />
                  </div>
                </div>

                {projectSuccess && (
                  <div className="bg-white border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-xl font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    নতুন প্রকল্প সফলভাবে যুক্ত হয়েছে! এটি এখন গ্রাহক যুক্ত করার সময় নির্বাচন করতে পারবেন।
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all cursor-pointer"
                  >
                    প্রজেক্ট যুক্ত করুন
                  </button>
                </div>
              </form>

              {/* Projects List Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-natural-muted uppercase tracking-wider">বিদ্যমান প্রকল্পসমূহ: ({projects.length})</h4>
                <div className="border border-natural-border rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-natural-sidebar text-natural-muted font-bold text-[10px] uppercase border-b border-natural-border">
                        <th className="p-3">প্রকল্পের নাম (Project Name)</th>
                        <th className="p-3">ঠিকানা (Address)</th>
                        <th className="p-3 text-center">অ্যাকশন (Action)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-natural-sidebar">
                      {projects.length > 0 ? (
                        projects.map(p => (
                          <tr key={p.id} className="hover:bg-natural-sidebar/30 transition-colors">
                            <td className="p-3 font-bold text-natural-text">{p.name}</td>
                            <td className="p-3 text-natural-muted">{p.address}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`আপনি কি সত্যিই "${p.name}" প্রকল্পটি মুছে ফেলতে চান?`)) {
                                    onDeleteProject(p.id);
                                  }
                                }}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-lg border border-rose-200 transition-all cursor-pointer"
                                title="প্রজেক্ট বাতিল/ডিলিট করুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-natural-muted">কোনো প্রকল্প পাওয়া যায়নি! অনুগ্রহ করে উপরে নতুন প্রকল্প যুক্ত করুন।</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 3. COLOR & THEME SELECTION TAB */}
          {adminTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-serif font-bold text-natural-text">সিস্টেম কালার থিম পরিবর্তন (Change Color Theme)</h3>
                <p className="text-xs text-natural-muted mt-1">পছন্দসই রঙ সিলেক্ট করার সাথে সাথে অ্যাপ্লিকেশনের হেডার, বাটন, সাইডবার ও প্রিন্ট পেজ লেআউট রিয়েল-টাইমে পরিবর্তিত হবে।</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themeOptions.map((opt) => {
                  const isSelected = (settings.themeColor || 'natural') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectTheme(opt.id)}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-32 transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-natural-primary bg-natural-sidebar/30 ring-2 ring-natural-primary/20'
                          : 'border-natural-border bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`w-8 h-8 rounded-xl ${opt.preview} flex items-center justify-center text-white font-bold text-xs shadow`}>
                          T
                        </span>
                        {isSelected && (
                          <span className="bg-natural-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-natural-text leading-none">{opt.name}</p>
                        <p className="text-[10px] text-natural-muted mt-1 font-mono">রঙ কোড: {opt.primary}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {saveSuccess && (
                <div className="bg-natural-sidebar border border-natural-border text-natural-primary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-natural-primary" />
                  সিস্টেম থিম রঙ সফলভাবে আপডেট করা হয়েছে!
                </div>
              )}
            </div>
          )}

          {/* 4. DATABASE BACKUP TAB */}
          {adminTab === 'backup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-serif font-bold text-natural-text">ডাটাবেজ ব্যাকআপ ও রিস্টোর হাব</h3>
                <p className="text-xs text-natural-muted mt-1">সিস্টেমের সমস্ত ডাটা সুরক্ষিত রাখতে ব্যাকআপ ফাইল তৈরি করুন বা পুরাতন ব্যাকআপ ডাটা আপলোড করুন।</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Backup Card */}
                <div className="bg-natural-sidebar/30 border border-natural-border p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-natural-text flex items-center gap-1.5 uppercase tracking-wide">
                    <Download className="w-4.5 h-4.5 text-natural-primary" />
                    ব্যাকআপ ফাইল ডাউনলোড
                  </h4>
                  <p className="text-[11px] text-natural-muted leading-relaxed">
                    অ্যাপে থাকা কাস্টমার তালিকা, সমস্ত পেমেন্ট লেজার, কোম্পানি বিবরণী এবং প্রকল্পসমূহ একটি জেসন (.json) ফাইলে ব্যাকআপ করুন।
                  </p>
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    জেসন ফাইল ডাউনলোড করুন
                  </button>
                </div>

                {/* Restore Card */}
                <div className="bg-white border border-natural-border p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-natural-text flex items-center gap-1.5 uppercase tracking-wide mb-2">
                      <Upload className="w-4.5 h-4.5 text-rose-700" />
                      ডাটাবেজ রিস্টোর
                    </h4>
                    <p className="text-[11px] text-rose-800 bg-rose-50/50 p-3 rounded-xl border border-rose-100 leading-normal mb-3">
                      <strong>সতর্কতা:</strong> ব্যাকআপ রিস্টোর করলে বর্তমান সমস্ত ডাটা মুছে যাবে এবং আপলোড করা ব্যাকআপ ফাইলের ডাটা সফলভাবে প্রতিস্থাপিত হবে।
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept=".json"
                      ref={fileInputRef}
                      onChange={handleRestoreBackup}
                      className="hidden"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-natural-sidebar hover:bg-[#EBE7E0]/60 text-natural-primary border border-natural-border font-bold text-xs py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-natural-primary" />
                      জেসন ফাইল আপলোড করুন
                    </button>
                  </div>
                </div>

              </div>

              {restoreSuccess && (
                <div className="bg-natural-sidebar border border-natural-border text-natural-primary text-xs px-3 py-2 rounded-xl font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-natural-primary" />
                  ডাটাবেজ সফলভাবে রিস্টোর করা হয়েছে! সমস্ত ট্যাব রিফ্রেশ করা হয়েছে।
                </div>
              )}

              {restoreError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2 rounded-xl font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{restoreError}</span>
                </div>
              )}

            </div>
          )}

          {/* 5. GOOGLE DRIVE SYNC TAB */}
          {adminTab === 'google-sync' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-serif font-bold text-natural-text">গুগল ড্রাইভ ও গুগল শিট রিয়েল-টাইম সিঙ্ক</h3>
                <p className="text-xs text-natural-muted mt-1">
                  আপনার এআর প্রপার্টিজ অ্যাপের সমস্ত গ্রাহক তালিকা এবং পেমেন্ট খতিয়ান সরাসরি আপনার নিজস্ব গুগল ড্রাইভে এক্সেল শিট (Google Sheets) হিসেবে সিঙ্ক করে রাখুন।
                </p>
              </div>

              {!googleUser ? (
                /* Disconnected / Connect State */
                <div className="border border-natural-border rounded-2xl p-6 space-y-6 bg-natural-sidebar/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
                      <Cloud className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-natural-text uppercase tracking-wider">গুগল ক্লাউড সংযোগ নিষ্ক্রিয়</h4>
                      <p className="text-[11px] text-natural-muted leading-relaxed">
                        গুগল ড্রাইভ কানেক্ট করা হলে, সিস্টেমটি আপনার ড্রাইভের ভেতরে স্বয়ংক্রিয়ভাবে <strong className="text-natural-primary">"A.R. Properties - Ledger Sync"</strong> নামে একটি সুরক্ষিত স্প্রেডশিট ফাইল তৈরি করবে এবং সমস্ত লাইভ এন্ট্রি সেখানে ব্যাকআপ করে দেবে।
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-natural-border pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-[10px] text-natural-muted font-medium max-w-md">
                      🔒 <strong>নিরাপত্তা গ্যারান্টি:</strong> আপনার অনুমতি সাপেক্ষে শুধুমাত্র এই নির্দিষ্ট স্প্রেডশিট ফাইলটিতেই ডাটা রাইট করা হবে। আপনার অন্য কোনো ব্যক্তিগত ফাইলে এই অ্যাপ অ্যাক্সেস করবে না।
                    </p>

                    {/* Styled Google Sign In Button */}
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isGoogleLoggingIn}
                      className="inline-flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm rounded-xl px-5 py-3 text-xs font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isGoogleLoggingIn ? (
                        <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                      )}
                      <span>Google দিয়ে কানেক্ট করুন</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Connected State */
                <div className="space-y-6">
                  
                  {/* Account Info Bar */}
                  <div className="border border-natural-border rounded-2xl p-5 bg-natural-sidebar/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {googleUser.photoURL ? (
                        <img
                          src={googleUser.photoURL}
                          alt={googleUser.displayName || ''}
                          className="w-10 h-10 rounded-full border border-natural-border shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-natural-primary text-white flex items-center justify-center font-bold text-sm">
                          {googleUser.displayName?.charAt(0) || 'G'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-natural-text leading-none">
                            {googleUser.displayName || 'Google User'}
                          </h4>
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            সংযুক্ত
                          </span>
                        </div>
                        <p className="text-[10px] text-natural-muted font-semibold mt-1">{googleUser.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleGoogleLogout}
                      className="bg-white hover:bg-slate-50 text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      ডিসকানেক্ট করুন
                    </button>
                  </div>

                  {/* Sync Controls Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* Sync Action Block */}
                    <div className="bg-white border border-natural-border p-6 rounded-2xl space-y-4 flex flex-col justify-between shadow-sm">
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-natural-text uppercase tracking-wider flex items-center gap-1.5">
                          <RefreshCw className={`w-4 h-4 text-natural-primary ${isSyncing ? 'animate-spin' : ''}`} />
                          গুগল শিট ক্লাউড সিঙ্ক
                        </h4>
                        <p className="text-[11px] text-natural-muted leading-relaxed">
                          আপনার লোকাল স্টোরেজে থাকা সর্বশেষ গ্রাহক ডাটা ({customers.length} জন) এবং ট্রানজেকশন ডাটা ({payments.length} টি) গুগল শিটে রাইট করুন।
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <button
                          onClick={handleSyncToSheets}
                          disabled={isSyncing}
                          className="w-full bg-natural-primary hover:bg-natural-primary-hover disabled:bg-natural-muted text-white font-bold text-xs py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isSyncing ? (
                            <RefreshCw className="w-4.5 h-4.5 text-white animate-spin" />
                          ) : (
                            <Cloud className="w-4.5 h-4.5 text-white" />
                          )}
                          <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'এখনই সিঙ্ক করুন (Sync Now)'}</span>
                        </button>
                        
                        {isSyncing && syncStatus && (
                          <p className="text-[10px] text-center text-natural-primary font-bold font-mono animate-pulse">
                            {syncStatus}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* File Launch Block */}
                    <div className="bg-[#EBE7E0]/15 border border-natural-border p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-natural-text uppercase tracking-wider flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                          গুগল ড্রাইভ ফাইল লিংক
                        </h4>
                        <p className="text-[11px] text-natural-muted leading-relaxed">
                          সফলভাবে সিঙ্ক সম্পন্ন করার পর, আপনি গুগল ড্রাইভ থেকে সরাসরি অনলাইন স্প্রেডশিটটি ওপেন করে দেখতে ও এডিট করতে পারবেন।
                        </p>
                      </div>

                      {syncUrl ? (
                        <a
                          href={syncUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition-all text-center cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          অনলাইন গুগল শিট খুলুন
                        </a>
                      ) : (
                        <div className="w-full bg-slate-100 text-slate-400 font-bold text-xs py-2.5 rounded-xl text-center border border-dashed border-slate-200">
                          প্রথমে সিঙ্ক সম্পন্ন করুন
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}

              {syncError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{syncError}</span>
                </div>
              )}

              {/* Troubleshooting Guide collapsible */}
              <div className="border border-natural-border rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-natural-text hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4.5 h-4.5 text-natural-primary" />
                    গুগল কানেক্ট হচ্ছে না? ডোমেইন সমাধান ও লগইন গাইড (Google Connection Troubleshooting)
                  </span>
                  {showTroubleshoot ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showTroubleshoot && (
                  <div className="px-5 pb-5 border-t border-natural-border pt-4 text-[11px] text-natural-muted space-y-4">
                    <div className="bg-amber-50 text-amber-900 p-3.5 rounded-xl border border-amber-100 space-y-1.5 leading-relaxed">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        প্রধান কারণ: ফায়ারবেস অথরাইজড ডোমেইন (unauthorized-domain)
                      </p>
                      <p>
                        আপনি যখন কাস্টম ডোমেইন (যেমন: <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px] font-mono">arpropertieserp.netlify.app</code>) থেকে লগইন করার চেষ্টা করছেন, ফায়ারবেস সিকিউরিটির জন্য এটি ব্লক করে দেয় যদি না এই ডোমেইনটি অথরাইজড ডোমেইন তালিকায় যুক্ত থাকে।
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="font-bold text-natural-text">সমাধানের পদক্ষেপসমূহ (Steps to Fix):</p>
                      
                      <div className="space-y-3 pl-2 border-l-2 border-natural-primary/30">
                        <p>
                          <strong>১. শেয়ার্ড লিংক (Shared App URL) ব্যবহার করুন (সবচেয়ে সহজ সমাধান):</strong>
                        </p>
                        <p className="pl-2 leading-relaxed">
                          যেহেতু এই ফায়ারবেস প্রজেক্টটি একটি <strong>AI Studio Starter Tier (ফ্রি ট্রায়াল)</strong> প্রজেক্ট, তাই সিকিউরিটির জন্য গুগল সরাসরি কনসোলে নতুন কোনো ডোমেইন ম্যানুয়ালি এড করার বাটন (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">Add Domain</code>) হাইড বা নিষ্ক্রিয় করে রাখে।
                        </p>
                        <p className="pl-2 leading-relaxed">
                          তাই Netlify-এর পরিবর্তে গুগল এআই স্টুডিওর দেওয়া আসল <strong>Shared App URL</strong> ব্যবহার করুন। এই লিংকে গুগল কানেক্ট সহ ক্লাউড ডাটাবেস সম্পূর্ণভাবে এবং কোনো ডোমেইন ইরর ছাড়াই নিখুঁতভাবে কাজ করবে:
                        </p>
                        <div className="pl-2">
                          <a 
                            href="https://ais-pre-ls4gayjxukrpy7hnlowcwg-69363354627.asia-southeast1.run.app" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="bg-natural-primary/10 hover:bg-natural-primary/20 text-natural-primary px-3 py-1.5 rounded-lg font-bold text-[10px] inline-block transition-colors"
                          >
                            শেয়ার্ড লিংকে অ্যাপটি ওপেন করুন ↗
                          </a>
                        </div>
                      </div>

                      <div className="space-y-2 pl-2 border-l-2 border-natural-primary/30">
                        <p>
                          <strong>২. নিজস্ব কাস্টম ফায়ারবেস প্রোজেক্ট ব্যবহার (স্থায়ী সমাধান):</strong>
                        </p>
                        <p className="pl-2 leading-relaxed">
                          আপনি যদি অবশ্যই নিজস্ব কাস্টম ডোমেইন (যেমন <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">arpropertieserp.netlify.app</code>) ব্যবহার করতে চান, তাহলে আপনাকে আপনার নিজস্ব জিমেইল দিয়ে একটি নতুন ফায়ারবেস প্রোজেক্ট তৈরি করতে হবে এবং সেটিকে "Blaze/Pay-as-you-go" প্ল্যানে রূপান্তর করতে হবে। এরপর আপনার নিজস্ব ফায়ারবেস ক্রেডেনশিয়াল অ্যাপে যুক্ত করলে আপনি স্বাধীনভাবে ডোমেইন এড করার বাটনটি দেখতে পাবেন এবং যেকোনো কাস্টম ডোমেইন যুক্ত করতে পারবেন।
                        </p>
                      </div>

                      <div className="space-y-2 pl-2 border-l-2 border-natural-primary/30">
                        <p>
                          <strong>২. ব্রাউজার পপ-আপ এবং রিডাইরেক্ট এলাও করুন:</strong>
                        </p>
                        <p className="pl-2 leading-relaxed">
                          লগইন বাটনে ক্লিক করলে ব্রাউজারের এড্রেস বারের ডান পাশে একটি পপ-আপ ব্লকার আইকন দেখাতে পারে। সেখানে ক্লিক করে "Always allow popups and redirects from this site" সিলেক্ট করুন।
                        </p>
                      </div>

                      <div className="space-y-2 pl-2 border-l-2 border-natural-primary/30">
                        <p>
                          <strong>৩. আইফ্রেম (iFrame) সীমাবদ্ধতা এড়াতে নতুন ট্যাবে অ্যাপটি খুলুন:</strong>
                        </p>
                        <p className="pl-2 leading-relaxed">
                          ডেভেলপমেন্ট বা প্রিভিউ চলাকালীন আইফ্রেম ব্লক এড়াতে সরাসরি এই লিংকে ক্লিক করে নতুন ট্যাবে ট্রাই করুন: <a href="https://ais-dev-ls4gayjxukrpy7hnlowcwg-69363354627.asia-southeast1.run.app" target="_blank" rel="noreferrer" className="text-natural-primary underline font-bold">Open App in New Tab</a>।
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Schema Map Info */}
              <div className="bg-slate-50 rounded-2xl border border-slate-150 p-5 space-y-3">
                <h4 className="text-xs font-bold text-natural-text">সিস্টেম ডাটা ম্যাপ (Synced Spreadsheet Structure)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-natural-muted">
                  <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200">
                    <p className="font-bold text-natural-primary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-natural-primary rounded-full"></span>
                      ট্যাব ১: গ্রাহক তালিকা (Customers)
                    </p>
                    <p className="text-[10px] leading-relaxed">
                      গ্রাহক আইডি, নাম, মোবাইল, এনআইডি, প্রজেক্ট, প্লট নম্বর, প্লট সাইজ, মূল্য, মোট পরিশোধ, বকেয়া এবং দলিলের তথ্য।
                    </p>
                  </div>
                  <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200">
                    <p className="font-bold text-natural-primary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-natural-primary rounded-full"></span>
                      ট্যাব ২: পেমেন্ট লেজার (Payments)
                    </p>
                    <p className="text-[10px] leading-relaxed">
                      মানি রিসিট নম্বর, গ্রাহক আইডি, গ্রাহকের নাম, পেমেন্ট তারিখ, ধরণ, পেমেন্ট মাধ্যম, এমাউন্ট এবং মন্তব্য।
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 6. SYSTEM SECURITY TAB */}
          {adminTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-serif font-bold text-natural-text">সিস্টেম সিকিউরিটি ও পাসওয়ার্ড গেটওয়ে</h3>
                <p className="text-xs text-natural-muted mt-1">
                  এই প্যানেল থেকে আপনার ERP সিস্টেমের ব্রাউজার লেভেল সিকিউরিটি নিয়ন্ত্রণ করুন।
                </p>
              </div>

              <form onSubmit={handleSaveSecuritySettings} className="space-y-5">
                
                {/* Security Status Card */}
                <div className="bg-slate-50/50 rounded-2xl border border-natural-border p-5 space-y-4">
                  <h4 className="text-xs font-bold text-natural-text">সিকিউরিটি সেটিংস (Security Configuration)</h4>
                  
                  <div className="flex items-center justify-between bg-white border border-natural-border rounded-xl p-4">
                    <div>
                      <p className="text-xs font-bold text-natural-text">পাসওয়ার্ড গেটওয়ে সক্রিয় করুন</p>
                      <p className="text-[10px] text-natural-muted mt-0.5">চালু থাকলে যে কোনো ভিজিটরকে সিস্টেম ব্যবহারের পূর্বে লগইন করতে হবে।</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={authEnabled}
                        onChange={(e) => setAuthEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-natural-primary"></div>
                    </label>
                  </div>
                </div>

                {/* Password Credentials Configuration */}
                {authEnabled && (
                  <div className="bg-slate-50/50 rounded-2xl border border-natural-border p-5 space-y-4">
                    <h4 className="text-xs font-bold text-natural-text">লগইন ক্রেডেনশিয়াল (Login Credentials)</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                      
                      {/* User ID */}
                      <div className="space-y-1">
                        <label className="text-natural-muted font-bold">ইউজার আইডি (User ID) *</label>
                        <input
                          type="text"
                          required
                          placeholder="ইউজার আইডি লিখুন"
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-natural-border rounded-xl text-natural-text text-xs font-medium focus:outline-none focus:ring-1 focus:ring-natural-primary focus:border-natural-primary shadow-sm"
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <label className="text-natural-muted font-bold">পাসওয়ার্ড (Password) *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="পাসওয়ার্ড লিখুন"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 bg-white border border-natural-border rounded-xl text-natural-text text-xs font-medium focus:outline-none focus:ring-1 focus:ring-natural-primary focus:border-natural-primary shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-natural-muted hover:text-natural-text transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Submit Action Block */}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#123C24] hover:bg-[#0B2516] active:bg-[#05140b] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    সিকিউরিটি সেটিংস সেভ করুন
                  </button>

                  {securitySaveSuccess && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-fade-in bg-emerald-50 border border-emerald-150 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                      সেটিংস সফলভাবে সংরক্ষিত হয়েছে!
                    </span>
                  )}
                </div>

              </form>

              {/* Warning/Guide Panel */}
              <div className="bg-amber-50 text-amber-900 p-4 rounded-2xl border border-amber-100 space-y-1.5 leading-relaxed text-xs">
                <p className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  গুরুত্বপূর্ণ নিরাপত্তা নির্দেশাবলী (Security Notice)
                </p>
                <p>
                  ১. এই ইউজার আইডি এবং পাসওয়ার্ডটি মনে রাখা আবশ্যক। আপনি যদি ভুলে যান, তবে ব্রাউজার ডেটা ক্লিয়ার করলে বা ডাটাবেস রিসেট করলে এটি পুনরায় ডিফল্ট ক্রেডেনশিয়াল (<code className="font-mono bg-amber-100 px-1 rounded text-amber-950">admin</code> / <code className="font-mono bg-amber-100 px-1 rounded text-amber-950">admin</code>) এ ফিরে যাবে।
                </p>
                <p>
                  ২. নিরাপত্তা আরও জোরদার করতে অন্তত ৪ অক্ষরের শক্তিশালী পাসওয়ার্ড ব্যবহারের পরামর্শ দেয়া হচ্ছে।
                </p>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
