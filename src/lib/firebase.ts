import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Customer, Payment, Project, CompanySettings } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auto sign-in on startup to ensure we can read/write securely, but fail gracefully
export const ensureAuthenticated = async () => {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      // Log as warning rather than strict error since we have public rules as fallback
      console.warn('Optional anonymous sign-in could not be completed, using direct fallback access:', err);
    }
  }
};

// Customer operations
export async function getCustomersFromDB(): Promise<Customer[]> {
  await ensureAuthenticated();
  const path = 'customers';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const list: Customer[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Customer);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveCustomerToDB(customer: Customer): Promise<void> {
  await ensureAuthenticated();
  const path = `customers/${customer.id}`;
  try {
    await setDoc(doc(db, 'customers', customer.id), customer);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomerFromDB(id: string): Promise<void> {
  await ensureAuthenticated();
  const path = `customers/${id}`;
  try {
    await deleteDoc(doc(db, 'customers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Payment operations
export async function getPaymentsFromDB(): Promise<Payment[]> {
  await ensureAuthenticated();
  const path = 'payments';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const list: Payment[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Payment);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function savePaymentToDB(payment: Payment): Promise<void> {
  await ensureAuthenticated();
  const path = `payments/${payment.id}`;
  try {
    await setDoc(doc(db, 'payments', payment.id), payment);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePaymentFromDB(id: string): Promise<void> {
  await ensureAuthenticated();
  const path = `payments/${id}`;
  try {
    await deleteDoc(doc(db, 'payments', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Project operations
export async function getProjectsFromDB(): Promise<Project[]> {
  await ensureAuthenticated();
  const path = 'projects';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const list: Project[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Project);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveProjectToDB(project: Project): Promise<void> {
  await ensureAuthenticated();
  const path = `projects/${project.id}`;
  try {
    await setDoc(doc(db, 'projects', project.id), project);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProjectFromDB(id: string): Promise<void> {
  await ensureAuthenticated();
  const path = `projects/${id}`;
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Settings operations
export async function getSettingsFromDB(): Promise<CompanySettings | null> {
  await ensureAuthenticated();
  const path = 'settings';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as CompanySettings;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
}

export async function saveSettingsToDB(settings: CompanySettings): Promise<void> {
  await ensureAuthenticated();
  const path = 'settings/default';
  try {
    await setDoc(doc(db, 'settings', 'default'), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
