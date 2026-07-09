import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Customer, Payment } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Drive File and Google Sheets scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize Auth State Listener
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If logged in but no token cached, we can prompt or wait
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Google Sign In Flow
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Logout
 */
export const logoutUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Get Cached Access Token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Search Google Drive for an existing spreadsheet named 'A.R. Properties - Ledger Sync'
 */
async function findExistingSpreadsheet(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent("name = 'A.R. Properties - Ledger Sync' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!response.ok) {
    throw new Error('গুগল ড্রাইভ সার্চ করতে ব্যর্থ হয়েছে');
  }
  
  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Create a new spreadsheet with the correct tabs
 */
async function createSpreadsheet(accessToken: string): Promise<string> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const body = {
    properties: {
      title: 'A.R. Properties - Ledger Sync'
    },
    sheets: [
      {
        properties: {
          title: 'গ্রাহক তালিকা (Customers)'
        }
      },
      {
        properties: {
          title: 'পেমেন্ট লেজার (Payments)'
        }
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error('নতুন গুগল স্প্রেডশিট তৈরি করতে ব্যর্থ হয়েছে');
  }

  const spreadsheet = await response.json();
  return spreadsheet.spreadsheetId;
}

/**
 * Sync entire customer and payment dataset to Google Sheets
 */
export async function syncToGoogleSheets(
  customers: Customer[],
  payments: Payment[],
  accessToken: string,
  onStatusUpdate?: (status: string) => void
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  onStatusUpdate?.('গুগল ড্রাইভে ফাইল খুঁজছে...');
  let spreadsheetId = await findExistingSpreadsheet(accessToken);
  
  if (!spreadsheetId) {
    onStatusUpdate?.('নতুন গুগল স্প্রেডশিট তৈরি করছে...');
    spreadsheetId = await createSpreadsheet(accessToken);
  } else {
    onStatusUpdate?.('বিদ্যমান গুগল স্প্রেডশিট পাওয়া গেছে...');
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 1. Prepare Customers data
  onStatusUpdate?.('গ্রাহক তালিকা ডেটা ফরম্যাট করছে...');
  const customerHeaders = [
    'গ্রাহক আইডি (Customer ID)',
    'নাম (Name)',
    'মোবাইল (Mobile)',
    'এনআইডি (NID)',
    'প্রজেক্টের নাম (Project Name)',
    'প্লট নম্বর (Plot No)',
    'প্লট সাইজ শতাংশ (Plot Size)',
    'মূল্য প্রতি শতাংশ (Price/Decimal)',
    'মোট মূল্য (Total Price)',
    'দলিল নম্বর (Deed No)',
    'দলিল তারিখ (Deed Date)',
    'দলিল নোট (Deed Note)',
    'মোট পরিশোধ (Total Paid)',
    'মোট বকেয়া (Total Due)'
  ];

  const customerRows = customers.map(c => {
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
      c.deedNo || '',
      c.deedDate || '',
      c.registrationNote || '',
      totalPaid,
      totalDue
    ];
  });

  const customerSheetData = [customerHeaders, ...customerRows];

  // 2. Prepare Payments data
  onStatusUpdate?.('পেমেন্ট লেজার ডেটা ফরম্যাট করছে...');
  const paymentHeaders = [
    'রসিদ নম্বর (Receipt No)',
    'গ্রাহক আইডি (Customer ID)',
    'গ্রাহকের নাম (Customer Name)',
    'তারিখ (Date)',
    'পেমেন্টের ধরন (Payment Type)',
    'পেমেন্ট পদ্ধতি (Payment Method)',
    'টাকা (Amount)',
    'মন্তব্য (Remarks)'
  ];

  const paymentRows = payments.map(p => {
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

  const paymentSheetData = [paymentHeaders, ...paymentRows];

  // Write to Customers sheet
  onStatusUpdate?.('গুগল শিটে গ্রাহক তালিকা আপডেট করছে...');
  
  // Clear old data first
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'গ্রাহক তালিকা (Customers)'!A1:Z10000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // Write new data
  const custWriteRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'গ্রাহক তালিকা (Customers)'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: "'গ্রাহক তালিকা (Customers)'!A1",
        majorDimension: 'ROWS',
        values: customerSheetData
      })
    }
  );

  if (!custWriteRes.ok) {
    throw new Error('গ্রাহক তালিকা আপডেট করতে ব্যর্থ হয়েছে');
  }

  // Write to Payments sheet
  onStatusUpdate?.('গুগল শিটে পেমেন্ট লেজার আপডেট করছে...');
  
  // Clear old data first
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'পেমেন্ট লেজার (Payments)'!A1:Z10000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // Write new data
  const payWriteRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'পেমেন্ট লেজার (Payments)'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: "'পেমেন্ট লেজার (Payments)'!A1",
        majorDimension: 'ROWS',
        values: paymentSheetData
      })
    }
  );

  if (!payWriteRes.ok) {
    throw new Error('পেমেন্ট লেজার আপডেট করতে ব্যর্থ হয়েছে');
  }

  onStatusUpdate?.('সফলভাবে গুগল শিটে সিঙ্ক সম্পন্ন হয়েছে!');
  return { spreadsheetId, spreadsheetUrl };
}
