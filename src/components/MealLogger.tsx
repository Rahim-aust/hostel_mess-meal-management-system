import React, { useState, useEffect } from 'react';
import { Member, MealLog } from '../types';
import { Calendar, Save, Trash2, Edit2, Check, Sparkles, AlertCircle } from 'lucide-react';

interface MealLoggerProps {
  members: Member[];
  mealLogs: MealLog[];
  selectedMonth: string; // YYYY-MM
  onSaveMeals: (date: string, meals: { memberId: string; lunch: number; dinner: number }[]) => void;
  onDeleteDateLogs: (date: string) => void;
  currentMemberId: string;
  isManager: boolean;
}

export default function MealLogger({
  members,
  mealLogs,
  selectedMonth,
  onSaveMeals,
  onDeleteDateLogs,
  currentMemberId,
  isManager,
}: MealLoggerProps) {
  // Setup default date to today or the first day of the selected month
  const getInitialDate = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (todayStr.substring(0, 7) === selectedMonth) {
      return todayStr;
    }
    return `${selectedMonth}-01`;
  };

  const [logDate, setLogDate] = useState(getInitialDate());
  const [successMsg, setSuccessMsg] = useState('');

  // Daily values state: map of memberId -> { lunch: string; dinner: string }
  const [dailyMeals, setDailyMeals] = useState<{ [memberId: string]: { lunch: string; dinner: string } }>({});

  // When date or selectedMonth changes, load existing values if they exist
  useEffect(() => {
    const existingLogs = mealLogs.filter((log) => log.date === logDate);
    const initialMeals: { [memberId: string]: { lunch: string; dinner: string } } = {};

    members.forEach((member) => {
      const log = existingLogs.find((l) => l.memberId === member.id);
      initialMeals[member.id] = {
        lunch: log ? log.lunch.toString() : '1', // default to 1 meal as string
        dinner: log ? log.dinner.toString() : '1', // default to 1 meal as string
      };
    });

    setDailyMeals(initialMeals);
  }, [logDate, mealLogs, members]);

  // Handle month selection change updates date bounds
  useEffect(() => {
    const datePrefix = logDate.substring(0, 7);
    if (datePrefix !== selectedMonth) {
      setLogDate(`${selectedMonth}-01`);
    }
  }, [selectedMonth]);

  const updateMealCount = (memberId: string, type: 'lunch' | 'dinner', value: string) => {
    setDailyMeals((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [type]: value,
      },
    }));
  };

  const setAllToValue = (type: 'lunch' | 'dinner' | 'all', value: number) => {
    setDailyMeals((prev) => {
      const updated = { ...prev };
      members.forEach((m) => {
        if (m.status === 'Active') {
          updated[m.id] = {
            lunch: type === 'lunch' || type === 'all' ? value.toString() : updated[m.id]?.lunch ?? '1',
            dinner: type === 'dinner' || type === 'all' ? value.toString() : updated[m.id]?.dinner ?? '1',
          };
        }
      });
      return updated;
    });
  };

  const handleSave = () => {
    const dataToSave = Object.keys(dailyMeals).map((memberId) => {
      const rawLunch = dailyMeals[memberId]?.lunch ?? '1';
      const rawDinner = dailyMeals[memberId]?.dinner ?? '1';
      const parsedLunch = parseFloat(rawLunch);
      const parsedDinner = parseFloat(rawDinner);

      return {
        memberId,
        lunch: isNaN(parsedLunch) ? 0 : parsedLunch,
        dinner: isNaN(parsedDinner) ? 0 : parsedDinner,
      };
    });
    
    onSaveMeals(logDate, dataToSave);
    setSuccessMsg('Meal logs saved successfully for ' + logDate);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Extract list of dates logged for the selected month
  const getLoggedDates = () => {
    const dates = new Set<string>();
    mealLogs.forEach((log) => {
      if (log.date.substring(0, 7) === selectedMonth) {
        dates.add(log.date);
      }
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a)); // Descending order
  };

  const loggedDates = getLoggedDates();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="meal-logger-root">
      
      {/* Logger Sheet Column */}
      <div className="lg:col-span-2 tech-box bg-white p-6 space-y-6" id="meal-logging-sheet">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#141414]/20 pb-4">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-[#141414]">Log Daily Meals</h2>
            <p className="text-xs font-mono text-[#141414]/60 mt-1">Record lunch and dinner consumption counts</p>
          </div>
          
          {/* Date Selector */}
          <div className="flex items-center space-x-2 border-2 border-[#141414] bg-[#F0EFEC] px-3 py-1 font-mono text-xs font-bold">
            <span className="uppercase tracking-wider">Date:</span>
            <input
              id="logger-date-input"
              type="date"
              className="bg-transparent border-none text-[#141414] font-bold focus:outline-none cursor-pointer"
              value={logDate}
              min={`${selectedMonth}-01`}
              max={`${selectedMonth}-31`}
              onChange={(e) => setLogDate(e.target.value)}
            />
          </div>
        </div>

        {/* Global Bulk Adjuster or Member Info Banner */}
        {isManager ? (
          <div className="bg-[#F0EFEC] p-4 border border-[#141414] flex flex-wrap gap-3 items-center justify-between" id="bulk-adjuster">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#141414]/85">Bulk Adjust Active:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setAllToValue('all', 1)}
                className="px-2.5 py-1 bg-white hover:bg-[#141414] hover:text-[#E4E3E0] border border-[#141414] text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
              >
                All to 1.0 (Full)
              </button>
              <button
                onClick={() => setAllToValue('all', 0)}
                className="px-2.5 py-1 bg-white hover:bg-[#141414] hover:text-[#E4E3E0] border border-[#141414] text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
              >
                All Off (0.0)
              </button>
              <button
                onClick={() => setAllToValue('lunch', 0)}
                className="px-2.5 py-1 bg-white hover:bg-[#141414] hover:text-[#E4E3E0] border border-[#141414] text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
              >
                Lunch Off
              </button>
              <button
                onClick={() => setAllToValue('dinner', 0)}
                className="px-2.5 py-1 bg-white hover:bg-[#141414] hover:text-[#E4E3E0] border border-[#141414] text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
              >
                Dinner Off
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border-2 border-amber-500/35 p-4 text-xs font-mono text-amber-900 uppercase flex items-center space-x-2" id="member-editing-warning">
            <AlertCircle size={14} className="shrink-0" />
            <span>Regular Member Mode: You can only edit your own meal log. Other members' meal logs are locked.</span>
          </div>
        )}

        {/* Members Grid list */}
        <div className="space-y-3" id="meal-logger-members-list">
          {members.map((member) => {
            const counts = dailyMeals[member.id] || { lunch: 1, dinner: 1 };
            const isInactive = member.status === 'Inactive';
            const isSelf = member.id === currentMemberId;
            const isLocked = !isManager && !isSelf;

            return (
              <div
                key={member.id}
                className={`p-4 border-2 transition-all ${
                  isInactive
                    ? 'bg-[#F0EFEC]/40 border-dashed border-[#141414]/30 opacity-60'
                    : isLocked
                    ? 'bg-[#F0EFEC]/20 border-[#141414]/30 opacity-70'
                    : 'bg-white border-[#141414]'
                }`}
                id={`member-row-${member.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left: Member Badge */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 border-2 border-[#141414] flex items-center justify-center font-bold text-xs font-mono ${
                      isInactive ? 'bg-gray-300 text-gray-500' : 'bg-[#D8D7D3] text-[#141414]'
                    }`}>
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#141414] text-sm flex flex-wrap items-center gap-1.5">
                        <span className="uppercase">{member.name}</span>
                        {isSelf && (
                          <span className="text-[9px] font-mono font-bold bg-emerald-600 text-white px-1.5 py-0.2 uppercase">
                            YOU
                          </span>
                        )}
                        {member.role === 'Manager' && (
                          <span className="text-[9px] font-mono font-bold bg-[#141414] text-white px-1.5 py-0.2 uppercase">
                            MGR
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-[8px] font-mono opacity-60 bg-gray-200 border border-gray-400 text-gray-700 px-1 py-0.1 uppercase tracking-tight">
                            LOCKED
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] font-mono text-[#141414]/60 uppercase">{isInactive ? 'Inactive member' : 'Active status'}</p>
                    </div>
                  </div>

                  {/* Right: Lunch & Dinner controls */}
                  <div className="flex flex-wrap items-center gap-6">
                    {/* Lunch control */}
                    <div className="space-y-1">
                      <span className="tech-header-serif block text-[#141414] font-bold">Lunch</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center border border-[#141414] bg-[#F0EFEC] p-0.5 font-mono">
                          {[0, 0.5, 1, 1.5, 2].map((v) => {
                            const isSelected = parseFloat(counts.lunch) === v;
                            return (
                              <button
                                key={v}
                                type="button"
                                disabled={isInactive || isLocked}
                                onClick={() => updateMealCount(member.id, 'lunch', v.toString())}
                                className={`w-9 py-1 text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#141414] text-white font-black'
                                    : 'text-[#141414] hover:bg-white/70'
                                } disabled:opacity-50`}
                              >
                                {v === 0.5 ? '½' : v === 1.5 ? '1½' : v}
                              </button>
                            );
                          })}
                        </div>
                        {/* Text type input facility */}
                        <div className="flex items-center border-2 border-[#141414] bg-white px-2 py-0.5 space-x-1 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Qty:</span>
                          <input
                            type="text"
                            placeholder="0"
                            disabled={isInactive || isLocked}
                            value={counts.lunch}
                            onChange={(e) => {
                              const val = e.target.value;
                              const cleaned = val.replace(/[^0-9.]/g, '');
                              updateMealCount(member.id, 'lunch', cleaned);
                            }}
                            className="w-10 bg-transparent text-center text-xs font-bold font-mono focus:outline-none text-[#141414]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dinner control */}
                    <div className="space-y-1">
                      <span className="tech-header-serif block text-[#141414] font-bold">Dinner</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center border border-[#141414] bg-[#F0EFEC] p-0.5 font-mono">
                          {[0, 0.5, 1, 1.5, 2].map((v) => {
                            const isSelected = parseFloat(counts.dinner) === v;
                            return (
                              <button
                                key={v}
                                type="button"
                                disabled={isInactive || isLocked}
                                onClick={() => updateMealCount(member.id, 'dinner', v.toString())}
                                className={`w-9 py-1 text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#141414] text-white font-black'
                                    : 'text-[#141414] hover:bg-white/70'
                                } disabled:opacity-50`}
                              >
                                {v === 0.5 ? '½' : v === 1.5 ? '1½' : v}
                              </button>
                            );
                          })}
                        </div>
                        {/* Text type input facility */}
                        <div className="flex items-center border-2 border-[#141414] bg-white px-2 py-0.5 space-x-1 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Qty:</span>
                          <input
                            type="text"
                            placeholder="0"
                            disabled={isInactive || isLocked}
                            value={counts.dinner}
                            onChange={(e) => {
                              const val = e.target.value;
                              const cleaned = val.replace(/[^0-9.]/g, '');
                              updateMealCount(member.id, 'dinner', cleaned);
                            }}
                            className="w-10 bg-transparent text-center text-xs font-bold font-mono focus:outline-none text-[#141414]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#141414]/20">
          <div>
            {successMsg && (
              <span className="text-xs font-mono font-bold text-emerald-700 flex items-center space-x-1" id="success-msg">
                <Check size={14} />
                <span>{successMsg.toUpperCase()}</span>
              </span>
            )}
          </div>
          <button
            id="btn-save-meals"
            onClick={handleSave}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#141414] hover:bg-[#333] text-white text-xs font-bold uppercase tracking-widest cursor-pointer"
          >
            <Save size={14} />
            <span>Save Meals for {logDate}</span>
          </button>
        </div>
      </div>

      {/* History / Logged Dates List Column */}
      <div className="tech-box bg-white p-6 space-y-4" id="meal-logging-history">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] pb-2 border-b border-[#141414]">
            Logged Cycle Dates
          </h3>
          <p className="text-[10px] font-mono text-[#141414]/60 mt-1 uppercase">Review or edit entries in {selectedMonth}</p>
        </div>

        {loggedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
            <AlertCircle size={28} />
            <p className="text-[10px] font-mono uppercase text-center">No meals logged for this cycle</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1" id="logged-dates-list">
            {loggedDates.map((date) => {
              const dayMeals = mealLogs.filter((log) => log.date === date);
              const totalLunch = dayMeals.reduce((sum, m) => sum + m.lunch, 0);
              const totalDinner = dayMeals.reduce((sum, m) => sum + m.dinner, 0);

              const isActiveSelection = logDate === date;

              return (
                <div
                  key={date}
                  className={`p-3 border transition-all flex items-center justify-between ${
                    isActiveSelection ? 'bg-[#F0EFEC] border-2 border-[#141414]' : 'bg-white border-[#141414]/30 hover:border-[#141414]'
                  }`}
                  id={`history-row-${date}`}
                >
                  <div className="font-mono">
                    <span className="text-xs font-bold text-[#141414] block">
                      {date}
                    </span>
                    <span className="text-[10px] text-[#141414]/65">
                      LUNCH: {totalLunch.toFixed(1)} | DINNER: {totalDinner.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setLogDate(date)}
                      title="Load and Edit Date"
                      className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] text-[#141414] border border-transparent hover:border-[#141414] transition-all cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                    {isManager && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete meal logs for ${date}?`)) {
                            onDeleteDateLogs(date);
                          }
                        }}
                        title="Delete Entry"
                        className="p-1 hover:bg-rose-600 hover:text-white text-rose-600 border border-transparent hover:border-[#141414] transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
