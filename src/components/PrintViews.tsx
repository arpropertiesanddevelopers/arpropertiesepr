import React, { useState } from 'react';
import { Customer, Payment, CompanySettings } from '../types';
import { formatCurrency, toBengaliDigits, numberToBengaliWords, numberToEnglishWords } from '../utils';
import { Printer, X } from 'lucide-react';

interface PrintViewsProps {
  customer: Customer;
  payments: Payment[];
  companySettings: CompanySettings;
  activePrintDoc: 'receipt' | 'acknowledgment' | 'schedule' | 'history' | 'deed' | null;
  selectedPayment: Payment | null; // For printing a specific payment receipt
  onClose: () => void;
}

export default function PrintViews({
  customer,
  payments,
  companySettings,
  activePrintDoc,
  selectedPayment,
  onClose
}: PrintViewsProps) {
  if (!activePrintDoc) return null;

  // Print on official pre-printed Pad states
  const [usePrePrintedPad, setUsePrePrintedPad] = useState(activePrintDoc === 'acknowledgment');
  const [padTopMargin, setPadTopMargin] = useState(2.2); // Default to 2.2 inches (space for pre-printed letterhead)
  const [padBottomMargin, setPadBottomMargin] = useState(1.5); // Default to 1.5 inches (space for pre-printed footer)
  const [padWidth, setPadWidth] = useState(7.5); // Default to 7.5 inches width as requested
  const [docLanguage, setDocLanguage] = useState<'bilingual' | 'bn' | 'en'>('bilingual');

  // Sorting payments chronologically for ledger/history
  const sortedPayments = [...payments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculations
  const totalPlotPrice = customer.totalPrice;
  const bookingPayment = payments
    .filter(p => p.type === 'Booking')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalPaid = payments.reduce((sum, p) => {
    if (p.type === 'Withdraw' || p.type === 'PLOT Cancel') {
      return sum - p.amount;
    }
    return sum + p.amount;
  }, 0);
  const totalDue = Math.max(0, totalPlotPrice - totalPaid);

  const getLocalizedValue = (val: string | undefined | null, targetLang?: 'bilingual' | 'bn' | 'en'): string => {
    if (!val) return '';
    const lang = targetLang || docLanguage;
    const trimmed = val.trim();
    if (lang === 'bilingual') return trimmed;

    // Standard pattern: "Bangla Value (English Value)"
    // Let's find first '(' and matching ')'
    const openParenIdx = trimmed.indexOf('(');
    const closeParenIdx = trimmed.indexOf(')');
    
    if (openParenIdx !== -1 && closeParenIdx > openParenIdx) {
      const bnPart = trimmed.substring(0, openParenIdx).trim();
      const enPart = trimmed.substring(openParenIdx + 1, closeParenIdx).trim();
      if (lang === 'bn') return bnPart || trimmed;
      if (lang === 'en') return enPart || trimmed;
    }

    // Standard pattern: "Bangla Value / English Value"
    const slashIdx = trimmed.indexOf('/');
    if (slashIdx !== -1) {
      const bnPart = trimmed.substring(0, slashIdx).trim();
      const enPart = trimmed.substring(slashIdx + 1).trim();
      if (lang === 'bn') return bnPart || trimmed;
      if (lang === 'en') return enPart || trimmed;
    }

    return trimmed;
  };

  const handlePrint = () => {
    window.print();
  };

  const getDocTitle = () => {
    switch (activePrintDoc) {
      case 'receipt': return 'মানি রিসিট / Money Receipt';
      case 'acknowledgment': return 'Acknowledgment Letter for Final Price & Payment Schedule';
      case 'schedule': return 'পরিশোধের সময়সূচী / Payment Schedule';
      case 'history': return 'পেমেন্ট খতিয়ান / Payment Ledger';
      case 'deed': return 'রেজিস্ট্রি দলিল বিবরণী / Registry Deed Statement';
      default: return 'ডকুমেন্ট প্রিন্ট';
    }
  };

  const sideMargin = (8.5 - padWidth) / 2;

  const sheetStyle = usePrePrintedPad ? {
    width: '8.5in',
    minHeight: '11in',
    boxSizing: 'border-box' as const,
  } : {
    width: '21cm',
    minHeight: '29.7cm',
  };

  return (
    <div className="fixed inset-0 bg-natural-text/50 backdrop-blur-sm z-50 overflow-y-auto flex justify-center py-6 px-4 print-modal-overlay">
      {/* Dynamic Style Sheet for Printing Margins and Size */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${usePrePrintedPad ? 'letter' : 'A4'};
            margin: 0 !important;
          }
          body {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />

      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden border border-natural-border print-modal-card">
        
        {/* Modal Controls */}
        <div className="bg-natural-sidebar border-b border-natural-border px-6 py-4 flex items-center justify-between no-print">
          <div>
            <h3 className="text-lg font-serif font-bold text-natural-text flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-natural-primary"></span>
              {getDocTitle()}
            </h3>
            <p className="text-xs text-natural-muted mt-0.5">
              {usePrePrintedPad 
                ? 'লেটার সাইজ (Letter Size) অফিসিয়াল প্যাডে প্রিন্ট করার জন্য পেজ সেটআপ রেডি করা হয়েছে।'
                : 'A4 সাইজে প্রিন্ট করার জন্য "Print Document" বাটনে ক্লিক করুন এবং Destination হিসেবে প্রিন্টার সিলেক্ট করুন।'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Printer className="w-4 h-4" />
              প্রিন্ট করুন (Print Document)
            </button>
            <button
              onClick={onClose}
              className="text-natural-muted hover:text-natural-text p-1.5 rounded-lg hover:bg-natural-sidebar transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pad Settings Controls (no-print) */}
        <div className="bg-natural-sidebar/50 border-b border-natural-border/60 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs no-print">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 font-bold text-natural-text cursor-pointer">
              <input
                type="checkbox"
                checked={usePrePrintedPad}
                onChange={(e) => setUsePrePrintedPad(e.target.checked)}
                className="rounded text-natural-primary focus:ring-natural-primary w-4 h-4 cursor-pointer"
              />
              অফিসিয়াল প্যাডে প্রিন্ট করুন (Print on Official Pad)
            </label>
            <span className="text-natural-muted">|</span>
            <span className="text-natural-muted italic">সাইজ: Letter (8.5 x 11 inches)</span>
            {activePrintDoc === 'acknowledgment' && (
              <>
                <span className="text-natural-muted">|</span>
                <div className="flex items-center gap-1.5 bg-white border border-natural-border px-2.5 py-1 rounded-xl shadow-sm">
                  <span className="text-natural-muted font-bold text-[10px] uppercase">ভাষা / Language:</span>
                  <select
                    value={docLanguage}
                    onChange={(e) => setDocLanguage(e.target.value as 'bilingual' | 'bn' | 'en')}
                    className="bg-transparent font-bold text-natural-primary text-xs cursor-pointer outline-none border-none py-0 pr-6 pl-0"
                  >
                    <option value="bilingual">দ্বিভাষিক (Bilingual)</option>
                    <option value="bn">বাংলা (Bangla)</option>
                    <option value="en">English Only</option>
                  </select>
                </div>
              </>
            )}
          </div>
          
          {usePrePrintedPad && (
            <div className="flex items-center gap-4 flex-wrap">
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
              <div className="flex items-center gap-1.5">
                <span className="text-natural-muted font-bold">নিচের ফাঁকা (Footer Space):</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="5.0"
                  value={padBottomMargin}
                  onChange={(e) => setPadBottomMargin(parseFloat(e.target.value) || 0)}
                  className="w-14 text-center border border-natural-border bg-white rounded px-1.5 py-0.5 font-bold font-mono text-natural-primary"
                />
                <span className="text-natural-muted font-mono">in</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-natural-muted font-bold">প্রস্থ (Content Width):</span>
                <input
                  type="number"
                  step="0.1"
                  min="5.0"
                  max="7.5"
                  value={padWidth}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 7.5;
                    setPadWidth(Math.min(7.5, Math.max(5.0, val)));
                  }}
                  className="w-14 text-center border border-natural-border bg-white rounded px-1.5 py-0.5 font-bold font-mono text-natural-primary"
                  title="সর্বোচ্চ ৭.৫ ইঞ্চি যাতে উভয় পাশে ০.৫ ইঞ্চি মার্জিন থাকে"
                />
                <span className="text-natural-muted font-mono">in</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Document Container */}
        <div className="p-8 flex-1 overflow-y-auto bg-natural-sidebar/20 flex justify-center print-modal-scrollable-container">
          
          {/* Printable Sheet (Letter or A4 styled wrapper) */}
          <div 
            className={`bg-white shadow-lg border border-natural-border relative text-natural-text print-only font-sans transition-all duration-300 ${usePrePrintedPad ? 'p-0 shadow-none border-none' : 'p-12'}`}
            style={sheetStyle}
          >
            {/* Inner Content Area to respect Padding Top & Side Margins */}
            <div
              style={usePrePrintedPad ? {
                paddingLeft: `${sideMargin}in`,
                paddingRight: `${sideMargin}in`,
                paddingTop: `${padTopMargin}in`,
                paddingBottom: `${padBottomMargin}in`,
                boxSizing: 'border-box',
                width: '100%',
              } : {}}
            >
              {/* Elegant Pad Header */}
              {!usePrePrintedPad && (
                <div className="border-b-2 border-natural-primary pb-5 mb-6 flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-serif font-bold text-natural-primary tracking-tight leading-tight">
                      {getLocalizedValue(companySettings.name, 'bn')}
                    </h1>
                    <h2 className="text-xs font-semibold text-natural-muted tracking-widest mt-0.5 uppercase">
                      {getLocalizedValue(companySettings.name, 'en')}
                    </h2>
                    <p className="text-[10px] text-natural-muted mt-1 italic">{companySettings.slogan}</p>
                  </div>
                  <div className="text-right text-[11px] text-natural-muted leading-relaxed max-w-[280px]">
                    <p className="font-bold text-natural-text">প্রধান কার্যালয় / Head Office:</p>
                    <p className="mt-0.5">{companySettings.address}</p>
                    <p className="mt-0.5">ফোন: {companySettings.phone}</p>
                    <p className="mt-0.5">ইমেইল: {companySettings.email}</p>
                    {companySettings.website && <p className="mt-0.5">ওয়েব: {companySettings.website}</p>}
                  </div>
                </div>
              )}

              {/* ======================================= */}
              {/* DOCUMENT 1: MONEY RECEIPT (মানি রিসিট) */}
              {/* ======================================= */}
              {activePrintDoc === 'receipt' && (
                <div>
                  {/* Title */}
                  <div className="text-center my-6">
                    <span className="border-2 border-natural-primary px-6 py-1.5 text-sm font-serif font-bold tracking-widest bg-natural-sidebar uppercase rounded-xl shadow-sm text-natural-primary">
                      মানি রিসিট / MONEY RECEIPT
                    </span>
                  </div>

                  {/* Meta details */}
                  <div className="grid grid-cols-2 gap-4 text-xs mt-8 mb-6 bg-natural-sidebar/30 p-4 border border-natural-border rounded-2xl">
                    <div className="space-y-2">
                      <p><span className="font-semibold text-natural-muted">রশিদ নম্বর / Receipt No:</span> <span className="font-mono font-bold bg-white border border-natural-border px-2.5 py-0.5 rounded-lg text-natural-primary">{selectedPayment ? selectedPayment.receiptNo : 'REC-NEW'}</span></p>
                      <p><span className="font-semibold text-natural-muted">গ্রাহক আইডি / Customer ID:</span> <span className="font-bold text-natural-text">{customer.customerId}</span></p>
                      <p><span className="font-semibold text-natural-muted">গ্রাহকের নাম / Customer Name:</span> <span className="font-bold text-natural-text">{getLocalizedValue(customer.name)}</span></p>
                      <p><span className="font-semibold text-natural-muted">মোবাইল নম্বর / Mobile No:</span> <span className="text-natural-text">{customer.mobile}</span></p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p><span className="font-semibold text-natural-muted">তারিখ / Date:</span> <span className="font-bold text-natural-text">{selectedPayment ? selectedPayment.date : new Date().toISOString().split('T')[0]}</span></p>
                      <p><span className="font-semibold text-natural-muted">প্রকল্পের নাম / Project:</span> <span className="font-bold text-natural-text">{getLocalizedValue(customer.projectName)}</span></p>
                      <p><span className="font-semibold text-natural-muted">প্লট/রোড নম্বর / Plot & Road No:</span> <span className="text-natural-text">{getLocalizedValue(customer.plotNo) || 'N/A'} (আকার: {customer.plotSize} শতাংশ / {customer.plotSize} Decimal)</span></p>
                      <p><span className="font-semibold text-natural-muted">জাতীয় পরিচয়পত্র / NID:</span> <span className="text-natural-text">{customer.nid}</span></p>
                    </div>
                  </div>

                {/* Receipt Description Table */}
                <table className="w-full text-xs text-left border-collapse border border-natural-border mt-6 mb-8">
                  <thead>
                    <tr className="bg-natural-sidebar border-b border-natural-border">
                      <th className="p-3 border-r border-natural-border font-bold text-natural-text">বিবরণ / Particulars</th>
                      <th className="p-3 border-r border-natural-border font-bold text-natural-text">পেমেন্ট মাধ্যম / Method</th>
                      <th className="p-3 text-right font-bold text-natural-text">পরিমাণ / Amount (Tk)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-natural-border">
                      <td className="p-4 border-r border-natural-border leading-relaxed">
                        <p className="font-bold text-natural-text">
                          {selectedPayment ? (
                            selectedPayment.type === 'Booking' ? 'প্লট বুকিং বাবদ অগ্রিম পেমেন্ট' :
                            selectedPayment.type === 'Down Payment' ? 'প্লট ক্রয়ের ডাউন পেমেন্ট' :
                            selectedPayment.type === 'Installment' ? 'প্লটের নিয়মিত কিস্তি বাবদ পরিশোধ' :
                            selectedPayment.type === 'Previous Payment' ? 'পূর্ববর্তী বকেয়া পেমেন্ট বাবদ পরিশোধ' :
                            selectedPayment.type === 'Re-Payment' ? 'রি-পেমেন্ট বাবদ পরিশোধ' :
                            selectedPayment.type === 'Total Payment' ? 'মোট পেমেন্ট বাবদ সম্পূর্ণ পরিশোধ' :
                            selectedPayment.type === 'Withdraw' ? 'গ্রাহক কর্তৃক জমা টাকা উত্তোলন / উইথড্র' :
                            selectedPayment.type === 'PLOT Cancel' ? 'প্লট বাতিল বাবদ ফেরত পরিশোধ' :
                            'অন্যান্য পেমেন্ট পরিশোধ'
                          ) : 'আজকের পেমেন্ট পরিশোধ'}
                        </p>
                        <p className="text-[10px] text-natural-muted mt-1 italic">
                          {selectedPayment ? (
                            selectedPayment.type === 'Booking' ? 'Advance Booking Money for Plot Booking' :
                            selectedPayment.type === 'Down Payment' ? 'Down Payment for Plot Purchase' :
                            selectedPayment.type === 'Installment' ? 'Regular Installment Payment' :
                            selectedPayment.type === 'Previous Payment' ? 'Previous Outstanding Payment Clearing' :
                            selectedPayment.type === 'Re-Payment' ? 'Re-Payment Settlement' :
                            selectedPayment.type === 'Total Payment' ? 'Full and Final Contract Payment' :
                            selectedPayment.type === 'Withdraw' ? 'Customer Fund Withdrawal' :
                            selectedPayment.type === 'PLOT Cancel' ? 'Plot Cancellation Refund' :
                            'Miscellaneous payment'
                          ) : "Today's Payment Processing"}
                        </p>
                        {selectedPayment?.remarks && (
                          <p className="text-[10px] bg-natural-sidebar text-natural-text px-2.5 py-1 rounded-xl border border-natural-border mt-2 font-mono">
                            মন্তব্য / Remarks: {selectedPayment.remarks}
                          </p>
                        )}
                      </td>
                      <td className="p-4 border-r border-natural-border">
                        <span className="font-bold bg-natural-sidebar px-2.5 py-1 rounded border border-natural-border text-natural-text">
                          {selectedPayment ? selectedPayment.paymentMethod : 'Cash'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-serif font-bold text-natural-text text-sm">
                        ৳ {formatCurrency(selectedPayment ? selectedPayment.amount : 0)}
                      </td>
                    </tr>
                    <tr className="bg-natural-sidebar/20 font-bold">
                      <td colSpan={2} className="p-3 text-right border-r border-natural-border text-natural-text">মোট পরিশোধিত টাকা / Total Paid Amount:</td>
                      <td className="p-3 text-right font-serif text-natural-primary text-sm">৳ {formatCurrency(selectedPayment ? selectedPayment.amount : 0)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Words Translation */}
                <div className="text-xs space-y-3 border border-natural-border p-4 rounded-2xl bg-natural-sidebar/40 mb-12">
                  <p>
                    <span className="font-bold text-natural-primary">টাকা কথায় (Bengali Words):</span>{' '}
                    <span className="font-medium underline decoration-dotted decoration-natural-primary decoration-2 text-natural-text">
                      {selectedPayment ? numberToBengaliWords(selectedPayment.amount) : 'শূণ্য টাকা মাত্র'}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-natural-primary">Amount in Words:</span>{' '}
                    <span className="font-medium underline decoration-dotted decoration-natural-primary decoration-2 italic text-natural-text">
                      {selectedPayment ? numberToEnglishWords(selectedPayment.amount) : 'Zero Taka Only'}
                    </span>
                  </p>
                </div>

                {/* Ledger Quick Summary context */}
                <div className="grid grid-cols-3 gap-4 border border-dashed border-natural-border p-4 rounded-2xl text-center text-xs mb-16 bg-natural-sidebar/10">
                  <div>
                    <p className="text-natural-muted font-semibold">প্লটের মোট মূল্য (Total Price)</p>
                    <p className="font-serif font-bold text-natural-text text-sm mt-1">৳ {formatCurrency(customer.totalPrice)}</p>
                  </div>
                  <div className="border-x border-natural-border">
                    <p className="text-natural-muted font-semibold">মোট জমাকৃত (Total Cumulative Paid)</p>
                    <p className="font-serif font-bold text-natural-primary text-sm mt-1">৳ {formatCurrency(totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-natural-muted font-semibold">সর্বমোট বকেয়া (Remaining Net Due)</p>
                    <p className="font-serif font-bold text-rose-700 text-sm mt-1">৳ {formatCurrency(totalDue)}</p>
                  </div>
                </div>

                {/* Signatures Slot */}
                <div className="mt-20 grid grid-cols-3 gap-8 text-center text-[11px] font-semibold text-natural-text">
                  <div className="space-y-1">
                    <div className="border-t border-natural-border pt-2 w-32 mx-auto"></div>
                    <p>গ্রাহকের স্বাক্ষর</p>
                    <p className="text-[9px] text-natural-muted">Customer's Signature</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-natural-border pt-2 w-32 mx-auto"></div>
                    <p>আদায়কারী / ক্যাশিয়ার</p>
                    <p className="text-[9px] text-natural-muted">Received By / Cashier</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-natural-border pt-2 w-32 mx-auto"></div>
                    <p>অনুমোদিত স্বাক্ষরকারী</p>
                    <p className="text-[9px] text-natural-muted">Authorized Officer</p>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* DOCUMENT 2: ACKNOWLEDGEMENT LETTER      */}
            {/* ======================================= */}
            {activePrintDoc === 'acknowledgment' && (() => {
              const isEn = docLanguage === 'en';
              const isBn = docLanguage === 'bn';
              
              const textTitle = totalDue <= 0
                ? (isBn 
                    ? 'সম্পূর্ণ মূল্য পরিশোধ ও প্লট হস্তান্তর অঙ্গীকারনামা'
                    : isEn 
                      ? 'Acknowledgment Letter for Price, Payment & Plot Hand Over Schedule'
                      : 'সম্পূর্ণ মূল্য পরিশোধ ও প্লট হস্তান্তর অঙ্গীকারনামা / Acknowledgment Letter for Price, Payment & Plot Hand Over Schedule')
                : (isBn 
                    ? 'অঙ্গীকারনামা ও পেমেন্ট স্লিপ'
                    : isEn 
                      ? 'Acknowledgment Letter for Final Price & Payment Schedule'
                      : 'অঙ্গীকারনামা ও পেমেন্ট স্লিপ / Acknowledgment Letter for Final Price & Payment Schedule');

              const textDate = isBn ? 'তারিখ:' : isEn ? 'Date:' : 'তারিখ (Date):';
              const textAttention = isBn ? '১. বরাবরে:' : isEn ? '1. Attention:' : '১. বরাবরে (Attention):';
              const textMobile = isBn ? 'মোবাইল নং:' : isEn ? 'Mobile No:' : 'মোবাইল নং (Mobile No):';

              const textProjectDetails = isBn ? 'প্রকল্পের বিবরণ:' : isEn ? 'Project Details:' : 'প্রকল্পের বিবরণ (Project Details):';
              const textProjectName = isBn ? 'প্রকল্পের নাম' : isEn ? 'Project Name' : 'প্রকল্পের নাম (Project Name)';
              const textProjectAddress = isBn ? 'প্রকল্পের ঠিকানা' : isEn ? 'Project Address' : 'প্রকল্পের ঠিকানা (Project Address)';
              const textPlotNo = isBn ? 'প্লট / রোড নং' : isEn ? 'Plot / Road No' : 'প্লট / রোড নং (Plot / Road No)';
              const textPlotSize = isBn ? 'প্লটের আকার' : isEn ? 'Plot Size' : 'প্লটের আকার (Plot Size)';

              const textPrice = isBn ? 'মূল্য বিবরণী:' : isEn ? 'Price Details:' : 'মূল্য বিবরণী (Price Details):';
              const textPricePerDecimal = isBn ? 'প্রতি ডেসিমেল মূল্য' : isEn ? 'Price Per Decimal' : 'প্রতি ডেসিমেল মূল্য (Price Per Decimal)';
              const textTotalPrice = isBn 
                ? `সর্বমোট মূল্য (${customer.plotSize.toFixed(2)} ডেসিমেল)` 
                : isEn 
                  ? `Total Price (${customer.plotSize.toFixed(2)} Decimal)` 
                  : `সর্বমোট মূল্য / Total Price (${customer.plotSize.toFixed(2)} Decimal)`;

              const textPaymentStatus = isBn ? 'পরিশোধের অবস্থা ও সারসংক্ষেপ:' : isEn ? 'Payment Status & Summary:' : 'পরিশোধের অবস্থা ও সারসংক্ষেপ (Payment Status & Summary):';
              const textPresentDue = isBn ? 'বর্তমান বকেয়া' : isEn ? 'Present Due' : 'বর্তমান বকেয়া (Present Due)';
              const textTotalPayment = isBn ? 'মোট পরিশোধিত' : isEn ? 'Total Payment' : 'মোট পরিশোধিত (Total Payment)';

              const textSignatureLabel = isBn ? 'স্বাক্ষর:' : isEn ? 'Signature:' : 'স্বাক্ষর (Signature):';
              const textManagingDirector = isBn ? '(ব্যবস্থাপনা পরিচালক)' : isEn ? '(Managing Director)' : '(ব্যবস্থাপনা পরিচালক / Managing Director)';

              const getPaymentLabel = (type: string) => {
                if (isBn) {
                  if (type === 'Booking') return 'বুকিং মানি পরিশোধ';
                  if (type === 'Down Payment') return 'ডাউন পেমেন্ট পরিশোধ';
                  if (type === 'Installment') return 'কিস্তি পরিশোধ';
                  if (type === 'Previous Payment') return 'পূর্ববর্তী জমা';
                  if (type === 'Re-Payment') return 'পুনঃ জমাদান';
                  if (type === 'Others') return 'অন্যান্য জমা';
                  if (type === 'Withdraw') return 'অর্থ উত্তোলন';
                  if (type === 'PLOT Cancel') return 'প্লট বাতিলকরণ';
                  return 'পেমেন্ট জমা';
                } else if (isEn) {
                  if (type === 'Booking') return 'Booking Payment';
                  if (type === 'Down Payment') return 'Down Payment';
                  if (type === 'Installment') return 'Installment';
                  if (type === 'Previous Payment') return 'Previous Payment';
                  if (type === 'Re-Payment') return 'Re-payment';
                  if (type === 'Others') return 'Other Payment';
                  if (type === 'Withdraw') return 'Withdrawal';
                  if (type === 'PLOT Cancel') return 'PLOT Cancel';
                  return 'Payment';
                } else {
                  if (type === 'Booking') return 'বুকিং পেমেন্ট (Booking Money)';
                  if (type === 'Down Payment') return 'ডাউন পেমেন্ট (Down Payment)';
                  if (type === 'Installment') return 'কিস্তি (Installment)';
                  if (type === 'Previous Payment') return 'পূর্ববর্তী জমা (Previous Payment)';
                  if (type === 'Re-Payment') return 'পুনঃ জমা (Re-Payment)';
                  if (type === 'Others') return 'অন্যান্য জমা (Others)';
                  if (type === 'Withdraw') return 'উত্তোলন (Withdraw)';
                  if (type === 'PLOT Cancel') return 'প্লট বাতিল (PLOT Cancel)';
                  return 'পেমেন্ট (Payment)';
                }
              };

              const textAcknowledgmentPara = () => {
                if (customer.registrationNote) {
                  return (
                    <p className="text-[11px] font-semibold leading-relaxed text-natural-text whitespace-pre-line bg-natural-sidebar/20 p-4 rounded-xl border border-natural-border/60">
                      {customer.registrationNote}
                    </p>
                  );
                }

                if (totalDue <= 0) {
                  const dNo = customer.deedNo || '................';
                  const dDate = customer.deedDate 
                    ? customer.deedDate.split('-').reverse().join('/') 
                    : '..../..../........';

                  if (isBn) {
                    return (
                      <div className="space-y-2 text-[11px] font-medium leading-relaxed text-natural-text italic">
                        <p>
                          আমি নিম্নস্বাক্ষরকারী, <span className="font-bold text-natural-primary">এ.আর. প্রোপার্টিজ অ্যান্ড ডেভেলপারস</span>-এর পক্ষে এতদ্বারা প্রত্যয়ন করছি যে, আমরা উপরোক্ত প্লটের সম্পূর্ণ পেমেন্ট বুঝে পেয়েছি এবং গত <span className="font-bold underline">{dDate}</span> তারিখে <span className="font-bold underline">{dNo}</span> নম্বর কবালা রেজিস্ট্রি দলিল মূলে প্লটটি হস্তান্তর করেছি।
                        </p>
                        <p className="font-sans font-bold text-[10px] text-emerald-700 not-italic mt-2">
                          আমাদের সাথে থাকার জন্য ধন্যবাদ, আপনার সুন্দর ভবিষ্যৎ কামনা করছি।
                        </p>
                      </div>
                    );
                  } else if (isEn) {
                    return (
                      <div className="space-y-2 text-[11px] font-medium leading-relaxed text-natural-text italic">
                        <p>
                          I the below undersigned on behalf of <span className="font-bold text-natural-primary">A.R. Properties and Developers</span> hereby received all payment and handed over the plot at <span className="font-bold underline">{dDate}</span> with <span className="font-bold underline">{dNo}</span> no. Kabala Registry Deed.
                        </p>
                        <p className="font-sans font-bold text-[10px] text-emerald-700 not-italic mt-2">
                          Thanks for being with us, wish you all the best.
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="space-y-2.5 text-[11px] font-medium leading-relaxed text-natural-text italic">
                        <p>
                          আমি নিম্নস্বাক্ষরকারী, <span className="font-bold text-natural-primary">এ.আর. প্রোপার্টিজ অ্যান্ড ডেভেলপারস</span>-এর পক্ষে এতদ্বারা প্রত্যয়ন করছি যে, আমরা উপরোক্ত প্লটের সম্পূর্ণ পেমেন্ট বুঝে পেয়েছি এবং গত <span className="font-bold underline">{dDate}</span> তারিখে <span className="font-bold underline">{dNo}</span> নম্বর কবালা রেজিস্ট্রি দলিল মূলে প্লটটি হস্তান্তর করেছি।
                        </p>
                        <div className="border-t border-natural-border/35 my-1.5"></div>
                        <p>
                          I the below undersigned on behalf of <span className="font-bold text-natural-primary">A.R. Properties and Developers</span> hereby received all payment and handed over the plot at <span className="font-bold underline">{dDate}</span> with <span className="font-bold underline">{dNo}</span> no. Kabala Registry Deed.
                        </p>
                        <p className="font-sans font-bold text-[10px] text-emerald-700 not-italic mt-2">
                          আমাদের সাথে থাকার জন্য ধন্যবাদ, আপনার সুন্দর ভবিষ্যৎ কামনা করছি। / Thanks for being with us, wish you all the best.
                        </p>
                      </div>
                    );
                  }
                }

                if (isBn) {
                  return (
                    <p className="text-[11px] font-medium leading-relaxed text-natural-text italic">
                      আমি নিম্নস্বাক্ষরকারী, <span className="font-bold text-natural-primary">এ.আর. প্রোপার্টিজ অ্যান্ড ডেভেলপারস</span>-এর পক্ষে এতদ্বারা উপরিউক্ত পেমেন্ট বিবরণী স্বীকার করছি এবং নিশ্চিত করছি যে, কোম্পানির নিয়মানুযায়ী প্লট প্রস্তুত হলে উল্লেখিত গ্রাহক অবশিষ্ট বকেয়া টাকা পরিশোধ করবেন।
                    </p>
                  );
                } else if (isEn) {
                  return (
                    <p className="text-[11px] font-medium leading-relaxed text-natural-text italic">
                      I the below undersigned on behalf of <span className="font-bold text-natural-primary">A.R. Properties and Developers</span> hereby acknowledge the above payment details and confirm the remaining balance will be paid by the mentioned customer when the plot is ready as per company's norms.
                    </p>
                  );
                } else {
                  return (
                    <div className="space-y-2 text-[11px] font-medium leading-relaxed text-natural-text italic">
                      <p>
                        আমি নিম্নস্বাক্ষরকারী, <span className="font-bold text-natural-primary">এ.আর. প্রোপার্টিজ অ্যান্ড ডেভেলপারস</span>-এর পক্ষে এতদ্বারা উপরিউক্ত পেমেন্ট বিবরণী স্বীকার করছি এবং নিশ্চিত করছি যে, কোম্পানির নিয়মানুযায়ী প্লট প্রস্তুত হলে উল্লেখিত গ্রাহক অবশিষ্ট বকেয়া টাকা পরিশোধ করবেন।
                      </p>
                      <div className="border-t border-natural-border/35 my-1"></div>
                      <p>
                        I the below undersigned on behalf of <span className="font-bold text-natural-primary">A.R. Properties and Developers</span> hereby acknowledge the above payment details and confirm the remaining balance will be paid by the mentioned customer when the plot is ready as per company's norms.
                      </p>
                    </div>
                  );
                }
              };

              return (
                <div className="text-natural-text text-xs space-y-3.5 pt-2 print:pt-0 font-sans leading-relaxed">
                  {/* Header/Title */}
                  <div className="text-center pb-1 mb-1 border-b-2 border-natural-primary/20">
                    <h1 className="text-xs sm:text-sm font-serif font-extrabold tracking-wider text-natural-primary uppercase">
                      {textTitle}
                    </h1>
                  </div>

                  {/* Date */}
                  <div className="flex justify-between items-center border-b border-natural-border/30 pb-1">
                    <span className="font-bold text-natural-muted text-xs">{textDate}</span>
                    <span className="font-mono font-bold text-xs text-natural-text">
                      {selectedPayment ? selectedPayment.date.split('-').reverse().join('/') : new Date().toLocaleDateString('en-GB')}
                    </span>
                  </div>

                  {/* Attention Block */}
                  <div className="space-y-1 bg-natural-sidebar/5 p-3 rounded-xl border border-natural-border/40">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif font-bold text-sm text-natural-muted">{textAttention}</span>
                      <span className="font-bold text-sm text-natural-primary uppercase border-b border-dotted border-natural-primary/60 pb-0.5">
                        {getLocalizedValue(customer.name)}
                      </span>
                      {customer.nid && (
                        <span className="font-mono text-xs text-natural-muted">
                          (NID-{customer.nid})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-natural-muted font-bold text-xs">{textMobile}</span>
                      <span className="font-mono font-bold text-sm text-natural-text">{customer.mobile || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Project Details Section */}
                  <div className="space-y-1">
                    <p className="font-serif font-bold text-xs text-natural-primary border-b border-natural-border/60 pb-0.5 flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-natural-primary rounded-full"></span>
                      {textProjectDetails}
                    </p>
                    <div className="grid grid-cols-[160px_12px_1fr] gap-y-1 text-xs px-2">
                      <span className="text-natural-muted font-bold">{textProjectName}</span>
                      <span className="text-natural-muted font-bold">:</span>
                      <span className="font-bold text-natural-text">{getLocalizedValue(customer.projectName)}</span>

                      <span className="text-natural-muted font-bold">{textProjectAddress}</span>
                      <span className="text-natural-muted font-bold">:</span>
                      <span className="text-natural-text font-medium">{getLocalizedValue(customer.projectAddress)}</span>

                      <span className="text-natural-muted font-bold">{textPlotNo}</span>
                      <span className="text-natural-muted font-bold">:</span>
                      <span className="font-bold text-natural-primary">{getLocalizedValue(customer.plotNo) || 'As per the attached sketch'}</span>

                      <span className="text-natural-muted font-bold">{textPlotSize}</span>
                      <span className="text-natural-muted font-bold">:</span>
                      <span className="font-bold text-natural-text">{customer.plotSize.toFixed(2)} {isEn ? 'Decimal' : isBn ? 'ডেসিমেল' : 'ডেসিমেল / Decimal'}</span>
                    </div>
                  </div>

                  {/* Price Details Section */}
                  <div className="space-y-1">
                    <p className="font-serif font-bold text-xs text-natural-primary border-b border-natural-border/60 pb-0.5 flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-natural-primary rounded-full"></span>
                      {textPrice}
                    </p>
                    <div className="grid grid-cols-[160px_12px_1fr] gap-y-1 text-xs font-serif px-2">
                      <span className="text-natural-muted font-sans font-bold">{textPricePerDecimal}</span>
                      <span className="text-natural-muted font-sans font-bold">:</span>
                      <span className="font-bold text-natural-text">৳ {formatCurrency(customer.pricePerDecimal)} Tk.</span>

                      <span className="text-natural-muted font-sans font-bold">{textTotalPrice}</span>
                      <span className="text-natural-muted font-sans font-bold">:</span>
                      <span className="font-bold text-natural-text text-sm">৳ {formatCurrency(customer.totalPrice)} Tk.</span>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="space-y-1">
                    <p className="font-serif font-bold text-xs text-natural-primary border-b border-natural-border/60 pb-0.5 flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-natural-primary rounded-full"></span>
                      {textPaymentStatus}
                    </p>
                    <div className="grid grid-cols-[200px_12px_1fr] gap-y-1 text-xs font-serif bg-natural-sidebar/5 p-3 rounded-xl border border-natural-border/40">
                      
                      {/* List individual positive payments dynamically */}
                      {sortedPayments.filter(p => p.type !== 'Withdraw' && p.type !== 'PLOT Cancel').map((p) => {
                        const label = getPaymentLabel(p.type);
                        const pDate = p.date.split('-').reverse().join('.');

                        return (
                          <React.Fragment key={p.id}>
                            <span className="text-natural-muted font-sans font-bold">{label} ({pDate})</span>
                            <span className="text-natural-muted font-sans font-bold">:</span>
                            <span className="font-bold text-natural-text text-right mr-4">৳ {formatCurrency(p.amount)} Tk.</span>
                          </React.Fragment>
                        );
                      })}

                      {/* Show positive payments total if there's multiple */}
                      {sortedPayments.filter(p => p.type !== 'Withdraw' && p.type !== 'PLOT Cancel').length > 1 && (
                        <>
                          <span className="text-natural-primary font-sans font-bold border-t border-natural-border pt-1.5">{textTotalPayment}</span>
                          <span className="text-natural-muted font-sans font-bold border-t border-natural-border pt-1.5">:</span>
                          <span className="font-bold text-natural-primary border-t border-natural-border pt-1.5 text-right mr-4">
                            ৳ {formatCurrency(sortedPayments.filter(p => p.type !== 'Withdraw' && p.type !== 'PLOT Cancel').reduce((s, p) => s + p.amount, 0))} Tk.
                          </span>
                        </>
                      )}

                      {/* List individual negative payments (Withdrawals / PLOT Cancellations) dynamically */}
                      {sortedPayments.filter(p => p.type === 'Withdraw' || p.type === 'PLOT Cancel').map((p) => {
                        const label = getPaymentLabel(p.type);
                        const pDate = p.date.split('-').reverse().join('.');
                        return (
                          <React.Fragment key={p.id}>
                            <span className="text-rose-700 font-sans font-bold">{label} ({pDate})</span>
                            <span className="text-natural-muted font-sans font-bold">:</span>
                            <span className="font-bold text-rose-700 text-right mr-4">
                              ( - ) ৳ {formatCurrency(p.amount)} Tk.
                            </span>
                          </React.Fragment>
                        );
                      })}

                      {/* Final Present Due Row */}
                      <span className="text-rose-700 font-sans font-extrabold border-t-2 border-natural-border pt-2 text-sm">{textPresentDue}</span>
                      <span className="text-natural-muted font-sans font-bold border-t-2 border-natural-border pt-2 text-sm">:</span>
                      <span className="font-extrabold text-rose-700 border-t-2 border-natural-border pt-2 text-sm text-right mr-4">
                        ৳ {formatCurrency(totalDue)} Tk.
                      </span>

                      {totalDue <= 0 && (
                        <>
                          <span className="text-emerald-700 font-sans font-extrabold border-t border-natural-border/50 pt-2">{isBn ? 'হস্তান্তর অবস্থা' : isEn ? 'Handover Status' : 'হস্তান্তর অবস্থা (Handover Status)'}</span>
                          <span className="text-natural-muted font-sans font-bold border-t border-natural-border/50 pt-2">:</span>
                          <span className="font-extrabold text-emerald-700 border-t border-natural-border/50 pt-2 text-right mr-4">{isBn ? 'সম্পূর্ণ পরিশোধিত ও হস্তান্তরিত' : isEn ? 'Fully Paid & Handed Over' : 'সম্পূর্ণ পরিশোধিত ও হস্তান্তরিত (Fully Paid & Handed Over)'}</span>
                        </>
                      )}

                    </div>
                  </div>

                  {/* Company Acknowledgment / Guarantee Wording */}
                  <div className="bg-natural-sidebar/10 p-3 rounded-xl border border-dashed border-natural-border/60 mt-3 text-justify">
                    {textAcknowledgmentPara()}
                  </div>

                  {/* Signature Section */}
                  <div className="pt-6 flex justify-end">
                    <div className="space-y-0.5 text-center font-serif min-w-[240px]">
                      <p className="text-xs font-semibold font-sans text-natural-muted text-center mb-10">{textSignatureLabel}</p>
                      <div className="border-t border-natural-border/60 pt-1.5">
                        <p className="font-bold text-natural-text text-xs">S.M. Mahfuzul Karim Milon</p>
                        <p className="text-[9px] text-natural-muted font-medium">{textManagingDirector}</p>
                        <p className="font-bold text-natural-primary text-[9px] mt-0.5">A.R. Properties and Developers</p>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* ======================================= */}
            {/* DOCUMENT 3: PAYMENT SCHEDULE             */}
            {/* ======================================= */}
            {activePrintDoc === 'schedule' && (
              <div>
                {/* Title */}
                <div className="text-center my-6">
                  <span className="border-2 border-natural-primary px-6 py-1.5 text-sm font-serif font-bold tracking-widest bg-natural-sidebar uppercase rounded-xl shadow-sm text-natural-primary">
                    পরিশোধের সময়সূচী / PAYMENT SCHEDULE
                  </span>
                </div>

                {/* Summary Box */}
                <div className="grid grid-cols-2 gap-4 text-xs my-6 bg-natural-sidebar/30 p-4 border border-natural-border rounded-2xl">
                  <div className="space-y-1.5">
                    <p><span className="font-semibold text-natural-muted">গ্রাহক আইডি:</span> <span className="font-bold text-natural-text">{customer.customerId}</span></p>
                    <p><span className="font-semibold text-natural-muted">গ্রাহকের নাম:</span> <span className="font-bold text-natural-text">{getLocalizedValue(customer.name)}</span></p>
                    <p><span className="font-semibold text-natural-muted">প্রকল্পের নাম:</span> <span className="text-natural-text">{getLocalizedValue(customer.projectName)}</span></p>
                    <p><span className="font-semibold text-natural-muted">প্লট নং ও আকার:</span> <span className="text-natural-text">{getLocalizedValue(customer.plotNo)} (আকার: {customer.plotSize} শতাংশ)</span></p>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p><span className="font-semibold text-natural-muted">প্লটের মোট মূল্য:</span> <span className="font-bold text-natural-text">৳ {formatCurrency(customer.totalPrice)}</span></p>
                    <p><span className="font-semibold text-natural-muted">মোট পরিশোধিত:</span> <span className="font-bold text-natural-primary">৳ {formatCurrency(totalPaid)}</span></p>
                    <p><span className="font-semibold text-natural-muted">মোট বকেয়া:</span> <span className="font-bold text-rose-700">৳ {formatCurrency(totalDue)}</span></p>
                  </div>
                </div>

                {/* Table for Schedule */}
                <div className="text-xs mb-4">
                  <p className="font-bold text-natural-text mb-2">১. বুকিং ও ডাউন পেমেন্ট বিবরণী (Booking & Down Payment Details):</p>
                  <table className="w-full text-left border-collapse border border-natural-border">
                    <thead>
                      <tr className="bg-natural-sidebar border-b border-natural-border text-[11px]">
                        <th className="p-2 border-r border-natural-border font-bold text-natural-text">ধাপ / Milestone</th>
                        <th className="p-2 border-r border-natural-border font-bold text-right text-natural-text">নির্ধারিত অর্থ / Target (Tk)</th>
                        <th className="p-2 border-r border-natural-border font-bold text-right text-natural-text">জমাকৃত / Paid (Tk)</th>
                        <th className="p-2 font-bold text-center text-natural-text">অবস্থা / Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-natural-border">
                        <td className="p-2 border-r border-natural-border text-natural-text">বুকিং মানি / Booking Money</td>
                        <td className="p-2 border-r border-natural-border text-right font-serif text-natural-text">৳ {formatCurrency(customer.totalPrice * 0.1)}</td>
                        <td className="p-2 border-r border-natural-border text-right font-serif text-natural-primary font-bold">৳ {formatCurrency(bookingPayment)}</td>
                        <td className="p-2 text-center">
                          {bookingPayment >= customer.totalPrice * 0.1 ? (
                            <span className="text-[10px] bg-natural-sidebar text-natural-primary px-1.5 py-0.5 rounded font-bold border border-natural-border">পরিশোধিত</span>
                          ) : (
                            <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-bold border border-amber-200">আংশিক</span>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b border-natural-border">
                        <td className="p-2 border-r border-natural-border text-natural-text">ডাউন পেমেন্ট / Down Payment</td>
                        <td className="p-2 border-r border-natural-border text-right font-serif text-natural-text">৳ {formatCurrency(customer.totalPrice * 0.2)}</td>
                        <td className="p-2 border-r border-natural-border text-right font-serif text-natural-primary font-bold">
                          ৳ {formatCurrency(payments.filter(p => p.type === 'Down Payment').reduce((s, p) => s + p.amount, 0))}
                        </td>
                        <td className="p-2 text-center">
                          {payments.some(p => p.type === 'Down Payment') ? (
                            <span className="text-[10px] bg-natural-sidebar text-natural-primary px-1.5 py-0.5 rounded font-bold border border-natural-border">পরিশোধিত</span>
                          ) : (
                            <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold border border-rose-200">অপরিশোধিত</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-xs mt-6">
                  <p className="font-bold text-natural-text mb-2">২. কিস্তি পরিকল্পনা ও অবশিষ্ট কিস্তিসমূহ (Installment Schedule & Projected Payments):</p>
                  <p className="text-[10px] text-natural-muted mb-3 leading-relaxed">
                    নিচে গ্রাহকের কিস্তি পরিশোধের বিবরণ এবং অবশিষ্ট কিস্তির খসড়া পরিকল্পনা দেওয়া হলো। সাধারণত অবশিষ্ট বকেয়া ১২টি মাসিক কিস্তিতে পরিশোধ করতে হবে।
                  </p>
                  <table className="w-full text-left border-collapse border border-natural-border">
                    <thead>
                      <tr className="bg-natural-sidebar border-b border-natural-border text-[11px]">
                        <th className="p-2 border-r border-natural-border font-bold text-natural-text">কিস্তি / Installment</th>
                        <th className="p-2 border-r border-natural-border font-bold text-natural-text">পরিশোধের লক্ষ্য / Estimated Date</th>
                        <th className="p-2 border-r border-natural-border font-bold text-right text-natural-text">পরিমাণ / Amount (Tk)</th>
                        <th className="p-2 font-bold text-center text-natural-text">অবস্থা / Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Show recorded installment payments */}
                      {payments.filter(p => p.type === 'Installment').map((p, idx) => (
                        <tr key={p.id} className="border-b border-natural-border font-serif text-[11px] text-natural-text">
                          <td className="p-2 border-r border-natural-border font-sans text-natural-text">কিস্তি - {toBengaliDigits(idx + 1)} (Installment {idx + 1})</td>
                          <td className="p-2 border-r border-natural-border font-mono">{p.date}</td>
                          <td className="p-2 border-r border-natural-border text-right">৳ {formatCurrency(p.amount)}</td>
                          <td className="p-2 text-center font-sans">
                            <span className="text-[10px] bg-natural-sidebar text-natural-primary px-1.5 py-0.5 rounded font-bold border border-natural-border">পরিশোধিত / Paid</span>
                          </td>
                        </tr>
                      ))}
                      
                      {/* Projected future installments if there is due */}
                      {totalDue > 0 ? (
                        Array.from({ length: Math.min(10, Math.ceil(totalDue / 100000) || 6) }).map((_, i) => {
                          const instAmount = Math.ceil(totalDue / 6);
                          const dateObj = new Date();
                          dateObj.setMonth(dateObj.getMonth() + i + 1);
                          const formattedDate = dateObj.toISOString().split('T')[0];
                          return (
                            <tr key={i} className="border-b border-natural-border font-serif text-[11px] text-natural-muted">
                              <td className="p-2 border-r border-natural-border font-sans">অবशिष्ट কিস্তি - {toBengaliDigits(i + 1)} (Est. Inst. {i + 1})</td>
                              <td className="p-2 border-r border-natural-border font-mono">{formattedDate}</td>
                              <td className="p-2 border-r border-natural-border text-right">৳ {formatCurrency(Math.min(totalDue - (i * instAmount), instAmount) > 0 ? Math.min(totalDue - (i * instAmount), instAmount) : instAmount)}</td>
                              <td className="p-2 text-center font-sans">
                                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">পরিকল্পিত / Scheduled</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="border-b border-natural-border">
                          <td colSpan={4} className="p-4 text-center text-natural-primary font-bold">
                            আপনার কোনো বকেয়া নেই! সমস্ত পেমেন্ট পরিশোধিত হয়েছে। (No due, fully paid!)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="mt-24 grid grid-cols-2 gap-12 text-center text-[11px] font-semibold text-natural-text">
                  <div className="space-y-1">
                    <div className="border-t border-natural-border pt-2 w-36 mx-auto"></div>
                    <p>গ্রাহকের স্বাক্ষর</p>
                    <p className="text-[9px] text-natural-muted">Customer's Signature</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-natural-border pt-2 w-36 mx-auto"></div>
                    <p>অনুমোদিত স্বাক্ষর (অফিস কপি)</p>
                    <p className="text-[9px] text-natural-muted">Authorized Officer Sign</p>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* DOCUMENT 4: CUSTOMER PAYMENT HISTORY    */}
            {/* ======================================= */}
            {activePrintDoc === 'history' && (
              <div>
                {/* Title */}
                <div className="text-center my-6">
                  <span className="border-2 border-natural-primary px-6 py-1.5 text-sm font-serif font-bold tracking-widest bg-natural-sidebar uppercase rounded-xl shadow-sm text-natural-primary">
                    গ্রাহক পেমেন্ট বিবরণী / CUSTOMER PAYMENT LEDGER
                  </span>
                </div>

                {/* Summary Metadata Card */}
                <div className="grid grid-cols-2 gap-4 text-xs my-6 bg-natural-sidebar/30 p-4 border border-natural-border rounded-2xl">
                  <div className="space-y-1.5">
                    <p><span className="font-semibold text-natural-muted">গ্রাহক আইডি:</span> <span className="font-bold text-natural-text">{customer.customerId}</span></p>
                    <p><span className="font-semibold text-natural-muted">গ্রাহকের নাম:</span> <span className="font-bold text-natural-text">{getLocalizedValue(customer.name)}</span></p>
                    <p><span className="font-semibold text-natural-muted">মোবাইল নং:</span> <span className="text-natural-text">{customer.mobile}</span></p>
                    <p><span className="font-semibold text-natural-muted">প্লট ও প্রকল্প:</span> <span className="text-natural-text">{getLocalizedValue(customer.plotNo)}, {getLocalizedValue(customer.projectName)}</span></p>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p><span className="font-semibold text-natural-muted">প্লটের মোট মূল্য:</span> <span className="font-bold text-natural-text">৳ {formatCurrency(customer.totalPrice)}</span></p>
                    <p><span className="font-semibold text-natural-muted">মোট পরিশোধিত:</span> <span className="font-bold text-natural-primary">৳ {formatCurrency(totalPaid)}</span></p>
                    <p><span className="font-semibold text-natural-muted">মোট বকেয়া:</span> <span className="font-bold text-rose-700">৳ {formatCurrency(totalDue)}</span></p>
                    <p><span className="font-semibold text-natural-muted">দলিল রেজিস্ট্রি অবস্থা:</span> <span className={`font-bold ${customer.deedNo ? 'text-emerald-700' : 'text-natural-primary'}`}>{customer.deedNo ? `সম্পন্ন (দলিল নং: ${customer.deedNo})` : 'চলমান / In Progress'}</span></p>
                  </div>
                </div>

                {/* Ledger Table */}
                <p className="font-bold text-natural-text mb-2 text-xs">পরিশোধের বিবরণী ও লেজার খতিয়ান (Transaction Ledger History):</p>
                <table className="w-full text-left border-collapse border border-natural-border text-xs">
                  <thead>
                    <tr className="bg-natural-sidebar border-b border-natural-border text-[11px] font-bold text-natural-text">
                      <th className="p-2.5 border-r border-natural-border">ক্রমিক / Sl</th>
                      <th className="p-2.5 border-r border-natural-border">তারিখ / Date</th>
                      <th className="p-2.5 border-r border-natural-border">রশিদ নং / Receipt</th>
                      <th className="p-2.5 border-r border-natural-border">ধরণ / Type</th>
                      <th className="p-2.5 border-r border-natural-border text-right">পরিমাণ / Amount (Tk)</th>
                      <th className="p-2.5 text-right">মোট জমাকৃত / Cumulative (Tk)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayments.length > 0 ? (
                      (() => {
                        let runningTotal = 0;
                        return sortedPayments.map((p, index) => {
                          const isNegative = p.type === 'Withdraw' || p.type === 'PLOT Cancel';
                          if (isNegative) {
                            runningTotal -= p.amount;
                          } else {
                            runningTotal += p.amount;
                          }
                          return (
                            <tr key={p.id} className="border-b border-natural-border font-serif text-[11px] text-natural-text">
                              <td className="p-2.5 border-r border-natural-border text-center font-sans text-natural-text">{index + 1}</td>
                              <td className="p-2.5 border-r border-natural-border font-mono">{p.date}</td>
                              <td className="p-2.5 border-r border-natural-border font-mono font-bold text-natural-primary">{p.receiptNo}</td>
                              <td className="p-2.5 border-r border-natural-border font-sans text-natural-text">
                                {p.type === 'Booking' ? 'Booking Money' : 
                                 p.type === 'Down Payment' ? 'Down Payment' : 
                                 p.type === 'Installment' ? 'Regular Installment' :
                                 p.type === 'Previous Payment' ? 'Previous Payment' :
                                 p.type === 'Re-Payment' ? 'Re-Payment' :
                                 p.type === 'Total Payment' ? 'Full & Final Payment' :
                                 p.type === 'Withdraw' ? 'Withdrawal (উইথড্র)' :
                                 p.type === 'PLOT Cancel' ? 'Plot Cancellation' : 'Others'}
                              </td>
                              <td className="p-2.5 border-r border-natural-border text-right font-serif font-bold text-natural-text">
                                {isNegative ? '-' : ''}৳ {formatCurrency(p.amount)}
                              </td>
                              <td className="p-2.5 text-right text-natural-primary font-bold">৳ {formatCurrency(runningTotal)}</td>
                            </tr>
                          );
                        });
                      })()
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-rose-600 font-bold">
                          এখনো কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি! (No payment records found!)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Final calculation row */}
                <div className="mt-6 border border-dashed border-natural-border p-4 rounded-2xl bg-natural-sidebar/20 text-xs flex justify-between font-bold text-natural-text">
                  <p>মোট প্লট চুক্তি মূল্য: ৳ {formatCurrency(customer.totalPrice)}</p>
                  <p className="text-natural-primary">মোট প্রাপ্তি: ৳ {formatCurrency(totalPaid)}</p>
                  <p className="text-rose-700">অবশিষ্ট পাওনা: ৳ {formatCurrency(totalDue)}</p>
                </div>

                {/* Signatures */}
                <div className="pt-20 flex justify-end">
                  <div className="space-y-1 text-center font-serif min-w-[240px]">
                    <p className="text-xs font-semibold font-sans text-natural-muted text-center mb-16">স্বাক্ষর / Signature:</p>
                    <div className="border-t border-natural-border/60 pt-2">
                      <p className="font-bold text-natural-text text-sm">S.M. Mahfuzul Karim Milon</p>
                      <p className="text-[10px] text-natural-muted font-medium">(Managing Director)</p>
                      <p className="font-bold text-natural-primary text-[10px] mt-0.5">A.R. Properties and Developers</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* DOCUMENT 5: DEED REGISTRATION COPY      */}
            {/* ======================================= */}
            {activePrintDoc === 'deed' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header Title */}
                <div className="text-center my-6">
                  <span className="border-2 border-emerald-600 px-6 py-2 text-sm font-serif font-bold tracking-widest bg-emerald-50 uppercase rounded-xl shadow-sm text-emerald-800">
                    রেজিস্ট্রি দলিল বিবরণী / REGISTRY DEED STATEMENT
                  </span>
                </div>

                {/* Main Announcement Banner */}
                <div className="bg-emerald-50/50 border-2 border-dashed border-emerald-300 p-6 rounded-3xl text-center space-y-2">
                  <span className="text-3xl">🎉</span>
                  <h3 className="font-bold text-base text-emerald-900 font-serif">অভিনন্দন! কবালা দলিল রেজিস্ট্রি সম্পন্ন হয়েছে</h3>
                  <p className="text-xs text-emerald-700 font-medium">
                    গ্রাহকের মোট চুক্তি মূল্য সম্পূর্ণ পরিশোধিত হয়েছে এবং সফলভাবে জমি রেজিস্ট্রি সম্পন্ন হয়েছে।
                  </p>
                </div>

                {/* Metadata Cards: Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left: Customer & Plot Info */}
                  <div className="bg-natural-sidebar/30 p-5 border border-natural-border rounded-2xl space-y-2.5">
                    <h4 className="font-bold text-natural-text border-b border-natural-border/60 pb-1 font-serif text-xs">১. গ্রাহক ও প্লট বিবরণী (Customer & Plot Details)</h4>
                    <p><span className="font-semibold text-natural-muted">গ্রাহক আইডি:</span> <span className="font-bold text-natural-text">{customer.customerId}</span></p>
                    <p><span className="font-semibold text-natural-muted">গ্রাহকের নাম:</span> <span className="font-bold text-natural-text">{getLocalizedValue(customer.name)}</span></p>
                    <p><span className="font-semibold text-natural-muted">মোবাইল নং:</span> <span className="text-natural-text">{customer.mobile}</span></p>
                    <p><span className="font-semibold text-natural-muted">এনআইডি নং (NID):</span> <span className="text-natural-text font-mono">{customer.nid}</span></p>
                    <p><span className="font-semibold text-natural-muted">প্রকল্পের নাম:</span> <span className="text-natural-text">{getLocalizedValue(customer.projectName)}</span></p>
                    <p><span className="font-semibold text-natural-muted">প্লট/রোড নম্বর:</span> <span className="font-bold text-natural-text">{getLocalizedValue(customer.plotNo)}</span></p>
                    <p><span className="font-semibold text-natural-muted">প্লটের আকার:</span> <span className="font-bold text-natural-text">{toBengaliDigits(customer.plotSize)} শতক (Decimals)</span></p>
                  </div>

                  {/* Right: Registry Deed & Payment Summary */}
                  <div className="bg-natural-sidebar/30 p-5 border border-natural-border rounded-2xl space-y-2.5">
                    <h4 className="font-bold text-emerald-800 border-b border-natural-border/60 pb-1 font-serif text-xs">২. দলিল ও পেমেন্ট বিবরণী (Deed & Payment Details)</h4>
                    <p><span className="font-semibold text-natural-muted">মোট চুক্তি মূল্য:</span> <span className="font-bold text-natural-text">৳ {formatCurrency(customer.totalPrice)}</span></p>
                    <p><span className="font-semibold text-natural-muted">মোট পরিশোধিত:</span> <span className="font-bold text-emerald-700">৳ {formatCurrency(totalPaid)}</span></p>
                    <p><span className="font-semibold text-natural-muted">অবশিষ্ট বকেয়া:</span> <span className="font-bold text-emerald-700 font-mono">৳ ০.০০ (পরিশোধিত)</span></p>
                    
                    <div className="mt-4 pt-3 border-t border-emerald-200/60 space-y-2">
                      <p className="flex justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        <span className="font-bold text-emerald-900">দলিল নম্বর (Deed No):</span>
                        <span className="font-bold text-emerald-700 font-mono">{customer.deedNo || 'N/A'}</span>
                      </p>
                      <p className="flex justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        <span className="font-bold text-emerald-900">দলিল তারিখ (Date):</span>
                        <span className="font-bold text-emerald-700 font-mono">{customer.deedDate || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Handover Note Section if exists */}
                {customer.registrationNote && (
                  <div className="bg-white p-5 border border-natural-border rounded-2xl text-xs space-y-2 leading-relaxed">
                    <h4 className="font-bold text-natural-text border-b border-natural-border/60 pb-1 font-serif text-xs">৩. হ্যান্ডওভার রেজিস্ট্রি নোট (Handover Registry Note)</h4>
                    <p className="text-natural-text whitespace-pre-line text-xs font-serif italic text-justify">
                      {customer.registrationNote}
                    </p>
                  </div>
                )}

                {/* Official Declaration Note */}
                <div className="text-[10px] text-natural-muted bg-natural-sidebar/20 p-4 border border-natural-border rounded-xl leading-relaxed text-justify">
                  <p className="font-bold text-natural-text mb-1">ঘোষণা / Official Declaration:</p>
                  <p>
                    এ.আর. প্রোপার্টিজ অ্যান্ড ডেভেলপারস-এর পক্ষ থেকে প্রত্যয়ন করা যাচ্ছে যে, উপরোক্ত গ্রাহকের বরাদ্দকৃত প্লটের সম্পূর্ণ মূল্য
                    পরিশোধ সাপেক্ষে যথানিয়মে কবালা দলিল রেজিস্ট্রি ও হস্তান্তর প্রক্রিয়া সফলভাবে সম্পন্ন হয়েছে। কোম্পানিতে গ্রাহকের কোনো দেনা-পাওনা অবশিষ্ট নেই।
                  </p>
                </div>

                {/* Signatures */}
                <div className="pt-16 flex justify-between items-end">
                  <div className="space-y-1 text-center font-serif min-w-[200px]">
                    <p className="text-xs font-semibold font-sans text-natural-muted text-center mb-16">গ্রাহকের স্বাক্ষর / Customer:</p>
                    <div className="border-t border-natural-border/60 pt-2">
                      <p className="font-bold text-natural-text text-xs">{getLocalizedValue(customer.name)}</p>
                      <p className="text-[10px] text-natural-muted font-medium">প্লট গ্রহীতা</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-center font-serif min-w-[240px]">
                    <p className="text-xs font-semibold font-sans text-natural-muted text-center mb-16">কর্তৃপক্ষের স্বাক্ষর / Authorized Signatory:</p>
                    <div className="border-t border-natural-border/60 pt-2">
                      <p className="font-bold text-natural-text text-xs">S.M. Mahfuzul Karim Milon</p>
                      <p className="text-[10px] text-natural-muted font-medium">(Managing Director)</p>
                      <p className="font-bold text-natural-primary text-[10px] mt-0.5">A.R. Properties and Developers</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            </div> {/* End of Inner Content Area */}

            {/* A4 Footer Branding info */}
            {!usePrePrintedPad && (
              <div className="absolute bottom-8 left-12 right-12 text-center border-t border-natural-border pt-4 text-[9px] text-natural-muted leading-normal flex justify-between items-center">
                <p>সংরক্ষিত ও কম্পিউটার জেনারেটেড রিপোর্ট। স্বাক্ষর ছাড়া শুধুমাত্র মূল মানি রিসিট ছাড়া অন্য কোনো দাবী আইনত গ্রহণযোগ্য নয়।</p>
                <p className="font-mono">Page 1 of 1</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
