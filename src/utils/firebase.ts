import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch
} from 'firebase/firestore';
import { Member, MealLog, BazarExpense, Utility, Deposit } from '../types';
import { getSeedData } from './dataStore';

import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Collection References
const MEMBERS_COLL = 'members';
const MEAL_LOGS_COLL = 'mealLogs';
const BAZAR_EXP_COLL = 'bazarExpenses';
const UTILITIES_COLL = 'utilities';
const DEPOSITS_COLL = 'deposits';

// Error Handling Types & Helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Seeding Firestore if empty
export async function seedFirestoreIfEmpty() {
  try {
    const membersSnap = await getDocs(collection(db, MEMBERS_COLL)).catch(err => {
      handleFirestoreError(err, OperationType.GET, MEMBERS_COLL);
      throw err;
    });

    if (membersSnap.empty) {
      console.log("Firestore is empty. Seeding data...");
      const seed = getSeedData();
      const promises: Promise<void>[] = [];
      
      // Seed members
      for (const m of seed.members) {
        promises.push(
          setDoc(doc(db, MEMBERS_COLL, m.id), m).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `${MEMBERS_COLL}/${m.id}`);
          })
        );
      }
      // Seed meal logs
      for (const l of seed.mealLogs) {
        promises.push(
          setDoc(doc(db, MEAL_LOGS_COLL, l.id), l).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `${MEAL_LOGS_COLL}/${l.id}`);
          })
        );
      }
      // Seed bazar expenses
      for (const e of seed.bazarExpenses) {
        promises.push(
          setDoc(doc(db, BAZAR_EXP_COLL, e.id), e).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `${BAZAR_EXP_COLL}/${e.id}`);
          })
        );
      }
      // Seed utilities
      for (const u of seed.utilities) {
        promises.push(
          setDoc(doc(db, UTILITIES_COLL, u.id), u).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `${UTILITIES_COLL}/${u.id}`);
          })
        );
      }
      // Seed deposits
      for (const d of seed.deposits) {
        promises.push(
          setDoc(doc(db, DEPOSITS_COLL, d.id), d).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `${DEPOSITS_COLL}/${d.id}`);
          })
        );
      }
      
      await Promise.all(promises);
      console.log("Firestore seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding Firestore:", error);
    // Do not fail silently
    throw error;
  }
}

// Subscribe to all changes in real-time
export function subscribeToData(onUpdate: (data: {
  members: Member[];
  mealLogs: MealLog[];
  bazarExpenses: BazarExpense[];
  utilities: Utility[];
  deposits: Deposit[];
}) => void) {
  
  let members: Member[] = [];
  let mealLogs: MealLog[] = [];
  let bazarExpenses: BazarExpense[] = [];
  let utilities: Utility[] = [];
  let deposits: Deposit[] = [];

  const loadedCollections = new Set<string>();

  const triggerUpdate = (collName: string) => {
    loadedCollections.add(collName);
    
    // Only dispatch the state update once ALL 5 collections have emitted at least one snapshot.
    if (loadedCollections.size >= 5) {
      onUpdate({
        members,
        mealLogs,
        bazarExpenses,
        utilities,
        deposits
      });
    }
  };

  const unsubMembers = onSnapshot(collection(db, MEMBERS_COLL), (snap) => {
    members = snap.docs.map(d => d.data() as Member);
    triggerUpdate(MEMBERS_COLL);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, MEMBERS_COLL);
  });

  const unsubMeals = onSnapshot(collection(db, MEAL_LOGS_COLL), (snap) => {
    mealLogs = snap.docs.map(d => d.data() as MealLog);
    triggerUpdate(MEAL_LOGS_COLL);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, MEAL_LOGS_COLL);
  });

  const unsubBazar = onSnapshot(collection(db, BAZAR_EXP_COLL), (snap) => {
    bazarExpenses = snap.docs.map(d => d.data() as BazarExpense);
    triggerUpdate(BAZAR_EXP_COLL);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, BAZAR_EXP_COLL);
  });

  const unsubUtilities = onSnapshot(collection(db, UTILITIES_COLL), (snap) => {
    utilities = snap.docs.map(d => d.data() as Utility);
    triggerUpdate(UTILITIES_COLL);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, UTILITIES_COLL);
  });

  const unsubDeposits = onSnapshot(collection(db, DEPOSITS_COLL), (snap) => {
    deposits = snap.docs.map(d => d.data() as Deposit);
    triggerUpdate(DEPOSITS_COLL);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, DEPOSITS_COLL);
  });

  return () => {
    unsubMembers();
    unsubMeals();
    unsubBazar();
    unsubUtilities();
    unsubDeposits();
  };
}

// Real-time mutations
export async function saveMemberToFirestore(member: Member) {
  try {
    await setDoc(doc(db, MEMBERS_COLL, member.id), member);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${MEMBERS_COLL}/${member.id}`);
  }
}

export async function deleteMemberFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, MEMBERS_COLL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${MEMBERS_COLL}/${id}`);
  }
}

