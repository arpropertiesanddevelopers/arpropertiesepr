import React, { useState, useEffect } from 'react';
import { Customer, Payment, PaymentType, PaymentMethod } from '../types';
import { formatCurrency, exportToCSV } from '../utils';
import { Search, Edit2, Trash2, X, AlertTriangle, Printer, Plus, FileSpreadsheet } from 'lucide-react';

interface PaymentCRUDProps {
  payments: Payment[];
  customers: Customer[];
  onAddPayment: (payment: Payment) => void;
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (id: string) => void;
  onQuickPrint: (customer: Customer, docType: 'receipt' | 'acknowledgment' | 'schedule' | 'history' | 'deed', payment: Payment | null) => void;
}

export default function PaymentCRUD({
  payments,
  customers,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onQuickPrint
}: PaymentCRUDProps) {
  // Filters
  const [filterQuery, setFilterQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>(payments);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [currentId, setCurrentId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState('');
  const [type, setType] = useState<PaymentType>('Installment');
  const [receiptNo, setReceiptNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [remarks, setRemarks] = useState('');

  // Sync payments filter
  useEffect(() => {
    let list = [...payments];
    
    // Query filter
    const q = filterQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        p => p.receiptNo.toLowerCase().includes(q) ||
             p.customerId.toLowerCase().includes(q) ||
             (p.remarks && p.remarks.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (typeFilter !== 'All') {
      list = list.filter(p => p.type === typeFilter);
    }

    // Sort descending by date
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredPayments(list);
  }, [filterQuery, typeFilter, payments]);

  const handleExportPayments = () => {
    const headers = [
      'Receipt No',
      'Customer ID',
      'Customer Name',
      'Date',
      'Payment Type',
      'Payment Method',
      'Amount (Tk)',
      'Remarks'
    ];

    const rows = filteredPayments.map(p => {
      const cust = customers.find(c => c.customerId === p.customerId);
      return [
        p.receiptNo,
        p.customerId,
        cust ? cust.name : 'Unknown',
        p.date,
        p.type,
        p.paymentMethod,
        p.amount,
        p.remarks || ''
      ];
    });

    exportToCSV(headers, rows, 'Payment_Ledger_AR_Properties');
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    if (customers.length === 0) {
      alert('প্রথমে অনুগ্রহ করে একজন গ্রাহক নিবন্ধন করুন!');
      return;
    }
    setCustomerId(customers[0].customerId);
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setType('Installment');
    setReceiptNo('REC-' + Math.floor(1000 + Math.random() * 9000));
    setPaymentMethod('Cash');
    setRemarks('');
    setIsAddModalOpen(true);
  };

  // Submit Add Payment
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !date || !receiptNo) {
      alert('অনুগ্রহ করে সঠিক তথ্য প্রদান করুন!');
      return;
    }

    const newPay: Payment = {
      id: 'p-' + Date.now(),
      customerId,
      amount,
      date,
      type,
      receiptNo,
      paymentMethod,
      remarks: remarks.trim() || undefined
    };

    onAddPayment(newPay);
    setIsAddModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEditModal = (p: Payment) => {
    setCurrentId(p.id);
    setCustomerId(p.customerId);
    setAmount(p.amount);
    setDate(p.date);
    setType(p.type);
    setReceiptNo(p.receiptNo);
    setPaymentMethod(p.paymentMethod);
    setRemarks(p.remarks || '');
    setIsEditModalOpen(true);
  };

  // Submit Edit Payment
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !date || !receiptNo) {
      alert('অনুগ্রহ করে সঠিক তথ্য প্রদান করুন!');
      return;
    }

    const updatedPay: Payment = {
      id: currentId,
      customerId,
      amount,
      date,
      type,
      receiptNo,
      paymentMethod,
      remarks: remarks.trim() || undefined
    };

    onEditPayment(updatedPay);
    setIsEditModalOpen(false);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (p: Payment) => {
    setCurrentId(p.id);
    setReceiptNo(p.receiptNo);
    setAmount(p.amount);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = () => {
    onDeletePayment(currentId);
    setIsDeleteModalOpen(false);
  };

  const getCustomerName = (cId: string) => {
    const cust = customers.find(c => c.customerId === cId);
    return cust ? cust.name.split(' (')[0] : cId;
  };

  const getCustomerObj = (cId: string) => {
    return customers.find(c => c.customerId === cId);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-natural-text">পেমেন্ট কালেকশন রেকর্ড (Payment Records)</h2>
          <p className="text-xs text-natural-muted mt-1">সব পেমেন্টের ইতিহাস নিরীক্ষণ করুন, প্রয়োজনে রশিদ পুনঃমুদ্রণ অথবা পেমেন্ট এন্ট্রি সংশোধন করুন।</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          ম্যানুয়াল পেমেন্ট যোগ করুন
        </button>
      </div>

      {/* Filters and Table */}
      <div className="bg-white rounded-3xl border border-natural-border shadow-sm overflow-hidden">
        
        {/* Table Filter Area */}
        <div className="p-4 border-b border-natural-border bg-natural-sidebar flex items-center flex-wrap gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted" />
            <input
              type="text"
              placeholder="রশিদ নং বা কাস্টমার আইডি দিয়ে ফিল্টার করুন..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-natural-border focus:border-natural-primary rounded-lg text-xs outline-none transition-all font-medium text-natural-text placeholder:text-natural-muted"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-natural-text">
            <span className="text-[11px] uppercase tracking-wider text-natural-muted font-bold">পেমেন্ট ক্যাটাগরি:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-natural-border px-3 py-2 rounded-lg outline-none text-xs text-natural-text focus:border-natural-primary"
            >
              <option value="All">সব ক্যাটাগরি</option>
              <option value="Booking">বুকিং পেমেন্ট (Booking)</option>
              <option value="Previous Payment">পূর্ববর্তী পেমেন্ট (Previous)</option>
              <option value="Re-Payment">রি-পেমেন্ট (Re-Payment)</option>
              <option value="Total Payment">মোট পেমেন্ট (Total Payment)</option>
              <option value="Withdraw">উইথড্র (Withdraw)</option>
              <option value="PLOT Cancel">প্লট বাতিল (PLOT Cancel)</option>
              <option value="Down Payment">ডাউন পেমেন্ট</option>
              <option value="Installment">নিয়মিত কিস্তি</option>
              <option value="Others">অন্যান্য পেমেন্ট</option>
            </select>
          </div>

          <button
            onClick={handleExportPayments}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel এ ডাউনলোড (Export Payments)
          </button>

          <span className="text-xs text-natural-muted font-semibold ml-auto font-sans">
            মোট ট্রানজেকশন: {filteredPayments.length} টি
          </span>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-natural-sidebar text-natural-muted font-bold uppercase tracking-wider text-[10px] border-b border-natural-border">
                <th className="p-4">রশিদ নং (Receipt)</th>
                <th className="p-4">গ্রাহকের বিবরণ (Customer)</th>
                <th className="p-4">তারিখ (Date)</th>
                <th className="p-4">পেমেন্ট ধরণ (Type)</th>
                <th className="p-4">পেমেন্ট মাধ্যম (Method)</th>
                <th className="p-4">মন্তব্য (Remarks)</th>
                <th className="p-4 text-right">আদায়কৃত পরিমাণ (Amount)</th>
                <th className="p-4 text-center">অ্যাকশন (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-sidebar">
              {filteredPayments.length > 0 ? (
                filteredPayments.map(p => {
                  const custObj = getCustomerObj(p.customerId);
                  return (
                    <tr key={p.id} className="hover:bg-natural-sidebar/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-natural-primary">
                        {p.receiptNo}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-natural-text">{getCustomerName(p.customerId)}</p>
                        <p className="text-[10px] text-natural-muted font-mono mt-0.5">{p.customerId}</p>
                      </td>
                      <td className="p-4 text-natural-text font-mono">
                        {p.date}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.type === 'Booking' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                          p.type === 'Down Payment' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                          p.type === 'Installment' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                          p.type === 'Previous Payment' ? 'bg-cyan-50 text-cyan-800 border border-cyan-100' :
                          p.type === 'Re-Payment' ? 'bg-purple-50 text-purple-800 border border-purple-100' :
                          p.type === 'Total Payment' ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                          p.type === 'Withdraw' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                          p.type === 'PLOT Cancel' ? 'bg-red-100 text-red-900 border border-red-200' :
                          'bg-natural-sidebar text-natural-text border border-natural-border'
                        }`}>
                          {p.type === 'Booking' ? 'বুকিং' :
                           p.type === 'Down Payment' ? 'ডাউন পেমেন্ট' :
                           p.type === 'Installment' ? 'কিস্তি' :
                           p.type === 'Previous Payment' ? 'পূর্ববর্তী পেমেন্ট' :
                           p.type === 'Re-Payment' ? 'রি-পেমেন্ট' :
                           p.type === 'Total Payment' ? 'মোট পেমেন্ট' :
                           p.type === 'Withdraw' ? 'উইথড্র' :
                           p.type === 'PLOT Cancel' ? 'প্লট বাতিল' : 'অন্যান্য'}
                        </span>
                      </td>
                      <td className="p-4 text-natural-text">
                        <span className="font-bold bg-natural-sidebar px-2.5 py-0.5 rounded border border-natural-border text-natural-text text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-natural-muted truncate max-w-[150px]" title={p.remarks}>
                        {p.remarks || '-'}
                      </td>
                      <td className="p-4 text-right font-serif font-bold text-natural-text text-sm">
                        ৳ {formatCurrency(p.amount)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          {custObj && (
                            <button
                              onClick={() => onQuickPrint(custObj, 'acknowledgment', p)}
                              className="bg-natural-sidebar hover:bg-[#EBE7E0]/60 text-natural-primary p-2 rounded-lg border border-natural-border transition-all cursor-pointer"
                              title="অঙ্গীকারনামা ও পেমেন্ট স্লিপ প্রিন্ট"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="bg-natural-sidebar hover:bg-[#EBE7E0]/60 text-natural-text p-2 rounded-lg border border-natural-border transition-all cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(p)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-lg border border-rose-200 transition-all cursor-pointer"
                            title="ডিলিট পেমেন্ট"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-natural-muted font-medium">
                    কোনো পেমেন্ট বিবরণী মেলেনি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================== */}
      {/* ADD PAYMENT MODAL              */}
      {/* ============================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-natural-text/40 backdrop-blur-sm z-50 overflow-y-auto flex justify-center items-start py-6 sm:py-12 px-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-natural-border overflow-hidden my-auto">
            <div className="bg-natural-sidebar border-b border-natural-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-serif font-bold text-natural-text">পেমেন্ট এন্ট্রি ফরম (Add Payment)</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-natural-muted hover:text-natural-text p-1.5 rounded-lg hover:bg-natural-sidebar transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-4 text-xs font-semibold">
                
                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">গ্রাহক নির্বাচন করুন (Select Customer) *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-bold"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.customerId}>
                        {c.name.split(' (')[0]} ({c.customerId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">পেমেন্ট ধরণ (Type) *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as PaymentType)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                    >
                      <option value="Installment">কিস্তি (Installment)</option>
                      <option value="Booking">বুকিং (Booking)</option>
                      <option value="Re-Payment">রি-পেমেন্ট (Re-Payment)</option>
                      <option value="Withdraw">উইথড্র (Withdraw)</option>
                      <option value="PLOT Cancel">প্লট বাতিল (PLOT Cancel)</option>
                      <option value="Down Payment">ডাউন পেমেন্ট</option>
                      <option value="Others">অন্যান্য (Others)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">পেমেন্ট মাধ্যম *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                    >
                      <option value="Cash">Cash (নগদ)</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Cheque">Cheque (চেক)</option>
                      <option value="Mobile Banking">Mobile Banking</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">রশিদ নম্বর (Receipt No) *</label>
                    <input
                      type="text"
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">তারিখ (Date) *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">পেমেন্ট পরিমাণ / Amount (Tk) *</label>
                  <input
                    type="number"
                    placeholder="পেমেন্ট পরিমাণ লিখুন..."
                    value={amount || ''}
                    onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white focus:border-natural-primary rounded-xl px-3 py-2.5 outline-none font-bold font-serif text-natural-primary text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">মন্তব্য (Remarks)</label>
                  <input
                    type="text"
                    placeholder="যেমন: ৩য় কিস্তি পরিশোধ..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-natural-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-natural-sidebar hover:bg-[#EBE7E0]/60 text-natural-text font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow cursor-pointer"
                >
                  পেমেন্ট জমা করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* EDIT PAYMENT MODAL             */}
      {/* ============================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-natural-text/40 backdrop-blur-sm z-50 overflow-y-auto flex justify-center items-start py-6 sm:py-12 px-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-natural-border overflow-hidden my-auto">
            <div className="bg-natural-sidebar border-b border-natural-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-serif font-bold text-natural-text">পেমেন্ট রেকর্ড সংশোধন (Edit Payment)</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-natural-muted hover:text-natural-text p-1.5 rounded-lg hover:bg-natural-sidebar transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-4 text-xs font-semibold">
                
                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">গ্রাহকের আইডি (Customer ID)</label>
                  <input
                    type="text"
                    value={customerId}
                    disabled
                    className="w-full bg-natural-sidebar border border-natural-border rounded-xl px-3 py-2.5 outline-none text-natural-muted font-mono font-bold cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">পেমেন্ট ধরণ (Type) *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as PaymentType)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                    >
                      <option value="Installment">কিস্তি (Installment)</option>
                      <option value="Booking">বুকিং (Booking)</option>
                      <option value="Re-Payment">রি-পেমেন্ট (Re-Payment)</option>
                      <option value="Withdraw">উইথড্র (Withdraw)</option>
                      <option value="PLOT Cancel">প্লট বাতিল (PLOT Cancel)</option>
                      <option value="Down Payment">ডাউন পেমেন্ট</option>
                      <option value="Others">অন্যান্য (Others)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">পেমেন্ট মাধ্যম *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                    >
                      <option value="Cash">Cash (নগদ)</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Cheque">Cheque (চেক)</option>
                      <option value="Mobile Banking">Mobile Banking</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">রশিদ নম্বর (Receipt No) *</label>
                    <input
                      type="text"
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-natural-muted font-bold">তারিখ (Date) *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">পেমেন্ট পরিমাণ / Amount (Tk) *</label>
                  <input
                    type="number"
                    value={amount || ''}
                    onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white focus:border-natural-primary rounded-xl px-3 py-2.5 outline-none font-bold font-serif text-natural-primary text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">মন্তব্য (Remarks)</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-natural-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-natural-sidebar hover:bg-[#EBE7E0]/60 text-natural-text font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow cursor-pointer"
                >
                  সংশোধন সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* DELETE PAYMENT MODAL           */}
      {/* ============================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-natural-text/40 backdrop-blur-sm z-50 overflow-y-auto flex justify-center items-start py-6 sm:py-12 px-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-natural-border overflow-hidden my-auto">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-natural-text font-serif">পেমেন্ট রেকর্ড ডিলিট নিশ্চিতকরণ</h3>
                <p className="text-xs text-natural-muted leading-relaxed">
                  আপনি কি আসলেই রশিদ নম্বর <span className="font-bold text-natural-text">"{receiptNo}"</span> এর মোট <span className="font-bold text-natural-text">৳ {formatCurrency(amount)}/-</span> টাকার পেমেন্ট রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান? এটি মুছে ফেলার সাথে সাথে সংশ্লিষ্ট কাস্টমারের বকেয়ার পরিমাণ বেড়ে যাবে।
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 bg-natural-sidebar hover:bg-[#EBE7E0]/60 text-natural-text font-bold text-xs py-2.5 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer"
                >
                  হ্যাঁ, ডিলিট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
