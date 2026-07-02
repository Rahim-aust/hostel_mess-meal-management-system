import React, { useState, useMemo, useEffect } from 'react';
import { Member, MealLog, BazarExpense, Utility, Deposit } from './types';
import {
  loadLocalState,
  saveLocalState,
  calculateMonthlySummary,
  getSeedData,
  DEFAULT_MEMBERS
} from './utils/dataStore';
import {
  seedFirestoreIfEmpty,
  subscribeToData,
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
  HelpCircle
} from 'lucide-react';

export default function App() {
  // Load initial data from localStorage (or defaults if empty)
  const [state, setState] = useState(() => loadLocalState());

  // Cloud syncing state
  const [loading, setLoading] = useState(true);

  // Active identity states
  const [currentMemberId, setCurrentMemberId] = useState(() => {
    return localStorage.getItem('mess_current_member_id') || '';
  });

  const currentMember = useMemo(() => {
    return state.members.find((m: { id: string; }) => m.id === currentMemberId);
  }, [state.members, currentMemberId]);

  const isManager = useMemo(() => {
    return currentMember?.role === 'Manager';
  }, [currentMember]);

  // Synchronize currentMemberId once members load or are updated
  useEffect(() => {
    if (state.members.length > 0) {
      const exists = state.members.some((m: { id: string; }) => m.id === currentMemberId);
      if (!exists) {
        // Find first manager or member
        const mgr = state.members.find((m: { role: string; }) => m.role === 'Manager') || state.members[0];
        if (mgr) {
          setCurrentMemberId(mgr.id);
          localStorage.setItem('mess_current_member_id', mgr.id);
        }
      }
    }
  }, [state.members, currentMemberId]);

  // Sync to/from Firestore on mount
  useEffect(() => {
    let unsub: (() => void) | null = null;
    const init = async () => {
      try {
        await seedFirestoreIfEmpty();
        unsub = subscribeToData((newData) => {
          setState(newData);
          saveLocalState(newData);
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
    state.mealLogs.forEach((log: { date: string; }) => months.add(log.date.substring(0, 7)));
    // Gather from expenses
    state.bazarExpenses.forEach((exp: { date: string; }) => months.add(exp.date.substring(0, 7)));
    // Gather from utilities
    state.utilities.forEach((ut: { month: string; }) => months.add(ut.month));
    // Gather from deposits
    state.deposits.forEach((dep: { date: string; }) => months.add(dep.date.substring(0, 7)));

    return Array.from(months).sort((a, b) => b.localeCompare(a)); // Newest first
  }, [state]);

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
    const monthPrompt = prompt('Enter billing month in YYYY-MM format (e.g. 2026-08):');
    if (!monthPrompt) return;
    const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!regex.test(monthPrompt)) {
      alert('Invalid month format. Please use YYYY-MM format.');
      return;
    }
    setSelectedMonth(monthPrompt);
  };

  // --- ACTIONS HANDLERS ---

  // Meal logs saving
  const handleSaveMeals = async (date: string, meals: { memberId: string; lunch: number; dinner: number }[]) => {
    const newLogs: MealLog[] = meals.map((m, i) => ({
      id: `ml-${date}-${m.memberId}-${i}`,
      date,
      memberId: m.memberId,
      lunch: m.lunch,
      dinner: m.dinner,
    }));
    await saveMealsToFirestore(date, newLogs, state.mealLogs);
  };

  const handleDeleteDateLogs = async (date: string) => {
    await deleteMealsForDateFromFirestore(date, state.mealLogs);
  };

  // Bazar expense management
  const handleAddBazarExpense = async (expense: Omit<BazarExpense, 'id'>) => {
    const newExp: BazarExpense = {
      ...expense,
      id: `be-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    await saveBazarExpenseToFirestore(newExp);
  };

  const handleDeleteBazarExpense = async (id: string) => {
    await deleteBazarExpenseFromFirestore(id);
  };

  // Utilities settings saving
  const handleSaveUtilities = async (utility: Utility) => {
    await saveUtilityToFirestore(utility);
  };

  // Deposit management
  const handleAddDeposit = async (deposit: Omit<Deposit, 'id'>) => {
    const newDep: Deposit = {
      ...deposit,
      id: `dp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    await saveDepositToFirestore(newDep);
  };

  const handleDeleteDeposit = async (id: string) => {
    await deleteDepositFromFirestore(id);
  };

  // Member profiles management
  const handleAddMember = async (member: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...member,
      id: `m-${Date.now()}`,
    };
    await saveMemberToFirestore(newMember);
  };

  const handleUpdateMember = async (updatedMember: Member) => {
    if (updatedMember.role === 'Manager') {
      // Find other managers and demote them to Member
      const otherManagers = state.members.filter((m: { role: string; id: string; }) => m.role === 'Manager' && m.id !== updatedMember.id);
      for (const m of otherManagers) {
        await saveMemberToFirestore({ ...m, role: 'Member' });
      }
    }
    await saveMemberToFirestore(updatedMember);
  };

  const handleDeleteMember = async (id: string) => {
    await deleteMemberFromFirestore(id);
  };

  // Reset to demo seed data
  const handleResetToDemo = async () => {
    if (confirm('This will restore Rahim, Shuvo, Robi and other demo calculations. Current custom edits will be replaced. Continue?')) {
      await resetFirestoreToDemo();
    }
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
        if (parsed.members && parsed.mealLogs && parsed.bazarExpenses && parsed.utilities && parsed.deposits) {
          await uploadBackupToFirestore(parsed);
          alert('Database restored successfully!');
        } else {
          alert('Invalid backup file format. Missing required tables.');
        }
      } catch (err) {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Dynamically calculate everything for the active month!
  const monthlySummary = useMemo(() => {
    return calculateMonthlySummary(
      state.members,
      state.mealLogs,
      state.bazarExpenses,
      state.utilities,
      state.deposits,
      selectedMonth
    );
  }, [state, selectedMonth]);

  // Human friendly month title helper
  const getMonthTitle = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const activeManager = useMemo(() => {
    return state.members.find((m: { role: string; }) => m.role === 'Manager') || state.members[0];
  }, [state.members]);

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
            <div className="flex items-center space-x-1 mt-2 lg:mt-4" id="backup-actions">
              <button
                onClick={handleDownloadBackup}
                title="Export JSON Database"
                className="p-1.5 hover:bg-[#141414] hover:text-[#E4E3E0] border border-[#141414] text-xs font-bold font-mono transition-all cursor-pointer"
              >
                <Download size={13} />
              </button>

              {isManager && (
                <>
                  <label
                    title="Import JSON Database"
                    className="p-1.5 hover:bg-[#141414] hover:text-[#E4E3E0] border border-[#141414] text-xs font-bold font-mono transition-all cursor-pointer flex items-center"
                  >
                    <Upload size={13} />
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
                    className="p-1.5 hover:bg-amber-500 hover:text-white border border-[#141414] text-xs font-bold font-mono transition-all cursor-pointer"
                  >
                    <RefreshCw size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Active Identity selector */}
          <div className="mt-6 mb-4 p-3 bg-white border-2 border-[#141414] font-mono shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]" id="active-user-identity-card">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#141414]/70 block mb-1">
              Logged in as:
            </span>
            <select
              className="w-full bg-[#F0EFEC] border border-[#141414] text-xs font-bold py-1 px-1.5 focus:outline-none cursor-pointer uppercase text-[#141414]"
              value={currentMemberId}
              onChange={(e) => {
                setCurrentMemberId(e.target.value);
                localStorage.setItem('mess_current_member_id', e.target.value);
              }}
            >
              {state.members.map((m: Member) => (
                <option key={m.id} value={m.id}>
                  {m.name.toUpperCase()} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Tab Navigation Menu */}
          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-3 lg:pb-0 border-b lg:border-b-0 border-[#141414]/30" id="sidebar-navigation">
            {[
              { id: 'dashboard', label: 'DASHBOARD', icon: <Activity size={14} /> },
              { id: 'meals', label: 'MEAL LOGS', icon: <Calendar size={14} /> },
              { id: 'expenses', label: 'BAZAR & BILLS', icon: <ShoppingBag size={14} /> },
              { id: 'deposits', label: 'DEPOSITS', icon: <Wallet size={14} /> },
              { id: 'members', label: 'REGISTRY', icon: <Users size={14} /> },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-wide py-2 px-3 border-b-2 lg:border-b-0 lg:border-l-4 transition-all shrink-0 cursor-pointer text-left ${isActive
                      ? 'border-[#141414] text-[#141414] font-black'
                      : 'border-transparent text-[#141414]/65 hover:text-[#141414] hover:border-[#141414]/40'
                    }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
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
          <p className="text-[9px] font-mono text-[#141414]/55 mt-1">HOSTEL BILLS • ACTIVE</p>
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
              ৳{monthlySummary.mealRate.toFixed(2)}
            </p>
          </div>

          {/* Stat 2: Total Bazar Cost */}
          <div className="border-b md:border-b-0 md:border-r border-[#141414] p-4 flex flex-col justify-between" id="stat-bazar-cost">
            <p className="tech-header-serif">Total Bazar Cost</p>
            <p className="text-2xl lg:text-3xl font-mono font-black mt-2 text-[#141414]">
              ৳{monthlySummary.totalBazarExpense.toLocaleString()}
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
              ৳{monthlySummary.totalUtilities.toLocaleString()}
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
                mealLogs={state.mealLogs}
                members={state.members}
              />
            )}

            {activeTab === 'meals' && (
              <MealLogger
                members={state.members}
                mealLogs={state.mealLogs}
                selectedMonth={selectedMonth}
                onSaveMeals={handleSaveMeals}
                onDeleteDateLogs={handleDeleteDateLogs}
                currentMemberId={currentMemberId}
                isManager={isManager}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseTracker
                members={state.members}
                bazarExpenses={state.bazarExpenses}
                utilities={state.utilities}
                selectedMonth={selectedMonth}
                onAddBazarExpense={handleAddBazarExpense}
                onDeleteBazarExpense={handleDeleteBazarExpense}
                onSaveUtilities={handleSaveUtilities}
                isManager={isManager}
              />
            )}

            {activeTab === 'deposits' && (
              <DepositManager
                members={state.members}
                deposits={state.deposits}
                selectedMonth={selectedMonth}
                onAddDeposit={handleAddDeposit}
                onDeleteDeposit={handleDeleteDeposit}
                isManager={isManager}
              />
            )}

            {activeTab === 'members' && (
              <MemberManager
                members={state.members}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                isManager={isManager}
              />
            )}
          </div>
        </section>

        {/* MECHANICAL DESIGN FOOTER */}
        <footer className="bg-white border-t-2 border-[#141414] p-4 text-center text-[10px] font-mono tracking-tight text-[#141414]/70" id="main-footer">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="uppercase font-bold">BACHELOR MESS MEAL MANAGEMENT SYSTEM</span>
            <span>DATA MATRIX SYNC CONFORMING • © 2026 HOSTEL MANAGEMENT INC.</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
