import React, { useState, useMemo } from 'react';
import { MonthlySummary, MealLog, Member } from '../types';
import { ShieldAlert, CheckCircle, CalendarDays, Sun, Moon } from 'lucide-react';

interface DashboardProps {
  summary: MonthlySummary;
  mealLogs: MealLog[];
  members: Member[];
}

export default function Dashboard({ summary, mealLogs, members }: DashboardProps) {
  const {
    totalBazarExpense,
    totalMeals,
    mealRate,
    totalUtilities,
    utilitySharePerMember,
    totalDeposits,
    memberSummaries
  } = summary;

  // Track the date selected for daily meal counter. Defaults to local today.
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const handleShiftDay = (days: number) => {
    const current = new Date(selectedDate);
    if (isNaN(current.getTime())) return;
    current.setDate(current.getDate() + days);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const dayLogs = useMemo(() => {
    return mealLogs.filter((log) => log.date === selectedDate);
  }, [mealLogs, selectedDate]);

  const totalLunch = useMemo(() => {
    return dayLogs.reduce((sum, log) => sum + (log.lunch || 0), 0);
  }, [dayLogs]);

  const totalDinner = useMemo(() => {
    return dayLogs.reduce((sum, log) => sum + (log.dinner || 0), 0);
  }, [dayLogs]);

  return (
    <div className="space-y-6 animate-fadeIn" id="dashboard-container">
      
      {/* SECTION: Member Ledger Ledger Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-highlights">
        
        {/* Main Member Ledger */}
        <div className="lg:col-span-8 tech-box bg-white p-6" id="members-financial-summary">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 pb-4 border-b border-[#141414]/20">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-[#141414]">Member Ledger</h2>
              <p className="text-xs font-mono text-[#141414]/60 mt-1">Detailed calculation matrix of active members</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono mt-2 sm:mt-0">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-700"></span> SURPLUS</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-600"></span> DUE (DEBIT)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#141414]" id="summary-table">
              <thead>
                <tr className="bg-[#F0EFEC] border-b border-[#141414] text-[#141414]">
                  <th className="py-3 px-4 tech-header-serif">Member Name</th>
                  <th className="py-3 px-4 tech-header-serif text-center">Meals</th>
                  <th className="py-3 px-4 tech-header-serif text-right">Deposited</th>
                  <th className="py-3 px-4 tech-header-serif text-right">Meal Cost</th>
                  <th className="py-3 px-4 tech-header-serif text-right">Utility Share</th>
                  <th className="py-3 px-4 tech-header-serif text-right">Total Cost</th>
                  <th className="py-3 px-4 tech-header-serif text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/20 font-mono">
                {memberSummaries.map((mSum) => {
                  const isDue = mSum.balance < 0;
                  const isClear = mSum.balance === 0;
                  return (
                    <tr 
                      key={mSum.member.id} 
                      className="tech-row-hover bg-white hover:bg-[#141414] transition-all" 
                      id={`row-member-${mSum.member.id}`}
                    >
                      <td className="py-3 px-4 font-bold text-[#141414] text-[13px]">
                        <div className="flex items-center space-x-1.5">
                          <span>{mSum.member.name}</span>
                          {mSum.member.role === 'Manager' && (
                            <span className="text-[9px] bg-[#141414] text-[#E4E3E0] px-1 py-0.2 uppercase font-mono font-bold tracking-tight">
                              MGR
                            </span>
                          )}
                          {mSum.member.status === 'Inactive' && (
                            <span className="text-[9px] border border-[#141414]/50 text-[#141414]/60 px-1 py-0.2 uppercase font-mono">
                              OUT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-[#141414] font-bold">
                        {mSum.totalMeals.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#141414]">
                        Tk {mSum.depositedAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-[#141414]/80">
                        Tk {mSum.mealCost.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#141414]/80">
                        Tk {mSum.utilityShare.toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#141414] font-bold">
                        Tk {mSum.totalCost.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2 py-1 border text-xs font-bold ${
                            isDue
                              ? 'border-rose-600 bg-rose-50 text-rose-700'
                              : isClear
                              ? 'border-[#141414] bg-[#F0EFEC] text-[#141414]'
                              : 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isDue ? '-' : isClear ? '' : '+'}Tk {Math.abs(mSum.balance).toFixed(1)}
                          <span className="text-[8px] block font-normal opacity-75 uppercase tracking-wider">
                            {isDue ? 'Pay Due' : isClear ? 'Clear' : 'Refund'}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Cash Ledgers & Alerts */}
        <div className="lg:col-span-4 space-y-6" id="dashboard-side-panel">
          
          {/* Current Day Meals Tracker Widget */}
          <div className="tech-box p-6 bg-white flex flex-col justify-between animate-fadeIn" id="current-day-meals-card">
            <div>
              <div className="flex justify-between items-center mb-4 border-b border-[#141414] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-[#141414]" />
                  <span>Daily Meal Counter</span>
                </h3>
                
                <div className="flex items-center border border-[#141414] bg-[#F0EFEC] p-0.5 font-mono text-[10px]">
                  <button
                    onClick={() => handleShiftDay(-1)}
                    className="px-1.5 py-0.5 hover:bg-[#141414] hover:text-white transition-all font-bold cursor-pointer"
                    title="Previous Day"
                    aria-label="Previous day"
                  >
                    &lt;
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent border-0 px-1 font-bold focus:outline-none cursor-pointer text-center max-w-[105px] text-[#141414]"
                  />
                  <button
                    onClick={() => handleShiftDay(1)}
                    className="px-1.5 py-0.5 hover:bg-[#141414] hover:text-white transition-all font-bold cursor-pointer"
                    title="Next Day"
                    aria-label="Next day"
                  >
                    &gt;
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4" id="daily-totals">
                {/* Lunch Total Box */}
                <div className="border border-[#141414] bg-[#F0EFEC]/40 p-3 flex flex-col justify-between relative overflow-hidden shadow-[2px_2px_0px_0px_rgba(20,20,20,0.15)]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#141414]/70">Total Lunch</span>
                    <Sun size={14} className="text-amber-600" />
                  </div>
                  <p className="text-2xl font-mono font-black text-[#141414] mt-2">
                    {totalLunch % 1 === 0 ? totalLunch : totalLunch.toFixed(1)}
                  </p>
                </div>

                {/* Dinner Total Box */}
                <div className="border border-[#141414] bg-[#F0EFEC]/40 p-3 flex flex-col justify-between relative overflow-hidden shadow-[2px_2px_0px_0px_rgba(20,20,20,0.15)]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#141414]/70">Total Dinner</span>
                    <Moon size={14} className="text-indigo-600" />
                  </div>
                  <p className="text-2xl font-mono font-black text-[#141414] mt-2">
                    {totalDinner % 1 === 0 ? totalDinner : totalDinner.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Active meals details for the selected day */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-mono uppercase text-[#141414]/65">Member Meals ({selectedDate}):</p>
                {dayLogs.length === 0 ? (
                  <p className="text-[10px] font-mono text-center py-3 text-gray-500 uppercase italic border border-dashed border-[#141414]/20 bg-[#F0EFEC]/10">
                    No meals recorded for this date
                  </p>
                ) : (
                  <div className="max-h-[150px] overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                    {members.filter(m => m.status === 'Active').map((member) => {
                      const log = dayLogs.find(l => l.memberId === member.id);
                      const lunchVal = log ? log.lunch : 0;
                      const dinnerVal = log ? log.dinner : 0;
                      return (
                        <div key={member.id} className="flex justify-between items-center p-1.5 border border-[#141414]/10 bg-[#F0EFEC]/20 hover:border-[#141414]/30">
                          <span className="font-bold text-[#141414] text-[11px] truncate max-w-[120px] uppercase">{member.name}</span>
                          <div className="flex gap-2 text-[11px]">
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 rounded font-bold">
                              L: {lunchVal}
                            </span>
                            <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 px-1 py-0.2 rounded font-bold">
                              D: {dinnerVal}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cash Ledger Details */}
          <div className="tech-box p-6 bg-white flex flex-col justify-between" id="financial-overview-card">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] mb-4 border-b border-[#141414] pb-2">
                Cash Ledger Status
              </h3>
              
              <div className="space-y-3 font-mono text-[11px] text-[#141414]">
                <div className="flex justify-between border-b border-[#141414]/10 pb-1">
                  <span className="opacity-70 uppercase">Total Deposits</span>
                  <span className="font-bold">Tk {totalDeposits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-[#141414]/10 pb-1">
                  <span className="opacity-70 uppercase">Total Bazar Used</span>
                  <span className="font-bold">Tk {totalBazarExpense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-[#141414]/10 pb-1">
                  <span className="opacity-70 uppercase">Net Utility Cost</span>
                  <span className="font-bold">Tk {totalUtilities.toLocaleString()}</span>
                </div>
                
                <div className="pt-3 border-t border-[#141414] flex justify-between items-baseline">
                  <span className="font-bold text-xs uppercase">Mess Vault Cash</span>
                  <span className={`text-lg font-black ${totalDeposits - totalBazarExpense - totalUtilities >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    Tk {(totalDeposits - totalBazarExpense - totalUtilities).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#141414]/15 bg-[#F0EFEC] p-3 border">
              <p className="text-[9px] font-mono leading-relaxed text-[#141414]/75 uppercase">
                * NET VAULT CASH is remaining cash in physical vault of the Mess Manager (Deposits minus expenses).
              </p>
            </div>
          </div>

          {/* Dues Checklist */}
          <div className="tech-box p-6 bg-white" id="pending-actions-card">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] mb-4 border-b border-[#141414] pb-2 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-[#141414]" />
              <span>Pending Dues Action</span>
            </h3>

            <div className="space-y-3">
              {memberSummaries.filter(m => m.balance < 0).length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-600 p-3 text-xs font-mono uppercase">
                  <CheckCircle size={16} />
                  <span>Mess balances clear!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase text-[#141414]/65">Collect outstanding cash from:</p>
                  <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 font-mono">
                    {memberSummaries
                      .filter(m => m.balance < 0)
                      .sort((a, b) => a.balance - b.balance)
                      .map(mSum => (
                        <div key={mSum.member.id} className="flex items-center justify-between p-2 border border-[#141414]/20 hover:border-[#141414] bg-[#F0EFEC]/45 text-xs">
                          <span className="font-bold uppercase text-[#141414]">{mSum.member.name}</span>
                          <span className="font-bold text-rose-600">
                            Tk {Math.abs(mSum.balance).toFixed(0)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
