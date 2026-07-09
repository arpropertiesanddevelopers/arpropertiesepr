import React, { useState, useEffect } from 'react';
import { Customer, Payment, Project, PaymentMethod } from '../types';
import { formatCurrency, generateCustomerId, exportToCSV } from '../utils';
import { Plus, Search, Edit2, Trash2, X, Save, AlertTriangle, Eye, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface CustomerCRUDProps {
  customers: Customer[];
  payments: Payment[];
  projects: Project[];
  onAddCustomer: (customer: Customer, initialPayment?: Payment) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onNavigateToCustomerSearch: (customerId: string) => void;
}

export default function CustomerCRUD({
  customers,
  payments,
  projects,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onNavigateToCustomerSearch
}: CustomerCRUDProps) {
  // Lists and Search Filter
  const [filterQuery, setFilterQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [currentId, setCurrentId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [nid, setNid] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [plotNo, setPlotNo] = useState('');
  const [plotSize, setPlotSize] = useState<number>(0);
  const [pricePerDecimal, setPricePerDecimal] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [registrationNote, setRegistrationNote] = useState('');
  const [deedNo, setDeedNo] = useState('');
  const [deedDate, setDeedDate] = useState('');

  // Booking payment states (Only for new customer)
  const [bookingAmount, setBookingAmount] = useState<number>(0);
  const [bookingReceiptNo, setBookingReceiptNo] = useState('');
  const [bookingMethod, setBookingMethod] = useState<PaymentMethod>('Cash');
  const [bookingRemarks, setBookingRemarks] = useState('বুকিং পেমেন্ট (Booking Payment)');

  // Sync total price when plotSize or pricePerDecimal changes
  useEffect(() => {
    setTotalPrice(plotSize * pricePerDecimal);
  }, [plotSize, pricePerDecimal]);

  // Sync customer list filter
  useEffect(() => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) {
      setFilteredCustomers(customers);
      return;
    }
    setFilteredCustomers(
      customers.filter(
        c => c.name.toLowerCase().includes(q) ||
             c.customerId.toLowerCase().includes(q) ||
             c.mobile.includes(q) ||
             c.projectName.toLowerCase().includes(q)
      )
    );
  }, [filterQuery, customers]);

  const handleExportCustomers = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Mobile',
      'NID',
      'Project Name',
      'Plot No',
      'Plot Size (Decimal)',
      'Price Per Decimal',
      'Total Price',
      'Deed No',
      'Deed Date',
      'Total Paid (Tk)',
      'Total Due (Tk)'
    ];

    const rows = filteredCustomers.map(c => {
      const custPayments = payments.filter(p => p.customerId === c.customerId);
      const totalPaid = custPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalDue = Math.max(0, c.totalPrice - totalPaid);

      return [
        c.customerId,
        c.name,
        c.mobile,
        c.nid,
        c.projectName,
        c.plotNo,
        c.plotSize,
        c.pricePerDecimal,
        c.totalPrice,
        c.deedNo || 'N/A',
        c.deedDate || 'N/A',
        totalPaid,
        totalDue
      ];
    });

    exportToCSV(headers, rows, 'Customer_List_AR_Properties');
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const existingIds = customers.map(c => c.customerId);
    const newId = generateCustomerId(existingIds);
    setCustomerId(newId);
    setName('');
    setMobile('');
    setNid('');
    setProjectName(projects[0]?.name || '');
    setProjectAddress(projects[0]?.address || '');
    setPlotNo('');
    setPlotSize(0);
    setPricePerDecimal(0);
    setTotalPrice(0);
    setRegistrationNote('');
    setDeedNo('');
    setDeedDate('');
    // Reset booking states
    setBookingAmount(0);
    setBookingReceiptNo('REC-' + Math.floor(1000 + Math.random() * 9000));
    setBookingMethod('Cash');
    setBookingRemarks('বুকিং পেমেন্ট (Booking Payment)');
    setIsAddModalOpen(true);
  };

  // Submit Add Customer
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !nid.trim() || plotSize <= 0 || pricePerDecimal <= 0) {
      alert('অনুগ্রহ করে সকল তারকাচিহ্নিত (*) তথ্য প্রদান করুন!');
      return;
    }

    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      customerId,
      name: name.trim(),
      mobile: mobile.trim(),
      nid: nid.trim(),
      projectName,
      projectAddress,
      plotNo: plotNo.trim(),
      plotSize,
      pricePerDecimal,
      totalPrice: totalPrice || (plotSize * pricePerDecimal),
      createdAt: new Date().toISOString().split('T')[0],
      registrationNote: registrationNote.trim() || undefined,
      deedNo: deedNo.trim() || undefined,
      deedDate: deedDate.trim() || undefined
    };

    let bookingPay: Payment | undefined = undefined;
    if (bookingAmount > 0) {
      bookingPay = {
        id: 'p-' + Date.now(),
        customerId: customerId,
        amount: bookingAmount,
        date: new Date().toISOString().split('T')[0],
        type: 'Booking',
        receiptNo: bookingReceiptNo || ('REC-' + Math.floor(1000 + Math.random() * 9000)),
        paymentMethod: bookingMethod,
        remarks: bookingRemarks.trim() || undefined
      };
    }

    onAddCustomer(newCust, bookingPay);
    setIsAddModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cust: Customer) => {
    setCurrentId(cust.id);
    setCustomerId(cust.customerId);
    setName(cust.name);
    setMobile(cust.mobile);
    setNid(cust.nid);
    setProjectName(cust.projectName);
    setProjectAddress(cust.projectAddress);
    setPlotNo(cust.plotNo);
    setPlotSize(cust.plotSize);
    setPricePerDecimal(cust.pricePerDecimal);
    setTotalPrice(cust.totalPrice);
    setRegistrationNote(cust.registrationNote || '');
    setDeedNo(cust.deedNo || '');
    setDeedDate(cust.deedDate || '');
    setIsEditModalOpen(true);
  };

  // Submit Edit Customer
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !nid.trim() || plotSize <= 0 || pricePerDecimal <= 0) {
      alert('অনুগ্রহ করে সকল তারকাচিহ্নিত (*) তথ্য প্রদান করুন!');
      return;
    }

    const updatedCust: Customer = {
      id: currentId,
      customerId,
      name: name.trim(),
      mobile: mobile.trim(),
      nid: nid.trim(),
      projectName,
      projectAddress,
      plotNo: plotNo.trim(),
      plotSize,
      pricePerDecimal,
      totalPrice: totalPrice,
      createdAt: customers.find(c => c.id === currentId)?.createdAt || new Date().toISOString().split('T')[0],
      registrationNote: registrationNote.trim() || undefined,
      deedNo: deedNo.trim() || undefined,
      deedDate: deedDate.trim() || undefined
    };

    onEditCustomer(updatedCust);
    setIsEditModalOpen(false);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (cust: Customer) => {
    setCurrentId(cust.id);
    setCustomerId(cust.customerId);
    setName(cust.name);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Customer
  const handleDeleteConfirm = () => {
    onDeleteCustomer(currentId);
    setIsDeleteModalOpen(false);
  };

  // Calculate customer total paid
  const getCustomerStats = (cId: string, totalVal: number) => {
    const custPayments = payments.filter(p => p.customerId === cId);
    const paid = custPayments.reduce((s, p) => {
      if (p.type === 'Withdraw' || p.type === 'PLOT Cancel') {
        return s - p.amount;
      }
      return s + p.amount;
    }, 0);
    const due = Math.max(0, totalVal - paid);
    return { paid, due };
  };

  // Calculate total paid for active editing customer
  const editingCustomerPayments = payments.filter(p => p.customerId === customerId);
  const editingTotalPaid = editingCustomerPayments.reduce((s, p) => {
    if (p.type === 'Withdraw' || p.type === 'PLOT Cancel') {
      return s - p.amount;
    }
    return s + p.amount;
  }, 0);
  const isEditingPaymentComplete = editingTotalPaid >= totalPrice && totalPrice > 0;

  return (
    <div className="space-y-6">
      
      {/* Title & Add Action */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-natural-text">গ্রাহক ব্যবস্থাপনা (Customer Management)</h2>
          <p className="text-xs text-natural-muted mt-1">সব কাস্টমারদের প্রোফাইল ডাটাবেজ, প্লট বিবরণ এবং বকেয়া ট্র্যাকিং করুন।</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          নতুন গ্রাহক যুক্ত করুন
        </button>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-3xl border border-natural-border shadow-sm overflow-hidden">
        
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-natural-border bg-natural-sidebar flex items-center flex-wrap gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted" />
            <input
              type="text"
              placeholder="আইডি, নাম, মোবাইল বা প্রকল্প দিয়ে ফিল্টার করুন..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-natural-border focus:border-natural-primary rounded-lg text-xs outline-none transition-all font-medium text-natural-text placeholder:text-natural-muted"
            />
          </div>
          <button
            onClick={handleExportCustomers}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel এ ডাউনলোড করুন (Export Customers)
          </button>
          <span className="text-xs text-natural-muted font-semibold ml-auto font-sans">
            মোট ফলাফল: {filteredCustomers.length} জন
          </span>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-natural-sidebar text-natural-muted font-bold uppercase tracking-wider text-[10px] border-b border-natural-border">
                <th className="p-4">গ্রাহক আইডি (ID)</th>
                <th className="p-4">গ্রাহকের বিবরণ (Customer Details)</th>
                <th className="p-4">বরাদ্দকৃত প্লট বিবরণ (Plot Details)</th>
                <th className="p-4 text-right">মোট চুক্তি মূল্য (Total Contract)</th>
                <th className="p-4 text-right">আদায়কৃত (Collected)</th>
                <th className="p-4 text-right">বকেয়া (Remaining Due)</th>
                <th className="p-4 text-center">অ্যাকশন (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-sidebar">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(c => {
                  const stats = getCustomerStats(c.customerId, c.totalPrice);
                  return (
                    <tr key={c.id} className="hover:bg-natural-sidebar/30 transition-colors">
                      <td className="p-4">
                        <span className="bg-natural-sidebar text-natural-text font-bold font-mono px-2.5 py-1 rounded border border-natural-border">
                          {c.customerId}
                        </span>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-natural-text text-sm leading-tight">{c.name}</p>
                          {c.deedNo && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md border border-emerald-200/60 font-sans">
                              দলিল নং: {c.deedNo}
                            </span>
                          )}
                        </div>
                        <p className="text-natural-muted font-mono text-[11px] flex items-center gap-1">
                          মোবাইল: <span className="text-natural-text font-bold">{c.mobile}</span>
                        </p>
                        <p className="text-[10px] text-natural-muted font-mono">NID: {c.nid}</p>
                      </td>
                      <td className="p-4 space-y-1">
                        <p className="font-bold text-natural-text leading-tight truncate max-w-[200px]" title={c.projectName}>
                          {c.projectName.split(' (')[0]}
                        </p>
                        <p className="text-[10px] text-natural-muted">
                          প্লট নং: <span className="font-bold text-natural-text">{c.plotNo}</span> | আকার: <span className="font-bold text-natural-text">{c.plotSize} শতক</span>
                        </p>
                      </td>
                      <td className="p-4 text-right font-serif font-bold text-natural-text">
                        ৳ {formatCurrency(c.totalPrice)}
                      </td>
                      <td className="p-4 text-right font-serif font-bold text-natural-primary">
                        ৳ {formatCurrency(stats.paid)}
                      </td>
                      <td className="p-4 text-right font-serif font-bold text-red-700">
                        ৳ {formatCurrency(stats.due)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => onNavigateToCustomerSearch(c.customerId)}
                            className="bg-natural-sidebar hover:bg-[#EBE7E0]/60 text-natural-primary p-2 rounded-lg border border-natural-border transition-all cursor-pointer"
                            title="কালেকশন স্ক্রিনে যান"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="bg-natural-sidebar hover:bg-[#EBE7E0]/60 text-natural-text p-2 rounded-lg border border-natural-border transition-all cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(c)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-lg border border-rose-200 transition-all cursor-pointer"
                            title="ডিলিট করুন"
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
                  <td colSpan={7} className="p-12 text-center text-natural-muted font-medium">
                    কোনো গ্রাহকের বিবরণ মেলেনি। আপনি "নতুন গ্রাহক যুক্ত করুন" এ ক্লিক করে নতুন প্রোফাইল তৈরি করতে পারেন।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================== */}
      {/* ADD CUSTOMER MODAL             */}
      {/* ============================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-natural-text/40 backdrop-blur-sm z-50 overflow-y-auto flex justify-center items-center py-10 px-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full border border-natural-border overflow-hidden">
            <div className="bg-natural-sidebar border-b border-natural-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-serif font-bold text-natural-text">নতুন গ্রাহক নিবন্ধন ফরম (Add Customer)</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-natural-muted hover:text-natural-text p-1.5 rounded-lg hover:bg-natural-sidebar transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                
                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">গ্রাহক আইডি (Customer ID) *</label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-natural-sidebar border border-natural-border focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">গ্রাহকের নাম (Customer Name) *</label>
                  <input
                    type="text"
                    placeholder="নাম লিখুন..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">মোবাইল নাম্বার (Mobile Number) *</label>
                  <input
                    type="tel"
                    placeholder="017xxxxxxxx"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">জাতীয় পরিচয়পত্র (NID) *</label>
                  <input
                    type="text"
                    placeholder="১৭ বা ১০ সংখ্যার এনআইডি লিখুন..."
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono"
                    required
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-natural-muted font-bold">প্রকল্পের নাম (Project Name) *</label>
                  <select
                    value={projectName}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setProjectName(selectedVal);
                      const matched = projects.find(p => p.name === selectedVal);
                      if (matched) {
                        setProjectAddress(matched.address);
                      }
                    }}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-natural-muted font-bold">প্রকল্পের ঠিকানা (Project Address)</label>
                  <input
                    type="text"
                    value={projectAddress}
                    onChange={(e) => setProjectAddress(e.target.value)}
                    className="w-full bg-natural-sidebar border border-natural-border focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-muted"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">প্লট নম্বর (Plot No)</label>
                  <input
                    type="text"
                    placeholder="যেমন: বি-৪৫ (B-45)"
                    value={plotNo}
                    onChange={(e) => setPlotNo(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">প্লটের আকার / শতাংশ (Plot Size in Decimal) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="যেমন: ৫.৫"
                    value={plotSize || ''}
                    onChange={(e) => setPlotSize(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">প্রতি শতাংশ মূল্য / Price Per Decimal *</label>
                  <input
                    type="number"
                    placeholder="যেমন: ৮০০০০০"
                    value={pricePerDecimal || ''}
                    onChange={(e) => setPricePerDecimal(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">মোট মূল্য / Total Price (Auto Calculated)</label>
                  <input
                    type="number"
                    placeholder="স্বয়ংক্রিয় হিসাব..."
                    value={totalPrice || ''}
                    onChange={(e) => setTotalPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-natural-sidebar border border-natural-border rounded-xl px-3 py-2.5 outline-none text-natural-primary font-bold font-serif"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-natural-muted font-bold">রেজিস্ট্রিকৃত নোট / Handover Registry Note (ঐচ্ছিক)</label>
                    <button
                      type="button"
                      onClick={() => setRegistrationNote(`I the below undersigned on behalf of A.R. Properties and Developers in here by received all payment and handed over the plot at ${new Date().toLocaleDateString('en-GB')} with 7172/${new Date().getFullYear()} no. Kabala Registry Deed. Thanks for being with us, wish you all the best.`)}
                      className="text-[10px] text-natural-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      + রেজিস্ট্রি ডেমো নোট লোড করুন
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="পেমেন্ট সম্পূর্ণ হলে এবং রেজিস্ট্রি দলিল সম্পন্ন হলে কাস্টমারকে দেওয়ার জন্য হ্যান্ডওভার নোট এখানে লিখতে পারেন..."
                    value={registrationNote}
                    onChange={(e) => setRegistrationNote(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2 outline-none focus:border-natural-primary text-natural-text text-xs leading-relaxed"
                  />
                </div>

              </div>

              {/* Booking Payment Options (Only for new customer registration) */}
              <div className="mt-6 border-t border-natural-border pt-4 space-y-4">
                <div className="bg-natural-sidebar/50 p-4 rounded-2xl border border-natural-border/60">
                  <h4 className="text-xs font-bold text-natural-text font-serif flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-natural-primary inline-block"></span>
                    বুকিং পেমেন্ট বিবরণী / Booking Payment (ঐচ্ছিক)
                  </h4>
                  <p className="text-[10px] text-natural-muted leading-relaxed mb-4">
                    নতুন কাস্টমার এড করার সময় এখানে বুকিং পেমেন্ট এন্ট্রি করুন। এটি স্বয়ংক্রিয়ভাবে একটি বুকিং পেমেন্ট ভাউচার তৈরি করবে।
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-natural-muted font-bold">বুকিং মানি পরিমাণ / Booking Amount</label>
                      <input
                        type="number"
                        placeholder="৳ ০.০০"
                        value={bookingAmount || ''}
                        onChange={(e) => setBookingAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full border border-natural-border bg-white rounded-xl px-3 py-2 outline-none focus:border-natural-primary font-serif font-bold text-natural-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-natural-muted font-bold">রশিদ নম্বর / Receipt No</label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={bookingReceiptNo}
                          onChange={(e) => setBookingReceiptNo(e.target.value)}
                          className="flex-1 border border-natural-border bg-white rounded-xl px-3 py-2 outline-none focus:border-natural-primary font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setBookingReceiptNo('REC-' + Math.floor(1000 + Math.random() * 9000))}
                          className="p-2 bg-natural-sidebar hover:bg-[#EBE7E0]/60 text-natural-text rounded-xl border border-natural-border flex items-center justify-center"
                          title="রশিদ নং জেনারেট করুন"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-natural-muted font-bold">পেমেন্ট মাধ্যম / Method</label>
                      <select
                        value={bookingMethod}
                        onChange={(e) => setBookingMethod(e.target.value as PaymentMethod)}
                        className="w-full border border-natural-border bg-white rounded-xl px-3 py-2 outline-none focus:border-natural-primary text-natural-text"
                      >
                        <option value="Cash">Cash (নগদ)</option>
                        <option value="Bank">Bank Deposit</option>
                        <option value="Cheque">Cheque (চেক)</option>
                        <option value="Mobile Banking">Mobile Banking</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-natural-muted font-bold">মন্তব্য / Remarks</label>
                      <input
                        type="text"
                        value={bookingRemarks}
                        onChange={(e) => setBookingRemarks(e.target.value)}
                        className="w-full border border-natural-border bg-white rounded-xl px-3 py-2 outline-none focus:border-natural-primary text-natural-text font-normal"
                      />
                    </div>
                  </div>
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
                  গ্রাহক যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* EDIT CUSTOMER MODAL            */}
      {/* ============================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-natural-text/40 backdrop-blur-sm z-50 overflow-y-auto flex justify-center items-center py-10 px-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full border border-natural-border overflow-hidden">
            <div className="bg-natural-sidebar border-b border-natural-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-serif font-bold text-natural-text">গ্রাহক প্রোফাইল তথ্য সংশোধন (Edit Customer)</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-natural-muted hover:text-natural-text p-1.5 rounded-lg hover:bg-natural-sidebar transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                
                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">গ্রাহক আইডি (Customer ID)</label>
                  <input
                    type="text"
                    value={customerId}
                    disabled
                    className="w-full bg-natural-sidebar border border-natural-border rounded-xl px-3 py-2.5 outline-none text-natural-muted font-mono font-bold cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">গ্রাহকের নাম (Customer Name) *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">মোবাইল নাম্বার (Mobile Number) *</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">জাতীয় পরিচয়পত্র (NID) *</label>
                  <input
                    type="text"
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono"
                    required
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-natural-muted font-bold">প্রকল্পের নাম (Project Name) *</label>
                  <select
                    value={projectName}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setProjectName(selectedVal);
                      const matched = projects.find(p => p.name === selectedVal);
                      if (matched) {
                        setProjectAddress(matched.address);
                      }
                    }}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-natural-muted font-bold">প্রকল্পের ঠিকানা (Project Address)</label>
                  <input
                    type="text"
                    value={projectAddress}
                    onChange={(e) => setProjectAddress(e.target.value)}
                    className="w-full bg-natural-sidebar border border-natural-border focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-muted"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">প্লট নম্বর (Plot No)</label>
                  <input
                    type="text"
                    value={plotNo}
                    onChange={(e) => setPlotNo(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">প্লটের আকার / শতাংশ (Plot Size in Decimal) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={plotSize || ''}
                    onChange={(e) => setPlotSize(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">প্রতি শতাংশ মূল্য / Price Per Decimal *</label>
                  <input
                    type="number"
                    value={pricePerDecimal || ''}
                    onChange={(e) => setPricePerDecimal(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2.5 outline-none focus:border-natural-primary text-natural-text font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-natural-muted font-bold">মোট মূল্য / Total Price (Editable)</label>
                  <input
                    type="number"
                    value={totalPrice || ''}
                    onChange={(e) => setTotalPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-natural-sidebar border border-natural-border rounded-xl px-3 py-2.5 outline-none text-natural-primary font-bold font-serif"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-natural-muted font-bold">রেজিস্ট্রিকৃত নোট / Handover Registry Note (ঐচ্ছিক)</label>
                    <button
                      type="button"
                      onClick={() => setRegistrationNote(`I the below undersigned on behalf of A.R. Properties and Developers in here by received all payment and handed over the plot at ${new Date().toLocaleDateString('en-GB')} with 7172/${new Date().getFullYear()} no. Kabala Registry Deed. Thanks for being with us, wish you all the best.`)}
                      className="text-[10px] text-natural-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      + রেজিস্ট্রি ডেমো নোট লোড করুন
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="পেমেন্ট সম্পূর্ণ হলে এবং রেজিস্ট্রি দলিল সম্পন্ন হলে কাস্টমারকে দেওয়ার জন্য হ্যান্ডওভার নোট এখানে লিখতে পারেন..."
                    value={registrationNote}
                    onChange={(e) => setRegistrationNote(e.target.value)}
                    className="w-full border border-natural-border bg-natural-sidebar focus:bg-white rounded-xl px-3 py-2 outline-none focus:border-natural-primary text-natural-text text-xs leading-relaxed"
                  />
                </div>

                {/* Deed (দলিল) Entry Section - Appears when payments are complete or deed info is already present */}
                {(isEditingPaymentComplete || deedNo || deedDate) && (
                  <div className="space-y-4 border border-emerald-200 bg-emerald-50/40 p-4 rounded-2xl sm:col-span-2 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs">✓</span>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-800 font-serif">
                          দলিল রেজিস্ট্রেশন তথ্য / Deed Registration Info (পেমেন্ট সম্পন্ন)
                        </h4>
                        <p className="text-[10px] text-emerald-600">
                          এই গ্রাহকের পেমেন্ট সম্পূর্ণ পরিশোধিত হয়েছে। দয়া করে দলিলের তথ্য প্রদান করুন।
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-emerald-700 text-xs font-bold">দলিল নাম্বার / Deed No</label>
                        <input
                          type="text"
                          placeholder="যেমন: ৩২৪৫/২০২৬"
                          value={deedNo}
                          onChange={(e) => setDeedNo(e.target.value)}
                          className="w-full border border-emerald-200 bg-white focus:bg-white rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-natural-text text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-emerald-700 text-xs font-bold">দলিল তারিখ / Registry Date</label>
                        <input
                          type="date"
                          value={deedDate}
                          onChange={(e) => setDeedDate(e.target.value)}
                          className="w-full border border-emerald-200 bg-white focus:bg-white rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-natural-text text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                  তথ্য সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* DELETE CUSTOMER MODAL          */}
      {/* ============================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-natural-text/40 backdrop-blur-sm z-50 overflow-y-auto flex justify-center items-center px-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-natural-border overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-natural-text font-serif">গ্রাহক প্রোফাইল ডিলিট নিশ্চিত করুন!</h3>
                <p className="text-xs text-natural-muted leading-relaxed">
                  আপনি কি সত্যিই গ্রাহক <span className="font-bold text-natural-text">"{name}"</span> ({customerId}) এর সম্পূর্ণ তথ্য ডিলিট করতে চান? ডিলিট করার পর এই কাস্টমার প্রোফাইল এবং তাদের সমস্ত পেমেন্ট রেকর্ড স্থায়ীভাবে মুছে যাবে।
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 bg-natural-sidebar hover:bg-[#EBE7E0]/60 text-natural-text font-bold text-xs py-2.5 rounded-xl cursor-pointer"
                >
                  না, ফিরে যান
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
