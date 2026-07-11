import React from 'react';
import { Customer, Payment, CompanySettings } from '../types';
import { formatCurrency, toBengaliDigits } from '../utils';
import { Users, DollarSign, AlertCircle, FileCheck, ArrowUpRight, TrendingUp, Landmark, FileText, Printer } from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
  payments: Payment[];
  companySettings: CompanySettings;
  onNavigateToTab: (tab: string) => void;
  onQuickPrint: (customer: Customer, docType: 'receipt' | 'acknowledgment' | 'schedule' | 'history' | 'deed', payment: Payment | null) => void;
}

export default function Dashboard({
  customers,
  payments,
  companySettings,
  onNavigateToTab,
  onQuickPrint
}: DashboardProps) {
  // Stats calculations
  const totalCustomers = customers.length;
  const totalBookingValue = customers.reduce((sum, c) => sum + c.totalPrice, 0);
  const totalCollected = payments.reduce((sum, p) => {
    if (p.type === 'Withdraw' || p.type === 'PLOT Cancel') {
      return sum - p.amount;
    }
    return sum + p.amount;
  }, 0);
  const totalDue = Math.max(0, totalBookingValue - totalCollected);

  // Recent payments
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Group payments by type for visual breakdown
  const paymentTypeBreakdown = payments.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const getPercentage = (value: number) => {
    if (totalBookingValue === 0) return 0;
    return Math.round((value / totalBookingValue) * 100);
  };

  const getCustomerName = (customerId: string) => {
    const cust = customers.find(c => c.customerId === customerId);
    return cust ? cust.name.split(' (')[0] : customerId;
  };

  const getCustomerObj = (customerId: string) => {
    return customers.find(c => c.customerId === customerId);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="bg-natural-primary text-white rounded-3xl p-8 relative overflow-hidden shadow-sm border border-natural-border/10">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-[#E5E1DA] text-xs px-3 py-1 rounded-full font-medium mb-4">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            রিয়েল এস্টেট ড্যাশবোর্ড / Real Estate System Live
          </span>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-white">
            {companySettings.name.split(' (')[0]}
          </h2>
          <p className="text-sm text-[#E5E1DA]/80 mt-2 italic font-light font-sans">
            {companySettings.slogan}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={() => onNavigateToTab('search')}
              className="bg-white hover:bg-[#EBE7E0] text-natural-primary font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
            >
              আজকের কালেকশন এন্ট্রি (Operator Screen)
              <ArrowUpRight className="w-4 h-4 text-natural-primary" />
            </button>
            <button
              onClick={() => onNavigateToTab('customers')}
              className="bg-natural-primary-hover hover:bg-natural-primary/80 border border-white/20 text-[#F5F2EE] font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              নতুন কাস্টমার নিবন্ধন
            </button>
          </div>
        </div>
      </div>

      {/* Core KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Customers */}
        <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm flex items-start justify-between hover:shadow-md transition-all group">
          <div className="space-y-2">
            <p className="text-xs font-bold text-natural-muted uppercase tracking-wider">মোট নিবন্ধিত গ্রাহক</p>
            <h3 className="text-3xl font-serif font-bold text-natural-text tracking-tight">
              {totalCustomers} <span className="text-sm font-sans font-semibold text-natural-muted">জন</span>
            </h3>
            <p className="text-xs text-natural-muted flex items-center gap-1">
              <span className="font-semibold text-natural-primary font-mono">+{customers.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length}</span> এই মাসে নতুন
            </p>
          </div>
          <div className="p-3.5 bg-natural-sidebar text-natural-primary rounded-xl group-hover:bg-[#EBE7E0]/60 transition-colors">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Booking Value */}
        <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm flex items-start justify-between hover:shadow-md transition-all group">
          <div className="space-y-2">
            <p className="text-xs font-bold text-natural-muted uppercase tracking-wider">মোট বরাদ্দকৃত চুক্তি মূল্য</p>
            <h3 className="text-2xl font-serif font-bold text-natural-text tracking-tight">
              ৳ {formatCurrency(totalBookingValue)}
            </h3>
            <p className="text-xs text-natural-muted flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-natural-primary" />
              প্লটের মোট মূল্যমানের চুক্তি
            </p>
          </div>
          <div className="p-3.5 bg-[#5A5A40]/10 text-natural-primary rounded-xl group-hover:bg-[#5A5A40]/20 transition-colors">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Collected */}
        <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm flex items-start justify-between hover:shadow-md transition-all group">
          <div className="space-y-2">
            <p className="text-xs font-bold text-natural-muted uppercase tracking-wider">মোট আদায়কৃত টাকা (Paid)</p>
            <h3 className="text-2xl font-serif font-bold text-[#5A5A40] tracking-tight">
              ৳ {formatCurrency(totalCollected)}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-natural-sidebar h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-natural-primary h-full rounded-full" 
                  style={{ width: `${getPercentage(totalCollected)}%` }}
                ></div>
              </div>
              <p className="text-xs text-natural-muted font-semibold font-mono">{getPercentage(totalCollected)}% আদায় সম্পন্ন</p>
            </div>
          </div>
          <div className="p-3.5 bg-[#5A5A40]/15 text-natural-primary rounded-xl group-hover:bg-[#5A5A40]/25 transition-colors">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Due */}
        <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm flex items-start justify-between hover:shadow-md transition-all group">
          <div className="space-y-2">
            <p className="text-xs font-bold text-natural-muted uppercase tracking-wider">মোট বকেয়া পাওনা (Due)</p>
            <h3 className="text-2xl font-serif font-bold text-red-700 tracking-tight">
              ৳ {formatCurrency(totalDue)}
            </h3>
            <p className="text-xs flex items-center gap-1 text-red-700/80 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              {getPercentage(totalDue)}% অবশিষ্ট সংগ্রহ যোগ্য
            </p>
          </div>
          <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl group-hover:bg-rose-100 transition-colors">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Charts & Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Progress Breakdown & Statistics Card */}
        <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-serif font-bold text-natural-text">কালেকশন ধরণ অনুযায়ী বিশ্লেষণ</h3>
                <p className="text-xs text-natural-muted mt-0.5">পেমেন্ট ক্যাটাগরি ও মোট আদায়কৃত অনুপাত</p>
              </div>
              <span className="text-xs font-semibold text-natural-muted bg-natural-sidebar border border-natural-border px-3 py-1 rounded-full font-mono">
                মোট ট্রানজেকশন: {payments.length} টি
              </span>
            </div>

            {/* Custom SVG/CSS Bar Chart for zero-dependency beautiful display */}
            <div className="space-y-5">
              {(['Booking', 'Down Payment', 'Installment', 'Others'] as const).map(type => {
                const amt = paymentTypeBreakdown[type] || 0;
                const ratio = totalCollected > 0 ? Math.round((amt / totalCollected) * 100) : 0;
                
                // Color mapping
                const colorClass = 
                  type === 'Booking' ? 'bg-natural-primary' :
                  type === 'Down Payment' ? 'bg-natural-muted' :
                  type === 'Installment' ? 'bg-natural-primary/80' : 'bg-natural-border';

                const labelBn = 
                  type === 'Booking' ? 'বুকিং অর্থ (Booking)' :
                  type === 'Down Payment' ? 'ডাউন পেমেন্ট (Down Payment)' :
                  type === 'Installment' ? 'নিয়মিত কিস্তি (Installments)' : 'অন্যান্য আদায় (Others)';

                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-natural-text">{labelBn}</span>
                      <span className="text-natural-text font-serif">৳ {formatCurrency(amt)} ({ratio}%)</span>
                    </div>
                    <div className="w-full bg-natural-sidebar h-3 rounded-full overflow-hidden border border-natural-border">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${colorClass}`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-natural-border pt-4 mt-6 flex justify-between items-center text-xs text-natural-muted leading-normal">
            <p>প্রতিটি কিস্তি এন্ট্রি সাথে সাথে রিয়েল-টাইম রিসিট জেনারেট হয়ে যায়।</p>
            <button 
              onClick={() => onNavigateToTab('payments')}
              className="text-natural-primary hover:text-natural-primary-hover font-bold flex items-center gap-1 cursor-pointer"
            >
              সকল বিবরণী দেখুন &rarr;
            </button>
          </div>
        </div>

        {/* Quick Project summary card */}
        <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-natural-text mb-1">অ্যাক্টিভ প্রকল্প সারসংক্ষেপ</h3>
            <p className="text-xs text-natural-muted mb-4">আমাদের চলমান প্রকল্পসমূহের ওভারভিউ</p>
            
            <div className="divide-y divide-natural-border">
              {Array.from(new Set(customers.map(c => c.projectName))).slice(0, 3).map((projectName, i) => {
                const projectCusts = customers.filter(c => c.projectName === projectName);
                const totalProjValue = projectCusts.reduce((sum, c) => sum + c.totalPrice, 0);

                return (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-xs font-bold text-natural-text truncate">{projectName.split(' (')[0]}</p>
                    <div className="flex justify-between text-[11px] text-natural-muted mt-1 font-mono">
                      <span>{projectCusts.length} টি প্লট বরাদ্দ</span>
                      <span className="text-natural-primary font-bold font-serif">৳ {formatCurrency(totalProjValue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-natural-sidebar rounded-2xl p-4 border border-natural-border mt-6 text-center">
            <p className="text-xs text-natural-muted leading-relaxed">আপনার আবাসন ডাটাবেজ সুরক্ষিত আছে। নিয়মিত ব্যাকআপ ডাউনলোড করতে সেটিংস থেকে ব্যাকআপ অপশনটি বেছে নিন।</p>
          </div>
        </div>

      </div>

      {/* Recent Collections Table Feed */}
      <div className="bg-white rounded-3xl border border-natural-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-natural-border flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-base font-serif font-bold text-natural-text">সাম্প্রতিক সংগৃহীত পেমেন্টসমূহ (Recent Collections)</h3>
            <p className="text-xs text-natural-muted mt-0.5">সিস্টেমে সদ্য এন্ট্রি হওয়া সর্বশেষ পেমেন্ট ট্রানজেকশন</p>
          </div>
          <button
            onClick={() => onNavigateToTab('payments')}
            className="text-natural-primary hover:text-natural-primary-hover text-xs font-bold border border-natural-border hover:bg-natural-sidebar px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            সব পেমেন্ট দেখুন
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-natural-sidebar text-natural-muted font-bold uppercase tracking-wider text-[10px] border-b border-natural-border">
                <th className="p-4">রশিদ নং (Receipt)</th>
                <th className="p-4">গ্রাহক তথ্য (Customer)</th>
                <th className="p-4">তারিখ (Date)</th>
                <th className="p-4">ধরণ (Type)</th>
                <th className="p-4 text-right">আদায়কৃত টাকা (Amount)</th>
                <th className="p-4 text-center">রশিদ প্রিন্ট (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-sidebar">
              {recentPayments.length > 0 ? (
                recentPayments.map(p => {
                  const custObj = getCustomerObj(p.customerId);
                  return (
                    <tr key={p.id} className="hover:bg-natural-sidebar/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-natural-primary">{p.receiptNo}</td>
                      <td className="p-4">
                        <p className="font-bold text-natural-text">{getCustomerName(p.customerId)}</p>
                        <p className="text-[10px] text-natural-muted font-mono mt-0.5">{p.customerId}</p>
                      </td>
                      <td className="p-4 text-natural-muted font-mono">{p.date}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.type === 'Booking' ? 'bg-natural-sidebar text-natural-primary border border-natural-border' :
                          p.type === 'Down Payment' ? 'bg-natural-sidebar text-natural-muted border border-natural-border' :
                          p.type === 'Installment' ? 'bg-[#5A5A40]/10 text-natural-primary border border-natural-primary/20' :
                          'bg-natural-sidebar text-natural-muted'
                        }`}>
                          {p.type === 'Booking' ? 'বুকিং' :
                           p.type === 'Down Payment' ? 'ডাউন পেমেন্ট' :
                           p.type === 'Installment' ? 'কিস্তি' : 'অন্যান্য'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-serif font-bold text-natural-text text-sm">
                        ৳ {formatCurrency(p.amount)}
                      </td>
                      <td className="p-4 text-center">
                        {custObj ? (
                          <button
                            onClick={() => onQuickPrint(custObj, 'receipt', p)}
                            className="bg-natural-sidebar hover:bg-white text-natural-muted hover:text-natural-primary p-1.5 rounded-lg border border-natural-border shadow-sm transition-all cursor-pointer"
                            title="রশিদ প্রিন্ট করুন"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-natural-muted font-medium">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-natural-muted font-medium">
                    এখনো কোনো সংগৃহীত পেমেন্ট রেকর্ড পাওয়া যায়নি। পেমেন্ট সংগ্রহ করতে "আজকের কালেকশন এন্ট্রি" এ যান।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
