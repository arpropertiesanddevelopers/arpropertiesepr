export interface Customer {
  id: string; // internal UUID
  customerId: string; // Business ID (e.g. AR-101)
  name: string;
  mobile: string;
  nid: string;
  projectName: string;
  projectAddress: string;
  plotNo: string;
  plotSize: number; // in decimals
  pricePerDecimal: number; // in Tk
  totalPrice: number; // Plot Size * Price Per Decimal (or manual)
  createdAt: string;
  registrationNote?: string; // custom handover / Kabala deed registry note
  deedNo?: string; // দলিল নম্বর
  deedDate?: string; // দলিল তারিখ
}

export type PaymentType = 'Booking' | 'Installment' | 'Down Payment' | 'Previous Payment' | 'Re-Payment' | 'Total Payment' | 'Withdraw' | 'PLOT Cancel' | 'Others';
export type PaymentMethod = 'Cash' | 'Bank' | 'Cheque' | 'Mobile Banking';

export interface Payment {
  id: string;
  customerId: string; // references Customer.customerId
  amount: number;
  date: string;
  type: PaymentType;
  receiptNo: string;
  paymentMethod: PaymentMethod;
  remarks?: string;
}

export interface CompanySettings {
  name: string;
  slogan: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  bankDetails: string;
  themeColor?: 'natural' | 'blue' | 'red' | 'green';
  scrollingNotice?: string;
  enableScrollingNotice?: boolean;
}

export interface Project {
  id: string;
  name: string;
  address: string;
}

export interface AppState {
  customers: Customer[];
  payments: Payment[];
  companySettings: CompanySettings;
  projects?: Project[];
}