export async function saveMealsToFirestore(date: string, meals: MealLog[], allMealLogs: MealLog[]) {
  try {
    // Overwrite existing ones for that date: delete those that aren't in the new list, set the new ones
    const existingOnDate = allMealLogs.filter(log => log.date === date);
    const newMealIds = new Set(meals.map(m => m.id));

    // Delete removed ones
    for (const log of existingOnDate) {
      if (!newMealIds.has(log.id)) {
        await deleteDoc(doc(db, MEAL_LOGS_COLL, log.id));
      }
    }

    // Set new ones
    for (const m of meals) {
      await setDoc(doc(db, MEAL_LOGS_COLL, m.id), m);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, MEAL_LOGS_COLL);
  }
}

export async function deleteMealsForDateFromFirestore(date: string, allMealLogs: MealLog[]) {
  try {
    const logsToDelete = allMealLogs.filter(log => log.date === date);
    for (const log of logsToDelete) {
      await deleteDoc(doc(db, MEAL_LOGS_COLL, log.id));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, MEAL_LOGS_COLL);
  }
}

export async function saveBazarExpenseToFirestore(expense: BazarExpense) {
  try {
    await setDoc(doc(db, BAZAR_EXP_COLL, expense.id), expense);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${BAZAR_EXP_COLL}/${expense.id}`);
  }
}

export async function deleteBazarExpenseFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, BAZAR_EXP_COLL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${BAZAR_EXP_COLL}/${id}`);
  }
}

export async function saveUtilityToFirestore(utility: Utility) {
  try {
    await setDoc(doc(db, UTILITIES_COLL, utility.id), utility);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${UTILITIES_COLL}/${utility.id}`);
  }
}

export async function saveDepositToFirestore(deposit: Deposit) {
  try {
    await setDoc(doc(db, DEPOSITS_COLL, deposit.id), deposit);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${DEPOSITS_COLL}/${deposit.id}`);
  }
}

export async function deleteDepositFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, DEPOSITS_COLL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${DEPOSITS_COLL}/${id}`);
  }
}

// Clear or Reset to Demo
export async function resetFirestoreToDemo() {
  try {
    const batch = writeBatch(db);
    
    // Get all documents across collections
    const collectionsList = [MEMBERS_COLL, MEAL_LOGS_COLL, BAZAR_EXP_COLL, UTILITIES_COLL, DEPOSITS_COLL];
    for (const collName of collectionsList) {
      const snap = await getDocs(collection(db, collName)).catch(err => {
        handleFirestoreError(err, OperationType.GET, collName);
        throw err;
      });
      snap.docs.forEach(d => {
        batch.delete(doc(db, collName, d.id));
      });
    }
    await batch.commit();

    // Re-seed
    const seed = getSeedData();
    for (const m of seed.members) {
      await setDoc(doc(db, MEMBERS_COLL, m.id), m);
    }
    for (const l of seed.mealLogs) {
      await setDoc(doc(db, MEAL_LOGS_COLL, l.id), l);
    }
    for (const e of seed.bazarExpenses) {
      await setDoc(doc(db, BAZAR_EXP_COLL, e.id), e);
    }
    for (const u of seed.utilities) {
      await setDoc(doc(db, UTILITIES_COLL, u.id), u);
    }
    for (const d of seed.deposits) {
      await setDoc(doc(db, DEPOSITS_COLL, d.id), d);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'resetToDemo');
  }
}

// Bulk restore / upload backup
export async function uploadBackupToFirestore(backup: {
  members: Member[];
  mealLogs: MealLog[];
  bazarExpenses: BazarExpense[];
  utilities: Utility[];
  deposits: Deposit[];
}) {
  try {
    const batch = writeBatch(db);
    
    // Clear old collections first
    const collectionsList = [MEMBERS_COLL, MEAL_LOGS_COLL, BAZAR_EXP_COLL, UTILITIES_COLL, DEPOSITS_COLL];
    for (const collName of collectionsList) {
      const snap = await getDocs(collection(db, collName)).catch(err => {
        handleFirestoreError(err, OperationType.GET, collName);
        throw err;
      });
      snap.docs.forEach(d => {
        batch.delete(doc(db, collName, d.id));
      });
    }
    await batch.commit();

    // Upload backup documents
    for (const m of backup.members) {
      await setDoc(doc(db, MEMBERS_COLL, m.id), m);
    }
    for (const l of backup.mealLogs) {
      await setDoc(doc(db, MEAL_LOGS_COLL, l.id), l);
    }
    for (const e of backup.bazarExpenses) {
      await setDoc(doc(db, BAZAR_EXP_COLL, e.id), e);
    }
    for (const u of backup.utilities) {
      await setDoc(doc(db, UTILITIES_COLL, u.id), u);
    }
    for (const d of backup.deposits) {
      await setDoc(doc(db, DEPOSITS_COLL, d.id), d);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'uploadBackup');
  }
}
