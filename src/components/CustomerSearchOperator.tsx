import React, { useState, useEffect } from 'react';
import { Customer, Payment, PaymentType, PaymentMethod } from '../types';
import { formatCurrency, generateReceiptNo } from '../utils';
import { Search, UserCheck, CreditCard, Receipt, FileText, Calendar, History, Save, AlertCircle, RefreshCw, Award } from 'lucide-react';

interface CustomerSearchOperatorProps {
  customers: Customer[];
  payments: Payment[];
  onAddPayment: (payment: Payment) => void;
  onQuickPrint: (customer: Customer, docType: 'receipt' | 'acknowledgment' | 'schedule' | 'history' | 'deed', payment: Payment | null) => void;
  onEditCustomer: (customer: Customer) => void;
}

export default function CustomerSearchOperator({
  customers,
  payments,
  onAddPayment,
  onQuickPrint,
  onEditCustomer
}: CustomerSearchOperatorProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Form states for Today's Payment
  const [todaysAmount, setTodaysAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<PaymentType>('Installment');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [remarks, setRemarks] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Deed entry states
  const [deedNo, setDeedNo] = useState('');
  const [deedDate, setDeedDate] = useState('');
  const [registrationNote, setRegistrationNote] = useState('');

  // Sync deed input fields on customer change
  useEffect(() => {
    if (activeCustomer) {
      setDeedNo(activeCustomer.deedNo || '');
      setDeedDate(activeCustomer.deedDate || '');
      setRegistrationNote(activeCustomer.registrationNote || '');
    } else {
      setDeedNo('');
      setDeedDate('');
      setRegistrationNote('');
    }
  }, [activeCustomer]);

  const handleSaveDeedInfo = () => {
    if (!activeCustomer) return;
    if (!deedNo.trim()) {
      alert('অনুগ্রহ করে দলিল নম্বর লিখুন!');
      return;
    }
    const updated: Customer = {
      ...activeCustomer,
      deedNo: deedNo.trim(),
      deedDate: deedDate ? deedDate : undefined,
      registrationNote: registrationNote.trim() ? registrationNote.trim() : undefined
    };
    onEditCustomer(updated);
    setActiveCustomer(updated);
    alert('দলিল বিবরণী সফলভাবে সংরক্ষণ ও আপডেট করা হয়েছে!');
  };

  // Auto-calculated variables based on search & input
  const [bookingPayment, setBookingPayment] = useState(0);
  const [previousPayment, setPreviousPayment] = useState(0);

  // Initialize receipt number
  useEffect(() => {
    setReceiptNo(generateReceiptNo());
  }, []);

  // Recalculate payments when active customer changes or payments list changes
  useEffect(() => {
    if (activeCustomer) {
      const custPayments = payments.filter(p => p.customerId === activeCustomer.customerId);
      
      const booking = custPayments
        .filter(p => p.type === 'Booking')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const previous = custPayments
        .filter(p => p.type !== 'Booking')
        .reduce((sum, p) => {
          if (p.type === 'Withdraw' || p.type === 'PLOT Cancel') {
            return sum - p.amount;
          }
          return sum + p.amount;
        }, 0);

      setBookingPayment(booking);
      setPreviousPayment(previous);
    } else {
      setBookingPayment(0);
      setPreviousPayment(0);
    }
  }, [activeCustomer, payments]);

  // Handle Search
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSuccessMsg('');
    if (!searchQuery.trim()) return;

    const trimmedQuery = searchQuery.trim().toLowerCase();
    
    // Find customer by ID or Mobile
    const found = customers.find(
      c => c.customerId.toLowerCase() === trimmedQuery || 
           c.mobile === trimmedQuery || 
           c.mobile.replace(/[-+ \s]/g, '').includes(trimmedQuery)
    );

    if (found) {
      setActiveCustomer(found);
      setNotFound(false);
      // Reset form fields
      setTodaysAmount(0);
      setPaymentType('Installment');
      setPaymentMethod('Cash');
      setRemarks('');
      setReceiptNo(generateReceiptNo());
    } else {
      setActiveCustomer(null);
      setNotFound(true);
    }
  };

  // Live Auto-Calculations
  const todaysEffect = (paymentType === 'Withdraw' || paymentType === 'PLOT Cancel')
    ? -(Number(todaysAmount) || 0)
    : (Number(todaysAmount) || 0);
  const totalPaid = bookingPayment + previousPayment + todaysEffect;
  const totalDue = Math.max(0, (activeCustomer?.totalPrice || 0) - totalPaid);

  // Handle Saving Payment
  const handleSavePayment = () => {
    if (!activeCustomer) return;
    if (!todaysAmount || todaysAmount <= 0) {
      alert('অনুগ্রহ করে সঠিক আজকের পেমেন্ট পরিমাণ লিখুন!');
      return;
    }

    const newPayment: Payment = {
      id: 'p-' + Date.now(),
      customerId: activeCustomer.customerId,
      amount: Number(todaysAmount),
      date: new Date().toISOString().split('T')[0],
      type: paymentType,
      receiptNo: receiptNo || generateReceiptNo(),
      paymentMethod: paymentMethod,
      remarks: remarks.trim() || undefined
    };

    onAddPayment(newPayment);
    setSuccessMsg('পেমেন্ট সফলভাবে সংরক্ষণ করা হয়েছে!');
    
    // Print acknowledgment letter for this specific newly saved payment
    onQuickPrint(activeCustomer, 'acknowledgment', newPayment);

    // Reset today's inputs
    setTodaysAmount(0);
    setRemarks('');
    setReceiptNo(generateReceiptNo());
  };

  return (
    <div className="space-y-6">
      
      {/* Header and explanation */}
      <div>
        <h2 className="text-xl font-serif font-bold text-natural-text">অপারেটর কালেকশন প্যানেল (Operator Collection Screen)</h2>
        <p className="text-xs text-natural-muted mt-1">
          গ্রাহকের আইডি বা মোবাইল নম্বর দিয়ে সার্চ করুন। পেমেন্ট পরিমাণ টাইপ করার সাথে সাথে মোট পরিশোধ এবং মোট বকেয়া স্বয়ংক্রিয়ভাবে হিসেব হবে।
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white p-5 rounded-3xl border border-natural-border shadow-sm flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-natural-muted" />
          <input
            type="text"
            placeholder="গ্রাহক আইডি (যেমন: AR-101) অথবা মোবাইল নাম্বার লিখুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-natural-sidebar border border-natural-border focus:border-natural-primary focus:bg-white rounded-xl text-xs font-medium text-natural-text outline-none transition-all placeholder:text-natural-muted"
          />
        </div>
        <button
          type="submit"
          className="bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          অনুসন্ধান করুন (Search)
        </button>
        {activeCustomer && (
          <button
            type="button"
            onClick={() => {
              setActiveCustomer(null);
              setSearchQuery('');
              setNotFound(false);
            }}
            className="bg-natural-sidebar hover:bg-[#EBE7E0]/60 text-natural-text font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer"
          >
            ক্লিয়ার (Clear)
          </button>
        )}
      </form>

      {/* Not Found Screen */}
      {notFound && (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-rose-800 font-serif">কোনো গ্রাহক খুঁজে পাওয়া যায়নি!</h3>
          <p className="text-xs text-rose-600 leading-normal">
            আপনার প্রবেশ করানো কাস্টমার আইডি অথবা মোবাইল নম্বরটি সঠিক নয়। অনুগ্রহ করে পুনরায় সঠিক তথ্য দিয়ে চেষ্টা করুন।
          </p>
        </div>
      )}

      {/* Customer Found State */}
      {activeCustomer ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Customer Details Display Card */}
          <div className="bg-white p-6 rounded-3xl border border-natural-border shadow-sm space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-natural-border pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-natural-sidebar text-natural-primary p-2 rounded-lg border border-natural-border">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-natural-text">গ্রাহকের প্রোফাইল ও প্লট তথ্য</h3>
                  <p className="text-[10px] font-mono text-natural-muted">Customer ID: {activeCustomer.customerId}</p>
                </div>
              </div>
              <span className="bg-natural-sidebar text-natural-primary text-xs font-bold font-mono px-3 py-1 rounded-full border border-natural-border">
                {activeCustomer.customerId}
              </span>
            </div>

            {/* Field Display Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              
              <div className="space-y-1">
                <p className="text-natural-muted font-semibold">গ্রাহকের নাম / Customer Name</p>
                <p className="font-bold text-natural-text text-sm">{activeCustomer.name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-natural-muted font-semibold">মোবাইল নম্বর / Mobile Number</p>
                <p className="font-bold text-natural-text text-sm font-mono">{activeCustomer.mobile}</p>
              </div>

              <div className="space-y-1">
                <p className="text-natural-muted font-semibold">জাতীয় পরিচয়পত্র / NID Number</p>
                <p className="font-bold text-natural-text font-mono text-sm">{activeCustomer.nid}</p>
              </div>

              <div className="space-y-1">
                <p className="text-natural-muted font-semibold">প্রকল্পের নাম / Project Name</p>
                <p className="font-bold text-natural-text text-sm">{activeCustomer.projectName.split(' (')[0]}</p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <p className="text-natural-muted font-semibold">প্রকল্পের ঠিকানা / Project Address</p>
                <p className="font-bold text-natural-text">{activeCustomer.projectAddress.split(' (')[0]}</p>
              </div>

              <div className="space-y-1">
                <p className="text-natural-muted font-semibold">প্লট নম্বর / Plot Number</p>
                <p className="font-bold text-natural-text text-sm">{activeCustomer.plotNo}</p>
              </div>

              <div className="space-y-1">
                <p className="text-natural-muted font-semibold">প্লটের আকার / Plot Size</p>
                <p className="font-bold text-natural-text text-sm">
                  {activeCustomer.plotSize} শতাংশ (Decimal)
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-natural-muted font-semibold">প্রতি শতাংশ মূল্য / Price Per Decimal</p>
                <p className="font-bold text-natural-text text-sm font-serif">৳ {formatCurrency(activeCustomer.pricePerDecimal)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-natural-muted font-semibold">মোট মূল্য / Total Price</p>
                <p className="font-extrabold text-natural-primary text-sm font-serif">৳ {formatCurrency(activeCustomer.totalPrice)}</p>
              </div>

            </div>

            {/* Deed Registration Section for Completed Payments */}
            {bookingPayment + previousPayment >= activeCustomer.totalPrice && activeCustomer.totalPrice > 0 ? (
              <div className="border-t border-natural-border pt-6 mt-6 space-y-4">
                <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-2">
                    <Award className="w-5.5 h-5.5 text-emerald-600 animate-bounce" />
                    <span>🎉 সম্পূর্ণ পেমেন্ট সম্পন্ন! কবালা দলিল রেজিস্ট্রি তথ্য প্রদান করুন</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-normal mb-4 font-medium">
                    এই গ্রাহকের মোট বকেয়া সম্পূর্ণ পরিশোধিত (৳ ০.০০)। দয়া করে নিচের দলিল নম্বর ও তারিখ সাবমিট করে অটোমেটিক "দলিল কপি প্রিন্ট" অপশনটি চালু করুন।
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-emerald-950 font-bold block">দলিল নম্বর (Deed No) *</label>
                      <input
                        type="text"
                        placeholder="যেমন: ৪৫১২"
                        value={deedNo}
                        onChange={(e) => setDeedNo(e.target.value)}
                        className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 font-bold text-emerald-900 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-emerald-950 font-bold block">দলিল তারিখ (Deed Date)</label>
                      <input
                        type="date"
                        value={deedDate}
                        onChange={(e) => setDeedDate(e.target.value)}
                        className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 font-bold text-emerald-900 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] text-emerald-950 font-bold block">হ্যান্ডওভার রেজিস্ট্রি নোট (Registration Note)</label>
                      <textarea
                        rows={2}
                        placeholder="হস্তান্তর বা জমির বিবরণ সম্পর্কিত মন্তব্য লিখুন..."
                        value={registrationNote}
                        onChange={(e) => setRegistrationNote(e.target.value)}
                        className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-emerald-900 shadow-sm"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveDeedInfo}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    দলিল বিবরণী সংরক্ষণ ও আপডেট করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-natural-border pt-4 mt-4">
                <p className="text-[11px] text-natural-muted italic">
                  * গ্রাহকের মোট বকেয়া সম্পূর্ণ পরিশোধিত (৳ ০.০০) হলে এখানে স্বয়ংক্রিয়ভাবে দলিল নম্বর এন্ট্রি এবং কবালা দলিল প্রিন্ট করার অপশন চলে আসবে।
                </p>
              </div>
            )}

            {/* Document Generation / Print Options */}
            <div className="border-t border-natural-border pt-6">
              <h4 className="text-xs font-bold text-natural-text mb-4">অফিসিয়াল প্যাড প্রিন্ট এবং পিডিএফ ডাউনলোড অপশন:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => onQuickPrint(activeCustomer, 'acknowledgment', null)}
                  className="bg-natural-sidebar hover:bg-white text-natural-text hover:text-natural-primary border border-natural-border px-4 py-4 rounded-2xl font-bold text-xs text-center flex flex-col items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <FileText className="w-5 h-5 text-natural-primary" />
                  অঙ্গীকারনামা প্রিন্ট (Acknowledgment Letter)
                </button>
                <button
                  onClick={() => onQuickPrint(activeCustomer, 'history', null)}
                  className="bg-natural-sidebar hover:bg-white text-natural-text hover:text-natural-primary border border-natural-border px-4 py-4 rounded-2xl font-bold text-xs text-center flex flex-col items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <History className="w-5 h-5 text-natural-primary" />
                  পেমেন্ট লেজার প্রিন্ট (Payment Ledger)
                </button>
                {activeCustomer.deedNo && (
                  <button
                    onClick={() => onQuickPrint(activeCustomer, 'deed', null)}
                    className="bg-emerald-50 hover:bg-white text-emerald-800 hover:text-emerald-950 border border-emerald-200 px-4 py-4 rounded-2xl font-bold text-xs text-center flex flex-col items-center gap-2 transition-all cursor-pointer shadow-sm sm:col-span-2 mt-1"
                  >
                    <Award className="w-5 h-5 text-emerald-600 animate-pulse" />
                    দলিল বিবরণী প্রিন্ট (Deed Copy Print - নং: {activeCustomer.deedNo})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Today's Payment Processing Panel */}
          <div className="bg-natural-primary text-white p-6 rounded-3xl shadow-md border border-natural-border/10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <CreditCard className="w-5 h-5 text-[#E5E1DA]" />
                <h3 className="text-sm font-bold tracking-wide text-white uppercase font-serif">কালেকশন প্রসেস মডিউল</h3>
              </div>

              {/* Automatic Ledger Details Summary */}
              <div className="space-y-2.5 bg-white/10 p-4 rounded-2xl border border-white/10 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/70">বুকিং পেমেন্ট (Booking):</span>
                  <span className="font-serif font-bold">৳ {formatCurrency(bookingPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">পূর্ববর্তী মোট কিস্তি (Previous):</span>
                  <span className="font-serif font-bold">৳ {formatCurrency(previousPayment)}</span>
                </div>
                <div className="flex justify-between text-white font-bold border-t border-white/10 pt-2">
                  <span>মোট জমাকৃত (Total Paid):</span>
                  <span className="font-serif text-sm">৳ {formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between text-[#E5E1DA] font-bold">
                  <span>মোট বকেয়া (Total Due):</span>
                  <span className="font-serif text-sm">৳ {formatCurrency(totalDue)}</span>
                </div>
              </div>

              {/* Input for Today's Payment */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#E5E1DA] font-semibold block">আজকের পেমেন্ট পরিমাণ / Today's Payment (Tk)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">৳</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={todaysAmount || ''}
                      onChange={(e) => setTodaysAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-white/25 border-2 border-white/20 focus:border-white rounded-xl pl-9 pr-4 py-3 text-base font-bold font-serif text-white outline-none transition-all placeholder:text-white/40"
                    />
                  </div>
                </div>

                {/* Receipt Details hidden defaults but editable */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/80 font-semibold block">পেমেন্ট ধরণ (Type)</label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                      className="w-full bg-natural-primary-hover border border-white/20 rounded-lg px-2 py-2 text-white outline-none focus:border-white"
                    >
                      <option value="Installment" className="bg-natural-primary text-white">কিস্তি (Installment)</option>
                      <option value="Re-Payment" className="bg-natural-primary text-white">রি-পেমেন্ট (Re-Payment)</option>
                      <option value="Withdraw" className="bg-natural-primary text-white">উইথড্র (Withdraw)</option>
                      <option value="PLOT Cancel" className="bg-natural-primary text-white">প্লট বাতিল (PLOT Cancel)</option>
                      <option value="Down Payment" className="bg-natural-primary text-white">ডাউন পেমেন্ট</option>
                      <option value="Others" className="bg-natural-primary text-white">অন্যান্য (Others)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/80 font-semibold block">পেমেন্ট মাধ্যম (Method)</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-natural-primary-hover border border-white/20 rounded-lg px-2 py-2 text-white outline-none focus:border-white"
                    >
                      <option value="Cash" className="bg-natural-primary text-white">নগদ (Cash)</option>
                      <option value="Bank" className="bg-natural-primary text-white">ব্যাংক ডিপোজিট</option>
                      <option value="Cheque" className="bg-natural-primary text-white">চেক (Cheque)</option>
                      <option value="Mobile Banking" className="bg-natural-primary text-white">মোবাইল ব্যাংকিং</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/80 font-semibold block">রশিদ নম্বর (Receipt No)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                      className="flex-1 bg-white/15 border border-white/10 rounded-lg px-3 py-2 text-white font-mono font-bold text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setReceiptNo(generateReceiptNo())}
                      className="p-2 bg-white/10 hover:bg-white/25 text-white rounded-lg border border-white/15"
                      title="নতুন রশিদ নম্বর জেনারেট করুন"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/80 font-semibold block">মন্তব্য / Remarks</label>
                  <input
                    type="text"
                    placeholder="যেমন: ৩য় কিস্তি পরিশোধ..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-white/15 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>

            {/* Success Alert */}
            {successMsg && (
              <div className="bg-white/20 border border-white/30 text-[#E5E1DA] text-xs px-3 py-2 rounded-lg text-center font-semibold">
                {successMsg}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSavePayment}
              disabled={todaysAmount <= 0}
              className={`w-full font-bold text-xs py-3 rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer ${
                todaysAmount > 0 
                  ? 'bg-white hover:bg-[#EBE7E0] text-natural-primary hover:scale-[1.01]' 
                  : 'bg-white/10 text-white/40 border border-white/10 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              পেমেন্ট সংরক্ষণ ও রশিদ জেনারেট
            </button>
          </div>

        </div>
      ) : (
        /* Prompt to search */
        <div className="bg-white border border-natural-border rounded-3xl p-16 text-center shadow-sm space-y-4">
          <Search className="w-12 h-12 text-natural-muted/60 mx-auto" />
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-bold text-natural-text font-serif">আজকের পেমেন্ট গ্রহণ করুন</h3>
            <p className="text-xs text-natural-muted leading-relaxed">
              পেমেন্ট প্রসেস করার জন্য উপরে গ্রাহকের কাস্টমার আইডি (যেমন: <span className="font-mono font-bold bg-natural-sidebar border border-natural-border px-1.5 py-0.5 rounded text-natural-primary">AR-101</span>) অথবা মোবাইল নাম্বার লিখে "অনুসন্ধান করুন" বাটনে ক্লিক করুন।
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
