import React, { useState, useMemo, useEffect } from 'react';
import { Member, MealLog, BazarExpense, Utility, Deposit, MessBranch } from './types';
import {
  loadLocalState,
  saveLocalState,
  calculateMonthlySummary,
  DEFAULT_BRANCH_ID,
  normalizeState
} from './utils/dataStore';
import {
  seedFirestoreIfEmpty,
  subscribeToData,
  saveBranchToFirestore,
  saveMemberToFirestore,
  deleteMemberFromFirestore,
  saveMealsToFirestore,
  deleteMealsForDateFromFirestore,
  saveBazarExpenseToFirestore,
  deleteBazarExpenseFromFirestore,
  saveUtilityToFirestore,
  saveDepositToFirestore,
  deleteDepositFromFirestore,
  resetFirestoreToDemo,
  uploadBackupToFirestore
} from './utils/firebase';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import ExpenseTracker from './components/ExpenseTracker';
import DepositManager from './components/DepositManager';
import MemberManager from './components/MemberManager';
import { validateBackup } from './utils/backup';

import {
  Activity,
  Calendar,
  ShoppingBag,
  Wallet,
  Users,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  RefreshCw,
  PlusCircle,
  LogIn,
  LogOut
} from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'superadmin@mess.com';
const DEFAULT_SUPER_ADMIN_PASSWORD = '123456';

