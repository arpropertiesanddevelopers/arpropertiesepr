import React, { useState, useRef } from 'react';
import { Customer, Payment, Project, CompanySettings } from '../types';
import { formatCurrency, toBengaliDigits } from '../utils';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  Printer, 
  Search, 
  FileSpreadsheet, 
  ArrowLeftRight,
  SlidersHorizontal,
  Landmark
} from 'lucide-react';

interface ProjectReportsProps {
  customers: Customer[];
  payments: Payment[];
  projects: Project[];
  companySettings: CompanySettings;
  onQuickPrint: (customer: Customer, docType: 'receipt' | 'acknowledgment' | 'schedule' | 'history' | 'deed', payment: Payment | null) => void;
}

export default function ProjectReports({
  customers,
  payments,
  projects,
  companySettings,
  onQuickPrint
}: ProjectReportsProps) {
  // Combine projects list with any distinct projects found in customers
  const distinctProjectNames = Array.from(new Set(customers.map(c => c.projectName))).filter(Boolean);
  
  const allProjectOptions = [
    ...projects.map(p => ({ id: p.id, name: p.name, address: p.address })),
    ...distinctProjectNames
      .filter(name => !projects.some(p => p.name === name))
      .map((name, idx) => ({ id: `cust-proj-${idx}`, name, address: 'Registered from Customer Directory' }))
  ];

  // Selected project state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(allProjectOptions[0]?.id || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dueFilter, setDueFilter] = useState<'all' | 'has_due' | 'paid'>('all');
  
  // Printing states
  const [isPrintingReport, setIsPrintingReport] = useState(false);
  const [printOnPad, setPrintOnPad] = useState(false);
  const [padTopMargin, setPadTopMargin] = useState(2.2);

  const getSelectedProjectName = () => {
    if (selectedProjectId === 'all') return 'সকল প্রকল্প (All Projects)';
    const proj = allProjectOptions.find(p => p.id === selectedProjectId);
    return proj ? proj.name : 'প্রকল্প';
  };

  const getSelectedProjectAddress = () => {
    const proj = allProjectOptions.find(p => p.id === selectedProjectId);
    return proj ? proj.address : '';
  };

  // Filter customers based on project selection & search query
  const filteredCustomers = customers.filter(c => {
    // 1. Project filter
    if (selectedProjectId !== 'all') {
      const proj = allProjectOptions.find(p => p.id === selectedProjectId);
      if (proj && c.projectName !== proj.name) {
        return false;
      }
    }

    // 2. Search query (NID, Name, ID, Mobile, Plot)
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = c.name.toLowerCase().includes(q);
      const matchId = c.customerId.toLowerCase().includes(q);
      const matchMobile = c.mobile.includes(q);
      const matchNid = c.nid.includes(q);
      const matchPlot = (c.plotNo || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchMobile && !matchNid && !matchPlot) {
        return false;
      }
    }

    // 3. Due filter
    const custPayments = payments.filter(p => p.customerId === c.customerId);
    const totalPaid = custPayments.reduce((s, p) => {
      if (p.type === 'Withdraw' || p.type === 'PLOT Cancel') return s - p.amount;
      return s + p.amount;
    }, 0);
    const totalDue = Math.max(0, c.totalPrice - totalPaid);

    if (dueFilter === 'has_due' && totalDue <= 10) return false;
    if (dueFilter === 'paid' && totalDue > 10) return false;

    return true;
  });

  // Calculate project-wide statistics
  const projectStats = (() => {
    const matchedCustomers = customers.filter(c => {
      if (selectedProjectId === 'all') return true;
      const proj = allProjectOptions.find(p => p.id === selectedProjectId);
      return proj ? c.projectName === proj.name : false;
    });

    const totalCustomersCount = matchedCustomers.length;
    const totalSoldArea = matchedCustomers.reduce((sum, c) => sum + c.plotSize, 0);
    const totalAgreedValue = matchedCustomers.reduce((sum, c) => sum + c.totalPrice, 0);

    // Filter payments for these customers
    const matchedCustomerIds = new Set(matchedCustomers.map(c => c.customerId));
    const projectPayments = payments.filter(p => matchedCustomerIds.has(p.customerId));
    
    const totalCollectedValue = projectPayments.reduce((sum, p) => {
      if (p.type === 'Withdraw' || p.type === 'PLOT Cancel') return sum - p.amount;
      return sum + p.amount;
    }, 0);

    const totalDueValue = Math.max(0, totalAgreedValue - totalCollectedValue);

    return {
      totalCustomersCount,
      totalSoldArea,
      totalAgreedValue,
      totalCollectedValue,
      totalDueValue
    };
  })();

  // Print function
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ------------------------------------------------ */}
      {/* 1. REPORT CONTROL DASHBOARD (No-Print) */}
      {/* ------------------------------------------------ */}
      <div className="no-print bg-white p-6 rounded-3xl border border-natural-border shadow-sm space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-natural-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-natural-sidebar text-natural-primary rounded-2xl border border-natural-border">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-natural-text">প্রকল্প ভিত্তিক রিপোর্ট জেনারেটর (Project-wise Reports)</h3>
              <p className="text-xs text-natural-muted mt-0.5">প্রতিটি প্রকল্পের আলাদা আলাদা প্লট বরাদ্দ, চুক্তি মূল্য, আদায় ও বকেয়ার বিবরণী</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPrintingReport(true)}
              className="bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Printer className="w-4 h-4" />
              প্রিন্ট রিপোর্ট (Print / Extract PDF)
            </button>
          </div>
        </div>

        {/* Filters and selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
          
          {/* Project selector dropdown */}
          <div className="space-y-1.5">
            <label className="text-natural-muted font-bold">প্রকল্প নির্বাচন করুন (Select Project):</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full border border-natural-border bg-natural-sidebar/50 hover:bg-white focus:bg-white rounded-xl px-3 py-2.5 cursor-pointer text-natural-text outline-none focus:border-natural-primary transition-colors"
            >
              <option value="all">সকল প্রকল্প (All Projects)</option>
              {allProjectOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Search filter input */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-natural-muted font-bold">গ্রাহক খুঁজুন (Search Customer):</label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-natural-muted">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="নাম, মোবাইল, আইডি, এনআইডি বা প্লট নং দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-natural-border bg-natural-sidebar/50 focus:bg-white focus:border-natural-primary rounded-xl pl-9 pr-4 py-2.5 outline-none font-medium text-natural-text placeholder-natural-muted/70 transition-all"
              />
            </div>
          </div>

          {/* Due filter selector */}
          <div className="space-y-1.5">
            <label className="text-natural-muted font-bold">পরিশোধের অবস্থা (Payment Status):</label>
            <div className="flex gap-1 bg-natural-sidebar border border-natural-border p-1 rounded-xl">
              <button
                onClick={() => setDueFilter('all')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  dueFilter === 'all' 
                    ? 'bg-white text-natural-primary shadow-sm font-bold' 
                    : 'text-natural-muted hover:text-natural-text font-medium'
                }`}
              >
                সব
              </button>
              <button
                onClick={() => setDueFilter('has_due')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  dueFilter === 'has_due' 
                    ? 'bg-white text-rose-700 shadow-sm font-bold' 
                    : 'text-natural-muted hover:text-natural-text font-medium'
                }`}
              >
                বকেয়া
              </button>
              <button
                onClick={() => setDueFilter('paid')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  dueFilter === 'paid' 
                    ? 'bg-white text-emerald-800 shadow-sm font-bold' 
                    : 'text-natural-muted hover:text-natural-text font-medium'
                }`}
              >
                পরিশোধিত
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------ */}
      {/* 2. STATS KPI GRID (No-Print) */}
      {/* ------------------------------------------------ */}
      <div className="no-print grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Plot count */}
        <div className="bg-white p-5 rounded-3xl border border-natural-border shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-natural-muted uppercase">মোট বরাদ্দকৃত প্লট</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-serif font-bold text-natural-text">{projectStats.totalCustomersCount}</span>
            <span className="text-xs text-natural-muted font-semibold">টি</span>
          </div>
          <p className="text-[10px] text-natural-muted truncate">নির্বাচিত প্রকল্পে নিবন্ধিত</p>
        </div>

        {/* KPI 2: Area sold */}
        <div className="bg-white p-5 rounded-3xl border border-natural-border shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-natural-muted uppercase">বিক্রিত মোট জমির পরিমাণ</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-serif font-bold text-natural-text">{projectStats.totalSoldArea.toFixed(2)}</span>
            <span className="text-xs text-natural-muted font-semibold">ডেসিমেল</span>
          </div>
          <p className="text-[10px] text-natural-muted">মোট বরাদ্দকৃত প্লটের আকার</p>
        </div>

        {/* KPI 3: Contract Value */}
        <div className="bg-white p-5 rounded-3xl border border-natural-border shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-natural-muted uppercase">মোট চুক্তিমূল্য (Sales)</p>
          <p className="text-xl font-serif font-bold text-natural-primary">৳ {formatCurrency(projectStats.totalAgreedValue)}</p>
          <p className="text-[10px] text-natural-muted">মোট চুক্তিকৃত বেচাকেনা</p>
        </div>

        {/* KPI 4: Collected Value */}
        <div className="bg-white p-5 rounded-3xl border border-natural-border shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-natural-muted uppercase">মোট আদায়কৃত টাকা (Received)</p>
          <p className="text-xl font-serif font-bold text-[#5A5A40]">৳ {formatCurrency(projectStats.totalCollectedValue)}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-natural-muted">
            <span className="font-mono font-bold text-natural-primary">
              {projectStats.totalAgreedValue > 0 ? Math.round((projectStats.totalCollectedValue / projectStats.totalAgreedValue) * 100) : 0}%
            </span>
            <span>কালেকশন সম্পন্ন</span>
          </div>
        </div>

        {/* KPI 5: Net Outstanding Due */}
        <div className="bg-white p-5 rounded-3xl border border-natural-border shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-natural-muted uppercase">মোট বকেয়া পাওনা (Net Due)</p>
          <p className="text-xl font-serif font-bold text-rose-700">৳ {formatCurrency(projectStats.totalDueValue)}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-rose-700/80 font-semibold">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>
              {projectStats.totalAgreedValue > 0 ? Math.round((projectStats.totalDueValue / projectStats.totalAgreedValue) * 100) : 0}% বকেয়া অবশিষ্ট
            </span>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------ */}
      {/* 3. REPORT DATA TABLE DISPLAY (No-Print) */}
      {/* ------------------------------------------------ */}
      <div className="no-print bg-white rounded-3xl border border-natural-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-natural-border flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-natural-text">
              {getSelectedProjectName()} - এর বিবরণী তালিকা ({filteredCustomers.length} জন গ্রাহক)
            </h3>
            <p className="text-[11px] text-natural-muted mt-0.5">ফিল্টারিং সাপেক্ষে প্রকল্পাধীন গ্রাহকদের বিস্তারিত পেমেন্ট লেজার সামারি</p>
          </div>
          <div className="text-[11px] bg-natural-sidebar border border-natural-border px-3.5 py-1.5 rounded-xl font-semibold text-natural-muted font-mono flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-natural-primary" />
            <span>Project: {selectedProjectId === 'all' ? 'All' : getSelectedProjectName().split(' (')[0]}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-natural-sidebar text-natural-muted font-bold uppercase text-[10px] tracking-wider border-b border-natural-border">
                <th className="p-4">গ্রাহক আইডি ও নাম (Customer)</th>
                <th className="p-4">প্লট তথ্য (Plot Details)</th>
                <th className="p-4 text-right">চুক্তি মূল্য (Contract Value)</th>
                <th className="p-4 text-right">আদায়কৃত (Collected)</th>
                <th className="p-4 text-right">বকেয়া পাওনা (Remaining Net Due)</th>
                <th className="p-4 text-center">আদায় অনুপাত (Ratio)</th>
                <th className="p-4 text-center">অ্যাকশন (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-sidebar">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(c => {
                  const custPayments = payments.filter(p => p.customerId === c.customerId);
                  const totalPaid = custPayments.reduce((s, p) => {
                    if (p.type === 'Withdraw' || p.type === 'PLOT Cancel') return s - p.amount;
                    return s + p.amount;
                  }, 0);
                  const totalDue = Math.max(0, c.totalPrice - totalPaid);
                  const ratio = c.totalPrice > 0 ? Math.round((totalPaid / c.totalPrice) * 100) : 0;

                  return (
                    <tr key={c.id} className="hover:bg-natural-sidebar/30 transition-colors">
                      {/* Customer info */}
                      <td className="p-4">
                        <p className="font-bold text-natural-text">{c.name.split(' (')[0]}</p>
                        <p className="text-[10px] text-natural-muted font-mono font-bold mt-0.5">{c.customerId}</p>
                      </td>

                      {/* Plot info */}
                      <td className="p-4">
                        <p className="font-semibold text-natural-text text-[11px]">প্লট নং: {c.plotNo || 'N/A'}</p>
                        <p className="text-[10px] text-natural-muted mt-0.5">{c.plotSize.toFixed(2)} ডেসিমেল</p>
                      </td>

                      {/* Total price */}
                      <td className="p-4 text-right font-serif font-bold text-natural-text">
                        ৳ {formatCurrency(c.totalPrice)}
                      </td>

                      {/* Collected price */}
                      <td className="p-4 text-right font-serif font-bold text-emerald-800">
                        ৳ {formatCurrency(totalPaid)}
                      </td>

                      {/* Remaining due */}
                      <td className="p-4 text-right font-serif font-extrabold text-rose-700">
                        ৳ {formatCurrency(totalDue)}
                      </td>

                      {/* Payment ratio bar */}
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1 min-w-[80px]">
                          <span className="text-[10px] font-bold text-natural-text font-mono">{ratio}%</span>
                          <div className="w-16 bg-natural-sidebar h-1.5 rounded-full overflow-hidden border border-natural-border/60">
                            <div 
                              className={`h-full rounded-full ${
                                ratio >= 100 ? 'bg-emerald-600' :
                                ratio >= 60 ? 'bg-[#5A5A40]' :
                                ratio >= 30 ? 'bg-[#5A5A40]/70' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, ratio)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Quick action buttons */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onQuickPrint(c, 'acknowledgment', null)}
                            className="bg-natural-sidebar hover:bg-white text-natural-muted hover:text-natural-primary px-2.5 py-1.5 rounded-lg border border-natural-border shadow-sm font-semibold text-[10px] transition-all cursor-pointer"
                            title="অঙ্গীকারনামা প্রিন্ট করুন"
                          >
                            অঙ্গীকারনামা
                          </button>
                          <button
                            onClick={() => onQuickPrint(c, 'history', null)}
                            className="bg-natural-sidebar hover:bg-white text-natural-muted hover:text-natural-primary px-2.5 py-1.5 rounded-lg border border-natural-border shadow-sm font-semibold text-[10px] transition-all cursor-pointer"
                            title="গ্রাহক লেজার প্রিন্ট করুন"
                          >
                            লেজার
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-natural-muted font-semibold">
                    কোনো গ্রাহক বিবরণী পাওয়া যায়নি! অনুগ্রহ করে অন্য প্রকল্প বেছে নিন অথবা সার্চ করুন।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------ */}
      {/* 4. MODAL DETACHED PRINT VIEW FOR PROJECT REPORT */}
      {/* ------------------------------------------------ */}
      {isPrintingReport && (
        <div className="fixed inset-0 bg-natural-text/50 backdrop-blur-sm z-50 overflow-y-auto no-print flex justify-center py-6 px-4">
          
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden border border-natural-border">
            
            {/* Modal Controls */}
            <div className="bg-natural-sidebar border-b border-natural-border px-6 py-4 flex items-center justify-between no-print">
              <div>
                <h3 className="text-base font-serif font-bold text-natural-text flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-natural-primary"></span>
                  প্রকল্প রিপোর্ট প্রিন্ট প্রিভিউ (Project Report Print Preview)
                </h3>
                <p className="text-xs text-natural-muted mt-0.5">
                  নিচের প্রতিবেদনটি প্রিন্ট করার পূর্বে পেজ মার্জিন ও প্যাড অপশনগুলি পছন্দমত সাজিয়ে নিন।
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintReport}
                  className="bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  প্রিন্ট করুন (Print Report)
                </button>
                <button
                  onClick={() => setIsPrintingReport(false)}
                  className="text-natural-muted hover:text-natural-text bg-white border border-natural-border px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  বন্ধ করুন (Close)
                </button>
              </div>
            </div>

            {/* Print Customizer Options */}
            <div className="bg-natural-sidebar/50 border-b border-natural-border/60 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs no-print">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 font-bold text-natural-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOnPad}
                    onChange={(e) => setPrintOnPad(e.target.checked)}
                    className="rounded text-natural-primary focus:ring-natural-primary w-4 h-4 cursor-pointer"
                  />
                  অফিসিয়াল লেটারহেড প্যাডে প্রিন্ট করুন (Print on Official Pad)
                </label>
              </div>
              
              {printOnPad && (
                <div className="flex items-center gap-1.5">
                  <span className="text-natural-muted font-bold">উপরের ফাঁকা (Header Space):</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="5.0"
                    value={padTopMargin}
                    onChange={(e) => setPadTopMargin(parseFloat(e.target.value) || 0)}
                    className="w-14 text-center border border-natural-border bg-white rounded px-1.5 py-0.5 font-bold font-mono text-natural-primary"
                  />
                  <span className="text-natural-muted font-mono">in</span>
                </div>
              )}
            </div>

            {/* Document body for print & preview */}
            <div className="p-8 flex-1 overflow-y-auto bg-natural-sidebar/20 flex justify-center">
              
              <div 
                className={`bg-white shadow-lg border border-natural-border relative text-natural-text A4-sheet font-sans ${printOnPad ? 'p-0 shadow-none border-none' : 'p-12'}`}
                style={{
                  width: '21cm',
                  minHeight: '29.7cm',
                  boxSizing: 'border-box' as const,
                }}
              >
                
                {/* Print spacing wrapper */}
                <div
                  style={printOnPad ? {
                    paddingLeft: '0.6in',
                    paddingRight: '0.6in',
                    paddingTop: `${padTopMargin}in`,
                    paddingBottom: '1.2in',
                    boxSizing: 'border-box',
                    width: '100%'
                  } : {}}
                >
                  
                  {/* Company Header (Only if NOT preprinted pad) */}
                  {!printOnPad && (
                    <div className="border-b-2 border-natural-primary pb-5 mb-6 flex justify-between items-start">
                      <div>
                        <h1 className="text-xl font-serif font-bold text-natural-primary tracking-tight leading-tight">
                          {companySettings.name.split(' (')[0]}
                        </h1>
                        <h2 className="text-[10px] font-semibold text-natural-muted tracking-widest mt-0.5 uppercase">
                          {companySettings.name.includes('(') ? companySettings.name.split(' (')[1].replace(')', '') : 'AR Properties & Developers'}
                        </h2>
                        <p className="text-[9px] text-natural-muted mt-1 italic">{companySettings.slogan}</p>
                      </div>
                      <div className="text-right text-[10px] text-natural-muted leading-relaxed max-w-[280px]">
                        <p className="font-bold text-natural-text">প্রধান কার্যালয় / Head Office:</p>
                        <p className="mt-0.5">{companySettings.address}</p>
                        <p className="mt-0.5">মোবাইল: {companySettings.phone}</p>
                        <p className="mt-0.5">ইমেইল: {companySettings.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Report Main Header */}
                  <div className="text-center pb-4 border-b border-natural-border/60 mb-6">
                    <span className="text-xs font-serif font-bold tracking-widest text-natural-primary bg-natural-sidebar px-6 py-1.5 rounded-xl border border-natural-border shadow-sm uppercase">
                      প্রকল্পভিত্তিক সারসংক্ষেপ প্রতিবেদন (PROJECT SUMMARY REPORT)
                    </span>
                    <h2 className="text-lg font-serif font-extrabold text-natural-text mt-3">
                      {getSelectedProjectName()}
                    </h2>
                    {getSelectedProjectAddress() && (
                      <p className="text-[11px] text-natural-muted mt-0.5">প্রকল্পের অবস্থান: {getSelectedProjectAddress()}</p>
                    )}
                    <p className="text-[10px] text-natural-muted font-mono mt-1">তারিখ (Date): {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6 text-xs bg-natural-sidebar/30 p-4 rounded-2xl border border-natural-border/60">
                    <div>
                      <p className="text-natural-muted font-bold">মোট বরাদ্দকৃত প্লট</p>
                      <p className="text-base font-serif font-extrabold text-natural-text mt-1">{projectStats.totalCustomersCount} টি</p>
                    </div>
                    <div>
                      <p className="text-natural-muted font-bold">বিক্রিত জমির পরিমাণ</p>
                      <p className="text-base font-serif font-extrabold text-natural-text mt-1">{projectStats.totalSoldArea.toFixed(2)} ডেসিমেল</p>
                    </div>
                    <div>
                      <p className="text-natural-muted font-bold">মোট চুক্তিমূল্য (Sales)</p>
                      <p className="text-base font-serif font-extrabold text-natural-primary mt-1">৳ {formatCurrency(projectStats.totalAgreedValue)} Tk.</p>
                    </div>
                    <div className="border-t border-natural-border/40 col-span-3 my-1"></div>
                    <div>
                      <p className="text-natural-muted font-bold">মোট আদায়কৃত টাকা (Paid)</p>
                      <p className="text-base font-serif font-extrabold text-emerald-800 mt-1">৳ {formatCurrency(projectStats.totalCollectedValue)} Tk.</p>
                    </div>
                    <div>
                      <p className="text-natural-muted font-bold">মোট বকেয়া পাওনা (Due)</p>
                      <p className="text-base font-serif font-extrabold text-rose-700 mt-1">৳ {formatCurrency(projectStats.totalDueValue)} Tk.</p>
                    </div>
                    <div>
                      <p className="text-natural-muted font-bold">আদায়কৃত অনুপাত (Ratio)</p>
                      <p className="text-base font-serif font-extrabold text-natural-text mt-1">
                        {projectStats.totalAgreedValue > 0 ? Math.round((projectStats.totalCollectedValue / projectStats.totalAgreedValue) * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Customer Records Table */}
                  <div className="space-y-2">
                    <p className="text-xs font-serif font-bold text-natural-primary border-b border-natural-border/60 pb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-natural-primary rounded-full"></span>
                      গ্রাহকদের বিস্তারিত বিবরণী (Customer Records):
                    </p>
                    <table className="w-full text-left border-collapse text-[10px] border border-natural-border">
                      <thead>
                        <tr className="bg-natural-sidebar text-natural-muted font-bold uppercase border-b border-natural-border">
                          <th className="p-2 border-r border-natural-border">আইডি (ID)</th>
                          <th className="p-2 border-r border-natural-border">গ্রাহকের নাম (Customer)</th>
                          <th className="p-2 border-r border-natural-border">প্লট নং (Plot)</th>
                          <th className="p-2 border-r border-natural-border">আকার (Size)</th>
                          <th className="p-2 text-right border-r border-natural-border">চুক্তি মূল্য (Contract Price)</th>
                          <th className="p-2 text-right border-r border-natural-border">আদায়কৃত (Paid)</th>
                          <th className="p-2 text-right border-r border-natural-border">বকেয়া পাওনা (Remaining Due)</th>
                          <th className="p-2 text-center">অনুপাত</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-natural-border">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(c => {
                            const custPayments = payments.filter(p => p.customerId === c.customerId);
                            const totalPaid = custPayments.reduce((s, p) => {
                              if (p.type === 'Withdraw' || p.type === 'PLOT Cancel') return s - p.amount;
                              return s + p.amount;
                            }, 0);
                            const totalDue = Math.max(0, c.totalPrice - totalPaid);
                            const ratio = c.totalPrice > 0 ? Math.round((totalPaid / c.totalPrice) * 100) : 0;

                            return (
                              <tr key={c.id} className="hover:bg-natural-sidebar/20 transition-colors">
                                <td className="p-2 font-mono font-bold border-r border-natural-border">{c.customerId}</td>
                                <td className="p-2 font-bold border-r border-natural-border">{c.name.split(' (')[0]}</td>
                                <td className="p-2 text-center border-r border-natural-border">{c.plotNo || 'N/A'}</td>
                                <td className="p-2 text-center border-r border-natural-border">{c.plotSize.toFixed(2)} ডেসিমেল</td>
                                <td className="p-2 text-right font-serif font-bold border-r border-natural-border">৳ {formatCurrency(c.totalPrice)}</td>
                                <td className="p-2 text-right font-serif font-bold border-r border-natural-border text-emerald-800">৳ {formatCurrency(totalPaid)}</td>
                                <td className="p-2 text-right font-serif font-extrabold border-r border-natural-border text-rose-700">৳ {formatCurrency(totalDue)}</td>
                                <td className="p-2 text-center font-bold font-mono">{ratio}%</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="p-6 text-center text-natural-muted font-bold">কোনো বিবরণী পাওয়া যায়নি!</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Footnote */}
                  <div className="bg-natural-sidebar/10 p-4 rounded-xl border border-dashed border-natural-border/80 mt-8 text-center text-[10px] text-natural-muted">
                    <p>এই প্রতিবেদনটি এ.আর. প্রোপার্টিজ অ্যান্ড ডেভেলপারস-এর অভ্যন্তরীণ সিস্টেম থেকে স্বয়ংক্রিয়ভাবে জেনারেট করা হয়েছে।</p>
                  </div>

                  {/* Signatures Slot */}
                  <div className="mt-20 grid grid-cols-2 gap-12 text-center text-[10px] font-semibold text-natural-text">
                    <div className="space-y-1">
                      <div className="border-t border-natural-border/60 pt-2 w-32 mx-auto"></div>
                      <p>প্রস্তুতকারী কর্মকর্তা (Prepared By)</p>
                    </div>
                    <div className="space-y-1">
                      <div className="border-t border-natural-border/60 pt-2 w-32 mx-auto"></div>
                      <p>অনুমোদনকারী (Managing Director)</p>
                      <p className="text-[9px] text-natural-primary font-bold">A.R. Properties & Developers</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* 5. PRINT CSS STYLES SPECIFIC TO WINDOW.PRINT */}
      {/* ------------------------------------------------ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide standard container background elements */
          body, .min-h-screen, main, html {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide non-printable app UI elements */
          .no-print {
            display: none !important;
          }
          /* Show print-only sheet with A4 scaling and full-screen boundaries */
          .A4-sheet {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0.5in !important;
            display: block !important;
          }
        }
      `}} />

    </div>
  );
}
