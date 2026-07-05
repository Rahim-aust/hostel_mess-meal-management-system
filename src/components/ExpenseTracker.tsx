import React, { useState } from 'react';
import { Member, BazarExpense, Utility } from '../types';
import { Plus, Trash2, ShoppingBag, ShieldCheck } from 'lucide-react';
import { getMonthDateBounds } from '../utils/date';

interface ExpenseTrackerProps {
  members: Member[];
  bazarExpenses: BazarExpense[];
  utilities: Utility[];
  selectedMonth: string; // YYYY-MM
  onAddBazarExpense: (expense: Omit<BazarExpense, 'id'>) => void;
  onDeleteBazarExpense: (id: string) => void;
  onSaveUtilities: (utility: Utility) => void;
  isManager: boolean;
}

export default function ExpenseTracker({
  members,
  bazarExpenses,
  utilities,
  selectedMonth,
  onAddBazarExpense,
  onDeleteBazarExpense,
  onSaveUtilities,
  isManager,
}: ExpenseTrackerProps) {
  
  // 1. Tab choice: 'bazar' or 'utilities'
  const [activeTab, setActiveTab] = useState<'bazar' | 'utilities'>('bazar');

  // --- Bazar States ---
  const [bazarDate, setBazarDate] = useState(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (todayStr.substring(0, 7) === selectedMonth) return todayStr;
    return `${selectedMonth}-01`;
  });
  const [bazarAmount, setBazarAmount] = useState('');
  const [buyerId, setBuyerId] = useState(members[0]?.id || '');
  const [bazarDetails, setBazarDetails] = useState('');
  const [bazarError, setBazarError] = useState('');

  // --- Utilities States ---
  // Load utilities for selected month or initialize with defaults
  const activeUtility = utilities.find(u => u.month === selectedMonth) || {
    id: `ut-${selectedMonth}`,
    month: selectedMonth,
    bua: 0,
    electricity: 0,
    gas: 0,
    waste: 0,
    internet: 0,
    others: 0
  };

  const [bua, setBua] = useState(activeUtility.bua.toString());
  const [electricity, setElectricity] = useState(activeUtility.electricity.toString());
  const [gas, setGas] = useState(activeUtility.gas.toString());
  const [waste, setWaste] = useState(activeUtility.waste.toString());
  const [internet, setInternet] = useState(activeUtility.internet.toString());
  const [others, setOthers] = useState(activeUtility.others.toString());
  const [utilitySavedMsg, setUtilitySavedMsg] = useState('');

  // Sync state if selectedMonth changes
  React.useEffect(() => {
    const updatedUtility = utilities.find(u => u.month === selectedMonth) || {
      id: `ut-${selectedMonth}`,
      month: selectedMonth,
      bua: 0,
      electricity: 0,
      gas: 0,
      waste: 0,
      internet: 0,
      others: 0
    };
    setBua(updatedUtility.bua.toString());
    setElectricity(updatedUtility.electricity.toString());
    setGas(updatedUtility.gas.toString());
    setWaste(updatedUtility.waste.toString());
    setInternet(updatedUtility.internet.toString());
    setOthers(updatedUtility.others.toString());

    // Sync date to month bounds
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (todayStr.substring(0, 7) === selectedMonth) {
      setBazarDate(todayStr);
    } else {
      setBazarDate(`${selectedMonth}-01`);
    }
  }, [selectedMonth, utilities]);

  const handleAddBazar = (e: React.FormEvent) => {
    e.preventDefault();
    setBazarError('');

    const parsedAmt = parseFloat(bazarAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setBazarError('Please enter a valid amount greater than 0');
      return;
    }
    if (!buyerId) {
      setBazarError('Please select the buyer');
      return;
    }
    if (!bazarDetails.trim()) {
      setBazarError('Please enter item purchase details');
      return;
    }

    onAddBazarExpense({
      date: bazarDate,
      amount: parsedAmt,
      buyerId,
      details: bazarDetails.trim()
    });

    // Reset Form
    setBazarAmount('');
    setBazarDetails('');
  };

  const handleSaveUtilities = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUtilities({
      id: activeUtility.id,
      month: selectedMonth,
      bua: parseFloat(bua) || 0,
      electricity: parseFloat(electricity) || 0,
      gas: parseFloat(gas) || 0,
      waste: parseFloat(waste) || 0,
      internet: parseFloat(internet) || 0,
      others: parseFloat(others) || 0,
    });

    setUtilitySavedMsg('Utility bills saved successfully for ' + selectedMonth);
    setTimeout(() => setUtilitySavedMsg(''), 3000);
  };

  // Filter Bazar expenses for the active month
  const monthBazarExpenses = bazarExpenses.filter(e => e.date.substring(0, 7) === selectedMonth);
  const totalMonthBazar = monthBazarExpenses.reduce((sum, e) => sum + e.amount, 0);
  const dateBounds = getMonthDateBounds(selectedMonth);

  return (
    <div className="space-y-6 animate-fadeIn" id="expense-tracker-root">
      
      {/* Sub tabs selector */}
      <div className="flex border-2 border-[#141414] bg-white p-1 max-w-sm" id="expense-tabs">
        <button
          onClick={() => setActiveTab('bazar')}
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'bazar' ? 'bg-[#141414] text-[#E4E3E0]' : 'text-[#141414] hover:bg-[#F0EFEC]'
          }`}
        >
          Bazar (Groceries)
        </button>
        <button
          onClick={() => setActiveTab('utilities')}
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'utilities' ? 'bg-[#141414] text-[#E4E3E0]' : 'text-[#141414] hover:bg-[#F0EFEC]'
          }`}
        >
          Shared Utilities
        </button>
      </div>

      {/* RENDER BAZAR TAB */}
      {activeTab === 'bazar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="tab-bazar">
          
          {/* Create Form Column */}
          <div className="lg:col-span-1" id="add-bazar-form">
            {isManager ? (
              <div className="tech-box p-6 bg-white space-y-4">
                <div>
                  <h3 className="font-bold text-base uppercase tracking-tight text-[#141414]">Log Grocery Bazar</h3>
                  <p className="text-[10px] font-mono text-[#141414]/60 uppercase mt-1">Record individual market purchases</p>
                </div>

                {bazarError && (
                  <div className="p-3 bg-rose-50 border border-rose-600 text-rose-700 text-xs font-mono uppercase">
                    {bazarError}
                  </div>
                )}

                <form onSubmit={handleAddBazar} className="space-y-4 text-xs font-mono">
                  
                  {/* Date Input */}
                  <div className="space-y-1">
                    <label className="text-[#141414] font-bold text-[10px] uppercase block">Purchase Date</label>
                    <input
                      type="date"
                      required
                      min={dateBounds.min}
                      max={dateBounds.max}
                      className="w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 font-bold text-[#141414] focus:outline-none"
                      value={bazarDate}
                      onChange={(e) => setBazarDate(e.target.value)}
                    />
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-1">
                    <label className="text-[#141414] font-bold text-[10px] uppercase block">Amount (Tk / Tk )</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 font-black">Tk </span>
                      <input
                        type="number"
                        placeholder="e.g. 1500"
                        required
                        min="1"
                        className="w-full bg-[#F0EFEC] border-2 border-[#141414] pl-7 pr-3 py-2 font-bold text-[#141414] focus:outline-none"
                        value={bazarAmount}
                        onChange={(e) => setBazarAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Buyer Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[#141414] font-bold text-[10px] uppercase block">Buyer (Mess Member)</label>
                    <select
                      className="w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 font-bold text-[#141414] focus:outline-none"
                      value={buyerId}
                      onChange={(e) => setBuyerId(e.target.value)}
                    >
                      <option value="">-- SELECT MEMBER --</option>
                      {members.filter(m => m.status === 'Active').map(m => (
                        <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Details Input */}
                  <div className="space-y-1">
                    <label className="text-[#141414] font-bold text-[10px] uppercase block">Items Purchased</label>
                    <textarea
                      placeholder="e.g. Rice 10kg, Fish, Potatoes..."
                      rows={3}
                      required
                      className="w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 text-[#141414] focus:outline-none resize-none font-sans text-xs"
                      value={bazarDetails}
                      onChange={(e) => setBazarDetails(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-[#141414] hover:bg-[#333] text-white text-xs font-bold uppercase tracking-widest cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Bazar Cost</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="tech-box p-6 bg-white space-y-4 border-2 border-dashed border-[#141414]/30 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)]">
                <div className="text-center py-6">
                  <ShieldCheck size={40} className="mx-auto text-amber-600 mb-3" />
                  <h3 className="font-bold text-sm uppercase tracking-tight text-[#141414]">Read-Only Mode</h3>
                  <p className="text-xs text-[#141414]/65 leading-relaxed font-sans mt-2">
                    Only the designated <strong>Meal Manager</strong> is authorized to edit the bazar grocery log.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Expenses List Column */}
          <div className="lg:col-span-2" id="bazar-expense-list">
            <div className="tech-box p-6 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 pb-3 border-b border-[#141414]/20">
                <div>
                  <h3 className="font-bold text-base uppercase tracking-tight text-[#141414]">Bazar Purchases List</h3>
                  <p className="text-[10px] font-mono text-[#141414]/60 uppercase mt-1">Grocery expenses log for {selectedMonth}</p>
                </div>
                <div className="bg-[#F27D26] text-white px-3 py-1.5 border-2 border-[#141414] text-xs font-bold font-mono">
                  TOTAL BAZAR: Tk {totalMonthBazar.toLocaleString()}
                </div>
              </div>

              {monthBazarExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#141414]/40 space-y-2 border-2 border-dashed border-[#141414]/30 bg-[#F0EFEC]/20">
                  <ShoppingBag size={36} />
                  <p className="text-[10px] font-mono uppercase tracking-wider">No grocery items logged for this cycle</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[500px]" id="bazar-list">
                  {monthBazarExpenses.map((exp) => {
                    const buyer = members.find((m) => m.id === exp.buyerId);
                    return (
                      <div
                        key={exp.id}
                        className="p-3 border border-[#141414]/35 bg-[#F0EFEC]/30 hover:bg-[#F0EFEC]/75 flex items-center justify-between transition-all"
                        id={`bazar-item-${exp.id}`}
                      >
                        <div className="space-y-1 flex-1 pr-4 font-mono text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[#141414]">Tk {exp.amount}</span>
                            <span className="text-[9px] font-bold bg-[#141414] text-[#E4E3E0] px-1.5 py-0.2 uppercase">
                              BUYER: {buyer ? buyer.name.toUpperCase() : 'UNKNOWN'}
                            </span>
                            <span className="text-[9px] text-[#141414]/60">
                              [{exp.date}]
                            </span>
                          </div>
                          <p className="text-xs text-[#141414]/85 font-sans leading-relaxed mt-1">
                            {exp.details}
                          </p>
                        </div>

                        {isManager && (
                          <button
                            onClick={() => onDeleteBazarExpense(exp.id)}
                            aria-label={`Delete grocery expense from ${exp.date}`}
                            className="p-1.5 text-[#141414] hover:bg-rose-600 hover:text-white border border-transparent hover:border-[#141414] transition-all cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER UTILITIES TAB */}
      {activeTab === 'utilities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="tab-utilities">
          
          {/* Utilities Entry Form */}
          <div className="lg:col-span-2 tech-box bg-white p-6 space-y-6" id="utilities-setup-pane">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#141414]/20 pb-4">
              <div>
                <h3 className="font-bold text-base uppercase tracking-tight text-[#141414]">Setup Monthly Utility Bills</h3>
                <p className="text-[10px] font-mono text-[#141414]/60 uppercase mt-1">Configure bills that are split equally among active members</p>
              </div>
              <span className="text-xs font-bold font-mono px-3 py-1 bg-[#141414] text-[#E4E3E0]">
                CYCLE: {selectedMonth}
              </span>
            </div>

            <form onSubmit={handleSaveUtilities} className="space-y-6">
              
              {/* Bills Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono" id="utility-inputs-grid">
                
                {/* 1. Bua (Cook) */}
                <div className="space-y-1">
                  <label className="text-[#141414] font-bold text-[10px] uppercase block">Cook Salary (Bua)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-black">Tk </span>
                    <input
                      type="number"
                      disabled={!isManager}
                      className="w-full bg-[#F0EFEC] border-2 border-[#141414] pl-7 pr-3 py-2 font-bold text-[#141414] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                      value={bua}
                      onChange={(e) => setBua(e.target.value)}
                    />
                  </div>
                </div>

                {/* 2. Electricity */}
                <div className="space-y-1">
                  <label className="text-[#141414] font-bold text-[10px] uppercase block">Electricity Bill</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-black">Tk </span>
                    <input
                      type="number"
                      disabled={!isManager}
                      className="w-full bg-[#F0EFEC] border-2 border-[#141414] pl-7 pr-3 py-2 font-bold text-[#141414] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                      value={electricity}
                      onChange={(e) => setElectricity(e.target.value)}
                    />
                  </div>
                </div>

                {/* 3. Gas */}
                <div className="space-y-1">
                  <label className="text-[#141414] font-bold text-[10px] uppercase block">Gas Line / Cylinder</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-black">Tk </span>
                    <input
                      type="number"
                      disabled={!isManager}
                      className="w-full bg-[#F0EFEC] border-2 border-[#141414] pl-7 pr-3 py-2 font-bold text-[#141414] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                      value={gas}
                      onChange={(e) => setGas(e.target.value)}
                    />
                  </div>
                </div>

                {/* 4. Waste / Moila */}
                <div className="space-y-1">
                  <label className="text-[#141414] font-bold text-[10px] uppercase block">Waste Collection (Moila)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-black">Tk </span>
                    <input
                      type="number"
                      disabled={!isManager}
                      className="w-full bg-[#F0EFEC] border-2 border-[#141414] pl-7 pr-3 py-2 font-bold text-[#141414] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                      value={waste}
                      onChange={(e) => setWaste(e.target.value)}
                    />
                  </div>
                </div>

                {/* 5. Internet */}
                <div className="space-y-1">
                  <label className="text-[#141414] font-bold text-[10px] uppercase block">WiFi Internet Bill</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-black">Tk </span>
                    <input
                      type="number"
                      disabled={!isManager}
                      className="w-full bg-[#F0EFEC] border-2 border-[#141414] pl-7 pr-3 py-2 font-bold text-[#141414] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                      value={internet}
                      onChange={(e) => setInternet(e.target.value)}
                    />
                  </div>
                </div>

                {/* 6. Others */}
                <div className="space-y-1">
                  <label className="text-[#141414] font-bold text-[10px] uppercase block">Other Shared Utilities</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-black">Tk </span>
                    <input
                      type="number"
                      disabled={!isManager}
                      className="w-full bg-[#F0EFEC] border-2 border-[#141414] pl-7 pr-3 py-2 font-bold text-[#141414] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                      value={others}
                      onChange={(e) => setOthers(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Form Action */}
              <div className="flex items-center justify-between pt-4 border-t border-[#141414]/20">
                <span className="text-xs font-bold text-emerald-700 font-mono uppercase">
                  {utilitySavedMsg.toUpperCase()}
                </span>
                {isManager ? (
                  <button
                    type="submit"
                    id="btn-save-utilities"
                    className="flex items-center space-x-2 px-6 py-2.5 bg-[#141414] hover:bg-[#333] text-white text-xs font-bold uppercase tracking-widest cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    <span>Save Utility Bill</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-amber-800 uppercase bg-amber-50 border border-amber-500/20 px-3 py-1 font-bold">
                    Read-Only Utility Profile
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Quick Distribution Summary Side Panel */}
          <div className="lg:col-span-1 space-y-4" id="utilities-bill-breakdown">
            <div className="tech-box p-6 bg-white space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414] pb-2 border-b border-[#141414]">
                Bill Breakdown
              </h4>
              <p className="text-[10px] font-mono text-[#141414]/65 uppercase leading-relaxed">
                Total scheduled for each sector during month {selectedMonth}.
              </p>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between p-2 bg-[#F0EFEC]/55 border border-[#141414]/15">
                  <span className="tech-header-serif text-[#141414]/75 normal-case">Maid / Cook:</span>
                  <span className="font-bold text-[#141414]">Tk {parseFloat(bua) || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-[#F0EFEC]/55 border border-[#141414]/15">
                  <span className="tech-header-serif text-[#141414]/75 normal-case">Electricity:</span>
                  <span className="font-bold text-[#141414]">Tk {parseFloat(electricity) || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-[#F0EFEC]/55 border border-[#141414]/15">
                  <span className="tech-header-serif text-[#141414]/75 normal-case">Gas bill:</span>
                  <span className="font-bold text-[#141414]">Tk {parseFloat(gas) || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-[#F0EFEC]/55 border border-[#141414]/15">
                  <span className="tech-header-serif text-[#141414]/75 normal-case">Moila (Waste):</span>
                  <span className="font-bold text-[#141414]">Tk {parseFloat(waste) || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-[#F0EFEC]/55 border border-[#141414]/15">
                  <span className="tech-header-serif text-[#141414]/75 normal-case">WiFi Internet:</span>
                  <span className="font-bold text-[#141414]">Tk {parseFloat(internet) || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-[#F0EFEC]/55 border border-[#141414]/15">
                  <span className="tech-header-serif text-[#141414]/75 normal-case">Others:</span>
                  <span className="font-bold text-[#141414]">Tk {parseFloat(others) || 0}</span>
                </div>

                <div className="flex justify-between p-3 bg-[#141414] text-[#E4E3E0] font-mono text-xs font-bold uppercase mt-4">
                  <span>Grand Total:</span>
                  <span>
                    Tk 
                    {(
                      (parseFloat(bua) || 0) +
                      (parseFloat(electricity) || 0) +
                      (parseFloat(gas) || 0) +
                      (parseFloat(waste) || 0) +
                      (parseFloat(internet) || 0) +
                      (parseFloat(others) || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
