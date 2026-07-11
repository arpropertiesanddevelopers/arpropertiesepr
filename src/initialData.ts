import { Customer, Payment, CompanySettings, Project } from './types';

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'সবুজ অরণ্য আবাসন (Green Forest Housing)',
    address: 'সেক্টর ১৫, উত্তরা, ঢাকা (Sector 15, Uttara, Dhaka)',
  },
  {
    id: 'proj-2',
    name: 'পূর্বাচল ভ্যালি (Purbachal Valley)',
    address: 'পূর্বাচল কাঞ্চন ব্রিজ সংলগ্ন, ঢাকা (Purbachal Kanchan Bridge, Dhaka)',
  },
  {
    id: 'proj-3',
    name: 'মেঘনা লাক্সারি সিটি (Meghna Luxury City)',
    address: 'সোনারগাঁও, নারায়ণগঞ্জ (Sonargaon, Narayanganj)',
  }
];

export const initialCustomers: Customer[] = [
  {
    id: '1',
    customerId: 'AR-101',
    name: 'মো: আব্দুর রহমান (Abdur Rahman)',
    mobile: '01712345678',
    nid: '19902692512345678',
    projectName: 'সবুজ অরণ্য আবাসন (Green Forest Housing)',
    projectAddress: 'সেক্টর ১৫, উত্তরা, ঢাকা (Sector 15, Uttara, Dhaka)',
    plotNo: 'বি-৪৫ (B-45)',
    plotSize: 5.5,
    pricePerDecimal: 800000,
    totalPrice: 4400000,
    createdAt: '2026-01-10',
  },
  {
    id: '2',
    customerId: 'AR-102',
    name: 'মোছাম্মৎ শারমিন আক্তার (Sharmin Akter)',
    mobile: '01911223344',
    nid: '19882692512344321',
    projectName: 'পূর্বাচল ভ্যালি (Purbachal Valley)',
    projectAddress: 'পূর্বাচল কাঞ্চন ব্রিজ সংলগ্ন, ঢাকা (Purbachal Kanchan Bridge, Dhaka)',
    plotNo: 'ডি-১১২ (D-112)',
    plotSize: 4,
    pricePerDecimal: 650000,
    totalPrice: 2600000,
    createdAt: '2026-02-15',
  },
  {
    id: '3',
    customerId: 'AR-103',
    name: 'কামরুল হাসান চৌধুরী (Kamrul Hasan)',
    mobile: '01555667788',
    nid: '19952692512349999',
    projectName: 'মেঘনা লাক্সারি সিটি (Meghna Luxury City)',
    projectAddress: 'সোনারগাঁও, নারায়ণগঞ্জ (Sonargaon, Narayanganj)',
    plotNo: 'এ-২৪ (A-24)',
    plotSize: 6,
    pricePerDecimal: 500000,
    totalPrice: 3000000,
    createdAt: '2026-03-01',
  }
];

export const initialPayments: Payment[] = [
  // Payments for AR-101
  {
    id: 'p1',
    customerId: 'AR-101',
    amount: 500000,
    date: '2026-01-10',
    type: 'Booking',
    receiptNo: 'REC-1001',
    paymentMethod: 'Cash',
    remarks: 'বুকিং মানি পরিশোধ (Booking payment)',
  },
  {
    id: 'p2',
    customerId: 'AR-101',
    amount: 1000000,
    date: '2026-03-10',
    type: 'Down Payment',
    receiptNo: 'REC-1005',
    paymentMethod: 'Bank',
    remarks: 'ডাউন পেমেন্ট পরিশোধ (Down payment)',
  },
  {
    id: 'p3',
    customerId: 'AR-101',
    amount: 250000,
    date: '2026-04-12',
    type: 'Installment',
    receiptNo: 'REC-1012',
    paymentMethod: 'Bank',
    remarks: '১ম কিস্তি পরিশোধ (1st Installment)',
  },
  {
    id: 'p4',
    customerId: 'AR-101',
    amount: 250000,
    date: '2026-05-15',
    type: 'Installment',
    receiptNo: 'REC-1019',
    paymentMethod: 'Mobile Banking',
    remarks: '২য় কিস্তি পরিশোধ (2nd Installment)',
  },

  // Payments for AR-102
  {
    id: 'p5',
    customerId: 'AR-102',
    amount: 300000,
    date: '2026-02-15',
    type: 'Booking',
    receiptNo: 'REC-1002',
    paymentMethod: 'Cheque',
    remarks: 'বুকিং পেমেন্ট (Booking)',
  },
  {
    id: 'p6',
    customerId: 'AR-102',
    amount: 500000,
    date: '2026-03-20',
    type: 'Down Payment',
    receiptNo: 'REC-1008',
    paymentMethod: 'Bank',
    remarks: 'ডাউন পেমেন্ট পরিশোধ',
  },
  {
    id: 'p7',
    customerId: 'AR-102',
    amount: 150000,
    date: '2026-05-01',
    type: 'Installment',
    receiptNo: 'REC-1015',
    paymentMethod: 'Cash',
    remarks: '১ম কিস্তি',
  }
];

export const defaultCompanySettings: CompanySettings = {
  name: 'এ আর প্রোপার্টিজ অ্যান্ড ডেভেলপারস (AR Properties & Developers)',
  slogan: 'আপনার নির্ভরযোগ্য আবাসন অংশীদার (Your Reliable Housing Partner)',
  address: 'বাড়ি নং-১২, রোড নং-০৪, সেক্টর-০৯, উত্তরা মডেল টাউন, ঢাকা-১২৩০',
  phone: '০১৭৭৭-৪৪৫৫৬৬, ০২৯৮৭৬৫৪৩',
  email: 'arpropertiesanddevelopers@gmail.com',
  website: 'www.arproperties.com.bd',
  bankDetails: 'ডাচ-বাংলা ব্যাংক পিএলসি, উত্তরা শাখা, হিসাব নং: ১২৩.১০৫.৪৫৬৭৮ (Dutch-Bangla Bank PLC, Uttara Branch, A/C: 123.105.45678)',
  themeColor: 'natural',
  scrollingNotice: 'আসসালামু আলাইকুম, এ আর প্রোপার্টিজ অ্যান্ড ডেভেলপারস-এর ইআরপি সিস্টেমে আপনাকে স্বাগতম। আধুনিক আবাসন গড়তে আমরা সর্বদাই আপনার পাশে আছি। যেকোনো তথ্যের জন্য আমাদের সাথে যোগাযোগ করুন।',
  enableScrollingNotice: true,
};