export default function App() {
  // Load initial data from localStorage (or defaults if empty)
  const [state, setState] = useState(() => loadLocalState());

  // Cloud syncing state
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState(() => {
    return localStorage.getItem('mess_login_email') || '';
  });
  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [isSuperAdminSession, setIsSuperAdminSession] = useState(() => {
    return localStorage.getItem('mess_super_admin_session') === 'true';
  });
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    return localStorage.getItem('mess_selected_branch_id') || DEFAULT_BRANCH_ID;
  });
  const [dialogInput, setDialogInput] = useState('');
  const [dialog, setDialog] = useState<null | {
    kind: 'notice' | 'confirm' | 'prompt';
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm?: (value: string) => void | Promise<void>;
  }>(null);

  const openNotice = (title: string, message: string) => {
    setDialog({ kind: 'notice', title, message, confirmLabel: 'OK' });
  };

  const openConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>, confirmLabel = 'Confirm') => {
    setDialog({ kind: 'confirm', title, message, confirmLabel, onConfirm: () => onConfirm() });
  };

  const openPrompt = (title: string, message: string, initialValue: string, onConfirm: (value: string) => void | Promise<void>) => {
    setDialogInput(initialValue);
    setDialog({ kind: 'prompt', title, message, confirmLabel: 'Add Cycle', onConfirm });
  };

  const closeDialog = () => {
    setDialog(null);
    setDialogInput('');
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    await dialog.onConfirm?.(dialog.kind === 'prompt' ? dialogInput : '');
    closeDialog();
  };

  const currentMember = useMemo(() => {
    if (isSuperAdminSession) return undefined;
    const email = loginEmail.trim().toLowerCase();
    if (!email) return undefined;
    return state.members.find((m: { email: string; }) => m.email.toLowerCase() === email);
  }, [state.members, loginEmail, isSuperAdminSession]);

  const currentMemberId = currentMember?.id || '';
  const activeBranchId = isSuperAdminSession ? selectedBranchId : (currentMember?.branchId || selectedBranchId);
  const activeBranch = state.branches.find((branch: { id: string; }) => branch.id === activeBranchId) || state.branches[0];
  const branchMembers = state.members.filter((member: Member) => member.branchId === activeBranchId);
  const branchMealLogs = state.mealLogs.filter((log: MealLog) => log.branchId === activeBranchId);
  const branchBazarExpenses = state.bazarExpenses.filter((expense: BazarExpense) => expense.branchId === activeBranchId);
  const branchUtilities = state.utilities.filter((utility: Utility) => utility.branchId === activeBranchId);
  const branchDeposits = state.deposits.filter((deposit: Deposit) => deposit.branchId === activeBranchId);

  const isManager = useMemo(() => {
    return isSuperAdminSession || currentMember?.role === 'Manager';
  }, [currentMember, isSuperAdminSession]);

  const handleEmailLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = loginEmailInput.trim().toLowerCase();
    if (normalizedEmail === SUPER_ADMIN_EMAIL) {
      const password = localStorage.getItem('mess_super_admin_password') || DEFAULT_SUPER_ADMIN_PASSWORD;
      if (loginPasswordInput !== password) {
        setDialog({ kind: 'notice', title: 'Login Failed', message: 'Invalid super admin password.', confirmLabel: 'OK' });
        return;
      }
      setIsSuperAdminSession(true);
      setLoginEmail(normalizedEmail);
      localStorage.setItem('mess_super_admin_session', 'true');
      localStorage.setItem('mess_login_email', normalizedEmail);
      return;
    }
    setIsSuperAdminSession(false);
    setLoginEmail(normalizedEmail);
    setLoginPasswordInput('');
    localStorage.removeItem('mess_super_admin_session');
    localStorage.setItem('mess_login_email', normalizedEmail);
  };

  const handleEmailLogout = () => {
    setLoginEmail('');
    setLoginEmailInput('');
    setLoginPasswordInput('');
    setIsSuperAdminSession(false);
    localStorage.removeItem('mess_login_email');
    localStorage.removeItem('mess_super_admin_session');
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    localStorage.setItem('mess_selected_branch_id', branchId);
  };

  const handleChangeSuperAdminPassword = () => {
    if (!isSuperAdminSession) return;
    openPrompt('Change Super Admin Password', 'Enter a new password for Super Admin.', '', (newPassword) => {
      const trimmedPassword = newPassword.trim();
      if (trimmedPassword.length < 4) {
        openNotice('Password Too Short', 'Use at least 4 characters.');
        return;
      }
      localStorage.setItem('mess_super_admin_password', trimmedPassword);
      openNotice('Password Updated', 'Super Admin password was changed on this device.');
    });
  };

  const handleAddBranch = () => {
    if (!isSuperAdminSession) return;
    openPrompt('Add Mess Branch', 'Enter the new mess branch name.', '', async (branchName) => {
      const name = branchName.trim();
      if (!name) {
        openNotice('Branch Name Required', 'Please enter a branch name.');
        return;
      }
      const id = `branch-${Date.now()}`;
      const branch: MessBranch = { id, name };
      await saveBranchToFirestore(branch);
      handleBranchChange(id);
    });
  };

  useEffect(() => {
    if (!isSuperAdminSession && currentMember?.branchId && selectedBranchId !== currentMember.branchId) {
      handleBranchChange(currentMember.branchId);
    }
  }, [currentMember, isSuperAdminSession, selectedBranchId]);

  // Sync to/from Firestore on mount
  useEffect(() => {
    let unsub: (() => void) | null = null;
    const init = async () => {
      try {
        await seedFirestoreIfEmpty();
        unsub = subscribeToData((newData) => {
          const normalizedData = normalizeState(newData);
          setState(normalizedData);
          saveLocalState(normalizedData);
          setLoading(false);
        });
      } catch (err) {
        console.error("Firebase subscription error:", err);
        setLoading(false);
      }
    };
    init();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Navigation tab state: 'dashboard' | 'meals' | 'expenses' | 'deposits' | 'members'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'expenses' | 'deposits' | 'members'>('dashboard');

  // Month select state: YYYY-MM. Defaults to the current month.
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return today.toISOString().substring(0, 7); // "YYYY-MM"
  });

  // Derived helper: list of all months that have entries across the system, or just ensure active selection
  const availableMonths = useMemo(() => {
    const months = new Set<string>();

    // Add current month & previous month as absolute defaults
    const today = new Date();
    months.add(today.toISOString().substring(0, 7));

    const prev = new Date();
    prev.setMonth(prev.getMonth() - 1);
    months.add(prev.toISOString().substring(0, 7));

    // Gather from meal logs
    branchMealLogs.forEach((log: { date: string; }) => months.add(log.date.substring(0, 7)));
    // Gather from expenses
    branchBazarExpenses.forEach((exp: { date: string; }) => months.add(exp.date.substring(0, 7)));
    // Gather from utilities
    branchUtilities.forEach((ut: { month: string; }) => months.add(ut.month));
    // Gather from deposits
    branchDeposits.forEach((dep: { date: string; }) => months.add(dep.date.substring(0, 7)));

    return Array.from(months).sort((a, b) => b.localeCompare(a)); // Newest first
  }, [branchMealLogs, branchBazarExpenses, branchUtilities, branchDeposits]);

  // Handle month shifting
  const handlePrevMonth = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[idx + 1]);
    } else {
      // Deduce previous month mathematically
      const [year, month] = selectedMonth.split('-').map(Number);
      const prevYear = month === 1 ? year - 1 : year;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevMonthStr = `${prevYear}-${prevMonth < 10 ? '0' + prevMonth : prevMonth}`;
      setSelectedMonth(prevMonthStr);
    }
  };

  const handleNextMonth = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx > 0) {
      setSelectedMonth(availableMonths[idx - 1]);
    } else {
      // Deduce next month mathematically
      const [year, month] = selectedMonth.split('-').map(Number);
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextMonthStr = `${nextYear}-${nextMonth < 10 ? '0' + nextMonth : nextMonth}`;
      setSelectedMonth(nextMonthStr);
    }
  };

  const handleAddNewMonth = () => {
    openPrompt('New Billing Cycle', 'Enter a billing month in YYYY-MM format, for example 2026-08.', selectedMonth, (monthPrompt) => {
      const normalizedMonth = monthPrompt.trim();
      const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!regex.test(normalizedMonth)) {
        openNotice('Invalid Month', 'Please use YYYY-MM format, for example 2026-08.');
        return;
      }
      setSelectedMonth(normalizedMonth);
    });
  };

  // --- ACTIONS HANDLERS ---

  // Meal logs saving
  const handleSaveMeals = async (date: string, meals: { memberId: string; breakfast: number; lunch: number; dinner: number }[]) => {
    const allowedMeals = isManager
      ? meals
      : meals.filter((meal) => meal.memberId === currentMemberId);

    const newLogs: MealLog[] = allowedMeals.map((m) => ({
      id: `ml-${activeBranchId}-${date}-${m.memberId}`,
      branchId: activeBranchId,
      date,
      memberId: m.memberId,
      breakfast: m.breakfast,
      lunch: m.lunch,
      dinner: m.dinner,
    }));
    await saveMealsToFirestore(date, newLogs, branchMealLogs, isManager);
  };

  const handleDeleteDateLogs = async (date: string) => {
    openConfirm(
      'Delete Meal Logs',
      `Delete all meal logs for ${date}?`,
      async () => deleteMealsForDateFromFirestore(date, branchMealLogs),
      'Delete'
    );
  };

  // Bazar expense management
  const handleAddBazarExpense = async (expense: Omit<BazarExpense, 'id' | 'branchId'>) => {
    const newExp: BazarExpense = {
      ...expense,
      branchId: activeBranchId,
      id: `be-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    await saveBazarExpenseToFirestore(newExp);
  };

  const handleDeleteBazarExpense = async (id: string) => {
    openConfirm(
      'Delete Bazar Cost',
      'Delete this grocery expense from the cycle?',
      async () => deleteBazarExpenseFromFirestore(id),
      'Delete'
    );
  };

  // Utilities settings saving
  const handleSaveUtilities = async (utility: Omit<Utility, 'branchId'>) => {
    await saveUtilityToFirestore({ ...utility, id: `ut-${activeBranchId}-${utility.month}`, branchId: activeBranchId });
  };

  // Deposit management
  const handleAddDeposit = async (deposit: Omit<Deposit, 'id' | 'branchId'>) => {
    const newDep: Deposit = {
      ...deposit,
      branchId: activeBranchId,
      id: `dp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    await saveDepositToFirestore(newDep);
  };

  const handleDeleteDeposit = async (id: string) => {
    const deposit = state.deposits.find((d: Deposit) => d.id === id);
    openConfirm(
      'Delete Deposit',
      `Delete payment record of Tk ${deposit?.amount || 0}?`,
      async () => deleteDepositFromFirestore(id),
      'Delete'
    );
  };

  // Member profiles management
  const handleAddMember = async (member: Omit<Member, 'id' | 'branchId'>) => {
    const newMember: Member = {
      ...member,
      branchId: activeBranchId,
      id: `m-${Date.now()}`,
    };
    if (newMember.role === 'Manager') {
      const otherManagers = branchMembers.filter((m: { role: string; }) => m.role === 'Manager');
      for (const m of otherManagers) {
        await saveMemberToFirestore({ ...m, role: 'Member' });
      }
    }
    await saveMemberToFirestore(newMember);
  };

  const handleUpdateMember = async (updatedMember: Member) => {
    const existingMember = state.members.find((m: { id: string; }) => m.id === updatedMember.id);
    const managerCount = branchMembers.filter((m: { role: string; }) => m.role === 'Manager').length;
    if (
      existingMember?.id === currentMemberId &&
      existingMember.role === 'Manager' &&
      updatedMember.role !== 'Manager' &&
      managerCount <= 1
    ) {
      openNotice('Manager Required', 'You cannot demote yourself until another manager is available.');
      return;
    }

    if (updatedMember.id === currentMemberId && updatedMember.email.trim().toLowerCase() !== loginEmail.trim().toLowerCase()) {
      const normalizedEmail = updatedMember.email.trim().toLowerCase();
      setLoginEmail(normalizedEmail);
      localStorage.setItem('mess_login_email', normalizedEmail);
    }

    if (updatedMember.role === 'Manager') {
      // Find other managers and demote them to Member
      const otherManagers = branchMembers.filter((m: { role: string; id: string; }) => m.role === 'Manager' && m.id !== updatedMember.id);
      for (const m of otherManagers) {
        await saveMemberToFirestore({ ...m, role: 'Member' });
      }
    }
    await saveMemberToFirestore(updatedMember);
  };

  const handleDeleteMember = async (id: string) => {
    const member = branchMembers.find((m: Member) => m.id === id);
    openConfirm(
      'Remove Member',
      `Remove ${member?.name || 'this member'} permanently from the registry?`,
      async () => deleteMemberFromFirestore(id),
      'Remove'
    );
  };

  // Reset to demo seed data
  const handleResetToDemo = async () => {
    openConfirm(
      'Reset Demo Data',
      'This will restore demo calculations and replace current custom edits.',
      resetFirestoreToDemo,
      'Reset'
    );
  };

  // Backup data as local JSON download
  const handleDownloadBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hostel_mess_backup_${selectedMonth}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Restore data from local JSON file
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validation = validateBackup(parsed);
        if (!validation.valid || !validation.backup) {
          openNotice('Invalid Backup File', validation.errors.slice(0, 8).join('\n'));
          return;
        }

        await uploadBackupToFirestore(validation.backup);
        openNotice('Restore Complete', 'Database restored successfully.');
      } catch (err) {
        openNotice('Restore Failed', 'Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Dynamically calculate everything for the active month!
  const monthlySummary = useMemo(() => {
    return calculateMonthlySummary(
      branchMembers,
      branchMealLogs,
      branchBazarExpenses,
      branchUtilities,
      branchDeposits,
      selectedMonth
    );
  }, [branchMembers, branchMealLogs, branchBazarExpenses, branchUtilities, branchDeposits, selectedMonth]);

  // Human friendly month title helper
  const getMonthTitle = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const activeManager = useMemo(() => {
    return branchMembers.find((m: { role: string; }) => m.role === 'Manager') || branchMembers[0];
  }, [branchMembers]);

  const mealLogsCountByMember = useMemo(() => {
    return branchMealLogs.reduce((counts: Record<string, number>, log: MealLog) => {
      counts[log.memberId] = (counts[log.memberId] || 0) + 1;
      return counts;
    }, {});
  }, [branchMealLogs]);

  const bazarCountByMember = useMemo(() => {
    return branchBazarExpenses.reduce((counts: Record<string, number>, expense: BazarExpense) => {
      counts[expense.buyerId] = (counts[expense.buyerId] || 0) + 1;
      return counts;
    }, {});
  }, [branchBazarExpenses]);

  const depositCountByMember = useMemo(() => {
    return branchDeposits.reduce((counts: Record<string, number>, deposit: Deposit) => {
      counts[deposit.memberId] = (counts[deposit.memberId] || 0) + 1;
      return counts;
    }, {});
  }, [branchDeposits]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex items-center justify-center p-6 font-sans">
        <div className="tech-box bg-white p-6 max-w-sm w-full text-center">
          <p className="text-xs font-mono font-bold uppercase tracking-widest">Loading mess workspace...</p>
        </div>
      </div>
    );
  }

  if (!loginEmail) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex items-center justify-center p-6 font-sans">
        <div className="tech-box bg-white p-6 max-w-md w-full space-y-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none">Bachelor Mess MS</h1>
            <p className="text-xs font-mono text-[#141414]/65 mt-2 uppercase">
              Sign in with the email assigned by the mess manager.
            </p>
          </div>
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input
              type="email"
              required
              placeholder="member@email.com"
              value={loginEmailInput}
              onChange={(e) => setLoginEmailInput(e.target.value)}
              className="w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 font-bold text-[#141414] focus:outline-none text-sm"
            />
            {loginEmailInput.trim().toLowerCase() === SUPER_ADMIN_EMAIL && (
              <input
                type="password"
                placeholder="Super admin password"
                value={loginPasswordInput}
                onChange={(e) => setLoginPasswordInput(e.target.value)}
                className="w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 font-bold text-[#141414] focus:outline-none text-sm"
              />
            )}
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-[#141414] hover:bg-[#333] text-white text-xs font-bold uppercase tracking-widest cursor-pointer"
            >
              <LogIn size={14} />
              <span>Continue with Email</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isSuperAdminSession && !currentMember) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex items-center justify-center p-6 font-sans">
        <div className="tech-box bg-white p-6 max-w-md w-full space-y-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Access Not Registered</h1>
            <p className="text-xs font-mono text-[#141414]/65 mt-2 uppercase">
              {loginEmail} is not in the mess member registry. Ask the manager to add or edit this email.
            </p>
          </div>
          <button
            onClick={handleEmailLogout}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#141414] hover:bg-[#333] text-white text-xs font-bold uppercase tracking-widest cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col lg:flex-row font-sans" id="hostel-mess-app">

      {/* SIDEBAR: Left Panel (Desktop-fixed, mobile collapsable/responsive) */}
      <aside className="w-full lg:w-64 bg-[#D8D7D3] border-b-2 lg:border-b-0 lg:border-r-2 border-[#141414] flex flex-col justify-between p-6 shrink-0" id="main-sidebar">
        <div>
          {/* Logo / Header Area */}
          <div className="mb-8 lg:mb-10 flex lg:flex-col justify-between items-center lg:items-start" id="sidebar-logo-section">
            <div>
              <h1 className="text-xl lg:text-2xl font-black uppercase tracking-tighter leading-none text-[#141414]">
                BACHELOR<br className="hidden lg:inline" /> MESS MS
              </h1>
              <div className="flex items-center gap-1.5 mt-1 lg:mt-2">
                <span className="text-[10px] opacity-65 font-mono">v2.4 / HOSTEL UNIT-B</span>
                <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[8px] font-mono opacity-80 font-bold uppercase tracking-widest">
                  {loading ? 'SYNCING...' : 'ONLINE'}
                </span>
              </div>
            </div>

            {/* Quick backup controls inside Sidebar */}
            <div className="flex items-center gap-1 mt-2 lg:mt-4" id="backup-actions">
              <button
                onClick={handleDownloadBackup}
                title="Export JSON Database"
                aria-label="Export JSON database"
                className="inline-flex items-center gap-1 px-2 py-1.5 hover:bg-[#141414] hover:text-[#E4E3E0] border border-[#141414] text-[10px] font-bold font-mono transition-all cursor-pointer"
              >
                <Download size={13} />
                <span className="hidden sm:inline lg:hidden xl:inline">Export</span>
              </button>

              {isManager && (
                <>
                  <label
                    title="Import JSON Database"
                    aria-label="Import JSON database"
                    className="inline-flex items-center gap-1 px-2 py-1.5 hover:bg-[#141414] hover:text-[#E4E3E0] border border-[#141414] text-[10px] font-bold font-mono transition-all cursor-pointer"
                  >
                    <Upload size={13} />
                    <span className="hidden sm:inline lg:hidden xl:inline">Import</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleUploadBackup}
                    />
                  </label>

                  <button
                    onClick={handleResetToDemo}
                    title="Reset to Demo Data"
                    aria-label="Reset to demo data"
                    className="inline-flex items-center gap-1 px-2 py-1.5 hover:bg-amber-500 hover:text-white border border-[#141414] text-[10px] font-bold font-mono transition-all cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span className="hidden sm:inline lg:hidden xl:inline">Reset</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Authenticated identity */}
          <div className="mt-6 mb-4 p-3 bg-white border-2 border-[#141414] font-mono shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]" id="active-user-identity-card">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#141414]/70 block mb-1">
              Signed in as:
            </span>
            <p className="text-xs font-bold uppercase text-[#141414]">
              {isSuperAdminSession ? 'Super Admin' : `${currentMember.name} (${currentMember.role})`}
            </p>
            <p className="text-[9px] text-[#141414]/60 break-all mt-1">{loginEmail}</p>
            <p className="text-[9px] text-[#141414]/60 mt-1 uppercase">Branch: {activeBranch?.name || 'Branch'}</p>
            {isSuperAdminSession && (
              <div className="mt-2 space-y-2">
                <select
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="w-full bg-[#F0EFEC] border border-[#141414] text-xs font-bold py-1 px-1.5 focus:outline-none cursor-pointer uppercase text-[#141414]"
                >
                  {state.branches.map((branch: { id: string; name: string; }) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleChangeSuperAdminPassword}
                  className="block text-[9px] font-bold uppercase tracking-wider text-[#141414]/70 hover:text-[#141414] cursor-pointer"
                >
                  Change password
                </button>
                <button
                  onClick={handleAddBranch}
                  className="block text-[9px] font-bold uppercase tracking-wider text-[#141414]/70 hover:text-[#141414] cursor-pointer"
                >
                  Add branch
                </button>
              </div>
            )}
            <button
              onClick={handleEmailLogout}
              className="mt-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#141414]/70 hover:text-[#141414] cursor-pointer"
            >
              <LogOut size={11} />
              <span>Sign out</span>
            </button>
          </div>

          {/* Tab Navigation Menu */}
          <nav className="grid grid-cols-5 lg:flex lg:flex-col gap-1.5 lg:gap-2 pb-3 lg:pb-0 border-b lg:border-b-0 border-[#141414]/30" id="sidebar-navigation">
            {[
              { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: <Activity size={14} /> },
              { id: 'meals', label: 'Meals', shortLabel: 'Meals', icon: <Calendar size={14} /> },
              { id: 'expenses', label: 'Bazar & Bills', shortLabel: 'Bills', icon: <ShoppingBag size={14} /> },
              { id: 'deposits', label: 'Deposits', shortLabel: 'Cash', icon: <Wallet size={14} /> },
              { id: 'members', label: 'Members', shortLabel: 'People', icon: <Users size={14} /> },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  aria-label={tab.label}
                  className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-2 text-[10px] lg:text-xs font-bold uppercase py-2 px-1.5 lg:px-3 border-b-2 lg:border-b-0 lg:border-l-4 transition-all cursor-pointer text-center lg:text-left min-h-[54px] lg:min-h-0 ${isActive
                      ? 'border-[#141414] text-[#141414] font-black'
                      : 'border-transparent text-[#141414]/65 hover:text-[#141414] hover:border-[#141414]/40'
                    }`}
                >
                  {tab.icon}
                  <span className="lg:hidden">{tab.shortLabel}</span>
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Details */}
        <div className="hidden lg:block border-t border-[#141414] pt-4 mt-8" id="sidebar-footer">
          <p className="text-[9px] font-mono mb-1 tracking-wider opacity-60 uppercase">SYSTEM MANAGER</p>
          <p className="text-xs font-bold uppercase tracking-tight text-[#141414]">
            {activeManager ? activeManager.name : 'NAZMUL HOSSAIN'}
          </p>
          <p className="text-[9px] font-mono text-[#141414]/55 mt-1">HOSTEL BILLS - ACTIVE</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content-canvas">

        {/* TOP METRICS HEADER ROW (Dynamic stats bar from the design specs) */}
        <header className="grid grid-cols-2 md:grid-cols-4 border-b-2 border-[#141414] bg-white" id="metrics-bar">

          {/* Stat 1: Current Meal Rate */}
          <div className="border-r border-b md:border-b-0 border-[#141414] p-4 flex flex-col justify-between" id="stat-meal-rate">
            <p className="tech-header-serif">Current Meal Rate</p>
            <p className="text-2xl lg:text-3xl font-mono font-black mt-2 text-[#141414]">
              Tk {monthlySummary.mealRate.toFixed(2)}
            </p>
          </div>

          {/* Stat 2: Total Bazar Cost */}
          <div className="border-b md:border-b-0 md:border-r border-[#141414] p-4 flex flex-col justify-between" id="stat-bazar-cost">
            <p className="tech-header-serif">Total Bazar Cost</p>
            <p className="text-2xl lg:text-3xl font-mono font-black mt-2 text-[#141414]">
              Tk {monthlySummary.totalBazarExpense.toLocaleString()}
            </p>
          </div>

          {/* Stat 3: Total Mess Meals */}
          <div className="border-r border-[#141414] p-4 flex flex-col justify-between" id="stat-mess-meals">
            <p className="tech-header-serif">Total Mess Meals</p>
            <p className="text-2xl lg:text-3xl font-mono font-black mt-2 text-[#141414]">
              {monthlySummary.totalMeals.toFixed(1)}
            </p>
          </div>

          {/* Stat 4: Total Utilities (Highlighted in solid brand orange #F27D26) */}
          <div className="bg-[#F27D26] text-white p-4 flex flex-col justify-between" id="stat-utilities">
            <p className="tech-header-serif text-white opacity-95">Total Utilities</p>
            <p className="text-2xl lg:text-3xl font-mono font-black mt-2">
              Tk {monthlySummary.totalUtilities.toLocaleString()}
            </p>
          </div>
        </header>

        {/* UTILITY CONTROL ROW: Month Selector & Add Month */}
        <section className="bg-white border-b-2 border-[#141414] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="utility-control-bar">
          <div className="flex items-center space-x-2" id="selected-cycle-indicator">
            <span className="text-[10px] font-mono uppercase bg-[#141414] text-[#E4E3E0] px-2 py-1">Active Cycle</span>
            <span className="font-serif italic font-bold text-lg text-[#141414]">
              {getMonthTitle(selectedMonth)}
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2" id="billing-cycle-nav">
            <div className="flex items-center border border-[#141414] bg-[#E4E3E0]/40 p-0.5">
              <button
                onClick={handlePrevMonth}
                title="Previous Month"
                aria-label="Previous month"
                className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] text-[#141414] transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 text-xs font-mono font-bold text-[#141414] min-w-[90px] text-center">
                {selectedMonth}
              </span>

              <button
                onClick={handleNextMonth}
                title="Next Month"
                aria-label="Next month"
                className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] text-[#141414] transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {isManager && (
              <button
                onClick={handleAddNewMonth}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#141414] text-[#E4E3E0] text-xs font-bold hover:bg-[#333] transition-all cursor-pointer uppercase tracking-wider"
              >
                <PlusCircle size={13} />
                <span>New Cycle</span>
              </button>
            )}
          </div>
        </section>

        {/* WORKSPACE AREA: Dynamic sub-view is loaded here */}
        <section className="flex-1 p-6 overflow-y-auto" id="workspace-canvas">
          <div className="max-w-6xl mx-auto" id="workspace-inner">
            {activeTab === 'dashboard' && (
              <Dashboard
                summary={monthlySummary}
                mealLogs={branchMealLogs}
                members={branchMembers}
              />
            )}

            {activeTab === 'meals' && (
              <MealLogger
                members={branchMembers}
                mealLogs={branchMealLogs}
                selectedMonth={selectedMonth}
                onSaveMeals={handleSaveMeals}
                onDeleteDateLogs={handleDeleteDateLogs}
                currentMemberId={currentMemberId}
                isManager={isManager}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseTracker
                members={branchMembers}
                bazarExpenses={branchBazarExpenses}
                utilities={branchUtilities}
                selectedMonth={selectedMonth}
                onAddBazarExpense={handleAddBazarExpense}
                onDeleteBazarExpense={handleDeleteBazarExpense}
                onSaveUtilities={handleSaveUtilities}
                isManager={isManager}
              />
            )}

            {activeTab === 'deposits' && (
              <DepositManager
                members={branchMembers}
                deposits={branchDeposits}
                selectedMonth={selectedMonth}
                onAddDeposit={handleAddDeposit}
                onDeleteDeposit={handleDeleteDeposit}
                isManager={isManager}
              />
            )}

            {activeTab === 'members' && (
              <MemberManager
                members={branchMembers}
                mealLogsCountByMember={mealLogsCountByMember}
                bazarCountByMember={bazarCountByMember}
                depositCountByMember={depositCountByMember}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                currentMemberId={currentMemberId}
                isManager={isManager}
              />
            )}
          </div>
        </section>

        {/* MECHANICAL DESIGN FOOTER */}
        <footer className="bg-white border-t-2 border-[#141414] p-4 text-center text-[10px] font-mono tracking-tight text-[#141414]/70" id="main-footer">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="uppercase font-bold">BACHELOR MESS MEAL MANAGEMENT SYSTEM</span>
            <span>DATA MATRIX SYNC CONFORMING - (c) 2026 HOSTEL MANAGEMENT INC.</span>
          </div>
        </footer>

      </main>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true" aria-labelledby="app-dialog-title">
          <div className="tech-box bg-white w-full max-w-md p-5 shadow-[6px_6px_0px_0px_rgba(20,20,20,0.85)]">
            <div className="space-y-2">
              <h2 id="app-dialog-title" className="text-base font-black uppercase tracking-tight text-[#141414]">
                {dialog.title}
              </h2>
              <p className="text-xs leading-relaxed text-[#141414]/75 whitespace-pre-line">
                {dialog.message}
              </p>
            </div>

            {dialog.kind === 'prompt' && (
              <input
                autoFocus
                value={dialogInput}
                onChange={(e) => setDialogInput(e.target.value)}
                className="mt-4 w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 text-sm font-bold font-mono text-[#141414] focus:outline-none"
                placeholder="YYYY-MM"
              />
            )}

            <div className="mt-5 flex justify-end gap-2">
              {dialog.kind !== 'notice' && (
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 border border-[#141414] text-xs font-bold uppercase tracking-wider text-[#141414] hover:bg-[#F0EFEC] cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={confirmDialog}
                className={`px-4 py-2 border border-[#141414] text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  dialog.confirmLabel === 'Delete' || dialog.confirmLabel === 'Reset' || dialog.confirmLabel === 'Remove'
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-[#141414] text-white hover:bg-[#333]'
                }`}
              >
                {dialog.confirmLabel || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
