import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Small delay for professional UI feedback
    setTimeout(() => {
      const savedUsername = localStorage.getItem('ar_prop_auth_username') || 'admin';
      const savedPassword = localStorage.getItem('ar_prop_auth_password') || 'admin';

      if (usernameInput.trim() === savedUsername && passwordInput === savedPassword) {
        sessionStorage.setItem('ar_prop_is_logged_in', 'true');
        if (rememberMe) {
          localStorage.setItem('ar_prop_remember_me', 'true');
        } else {
          localStorage.removeItem('ar_prop_remember_me');
        }
        onLoginSuccess();
      } else {
        setError('ভুল ইউজার আইডি অথবা পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।');
        setIsSubmitting(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-4 sm:p-6 font-sans select-none relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#123C24]/5 blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#123C24]/5 blur-3xl"></div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200/80 shadow-xl shadow-stone-200/50 p-8 sm:p-10 relative z-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#123C24] flex items-center justify-center shadow-lg shadow-[#123C24]/20 animate-fade-in">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="font-extrabold text-lg sm:text-xl text-stone-900 tracking-tight uppercase">
              AR Properties
            </h1>
            <p className="text-xs text-stone-500 font-bold tracking-wider uppercase">
              Real Estate ERP Gateway
            </p>
          </div>
          <div className="h-[1px] w-16 bg-stone-200 mx-auto mt-4"></div>
        </div>

        {/* Security Alert Banner */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-6 text-xs text-stone-600 leading-relaxed">
          <p className="font-bold text-[#123C24] mb-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            সিস্টেম সিকিউরিটি অ্যাক্সেস
          </p>
          <p>
            এই লিংকটি সুরক্ষিত রাখা হয়েছে। সিস্টেমে প্রবেশ করার জন্য আপনার অ্যাডমিন ইউজার আইডি এবং পাসওয়ার্ড প্রদান করুন।
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 block pl-1">
              ইউজার আইডি (User ID)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="ইউজার আইডি লিখুন (যেমন: admin)"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-stone-800 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123C24]/15 focus:border-[#123C24] transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 block pl-1">
              পাসওয়ার্ড (Password)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="পাসওয়ার্ড লিখুন"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-stone-800 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123C24]/15 focus:border-[#123C24] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-stone-600 font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-[#123C24] focus:ring-[#123C24] cursor-pointer accent-[#123C24]"
              />
              <span>আমাকে মনে রাখুন (Remember Me)</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#123C24] hover:bg-[#0B2516] active:bg-[#05140b] disabled:bg-stone-300 text-white py-3.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-[#123C24]/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                যাচাই করা হচ্ছে...
              </>
            ) : (
              'লগইন করুন (Sign In)'
            )}
          </button>
        </form>

        {/* Default Help Notice */}
        <div className="mt-8 border-t border-stone-150 pt-5 text-center">
          <p className="text-[10px] text-stone-500 leading-relaxed font-semibold">
            প্রথমবার ব্যবহারের জন্য ইউজার আইডি এবং পাসওয়ার্ড উভয় ক্ষেত্রেই{' '}
            <code className="bg-stone-100 text-[#123C24] px-1.5 py-0.5 rounded font-mono text-xs">
              admin
</code>{' '}
            টাইপ করুন।
            <br />
            লগইন করার পর <strong>অ্যাডমিন প্যানেল</strong> থেকে এটি পরিবর্তন বা বন্ধ করতে পারবেন।
          </p>
        </div>

      </div>
    </div>
  );
}
