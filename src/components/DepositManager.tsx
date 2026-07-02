import React, { useState } from 'react';
import { Member, Deposit } from '../types';
import { Plus, Trash2, Calendar, ShieldCheck, DollarSign, Wallet } from 'lucide-react';

interface DepositManagerProps {
  members: Member[];
  deposits: Deposit[];
  selectedMonth: string; // YYYY-MM
  onAddDeposit: (deposit: Omit<Deposit, 'id'>) => void;
  onDeleteDeposit: (id: string) => void;
  isManager: boolean;
}

export default function DepositManager({
  members,
  deposits,
  selectedMonth,
  onAddDeposit,
  onDeleteDeposit,
  isManager,
}: DepositManagerProps) {
  
  const [depositDate, setDepositDate] = useState(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (todayStr.substring(0, 7) === selectedMonth) return todayStr;
    return `${selectedMonth}-01`;
  });
  const [depositAmount, setDepositAmount] = useState('');
  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync date when selected month changes
  React.useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (todayStr.substring(0, 7) === selectedMonth) {
      setDepositDate(todayStr);
    } else {
      setDepositDate(`${selectedMonth}-01`);
    }
  }, [selectedMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmt = parseFloat(depositAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0');
      return;
    }
    if (!memberId) {
      setErrorMsg('Please select a member');
      return;
    }

    onAddDeposit({
      date: depositDate,
      memberId,
      amount: parsedAmt
    });

    setDepositAmount('');
  };

  // Filter deposits to selected month
  const monthDeposits = deposits.filter(d => d.date.substring(0, 7) === selectedMonth);
  const totalMonthDeposits = monthDeposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="deposit-manager-root">
      
      {/* Deposit Input Form */}
      <div className="lg:col-span-1" id="add-deposit-pane">
        {isManager ? (
          <div className="tech-box p-6 bg-white space-y-4">
            <div>
              <h3 className="font-bold text-base uppercase tracking-tight text-[#141414]">Record Deposit</h3>
              <p className="text-[10px] font-mono text-[#141414]/60 uppercase mt-1">Log cash received from mess members</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-600 text-rose-700 text-xs font-mono uppercase">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              
              {/* Date Input */}
              <div className="space-y-1">
                <label className="text-[#141414] font-bold text-[10px] uppercase block">Receipt Date</label>
                <input
                  type="date"
                  required
                  min={`${selectedMonth}-01`}
                  max={`${selectedMonth}-31`}
                  className="w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 font-bold text-[#141414] focus:outline-none"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                />
              </div>

              {/* Member Dropdown */}
              <div className="space-y-1">
                <label className="text-[#141414] font-bold text-[10px] uppercase block">Deposited By</label>
                <select
                  className="w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 font-bold text-[#141414] focus:outline-none"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                >
                  <option value="">-- SELECT MEMBER --</option>
                  {members.filter(m => m.status === 'Active').map(m => (
                    <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <label className="text-[#141414] font-bold text-[10px] uppercase block">Amount Deposited (Tk / ৳)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-black">৳</span>
                  <input
                    type="number"
                    placeholder="e.g. 2000"
                    required
                    min="1"
                    className="w-full bg-[#F0EFEC] border-2 border-[#141414] pl-7 pr-3 py-2 font-bold text-[#141414] focus:outline-none"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-[#141414] hover:bg-[#333] text-white text-xs font-bold uppercase tracking-widest cursor-pointer"
              >
                <Plus size={14} />
                <span>Record Payment</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="tech-box p-6 bg-white space-y-4 border-2 border-dashed border-[#141414]/30 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)]">
            <div className="text-center py-6">
              <Wallet size={40} className="mx-auto text-amber-600 mb-3" />
              <h3 className="font-bold text-sm uppercase tracking-tight text-[#141414]">Read-Only Mode</h3>
              <p className="text-xs text-[#141414]/65 leading-relaxed font-sans mt-2">
                Only the designated <strong>Meal Manager</strong> is authorized to log member deposits or update cash entries.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Deposits History List */}
      <div className="lg:col-span-2" id="deposits-history-pane">
        <div className="tech-box p-6 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 pb-3 border-b border-[#141414]/20">
            <div>
              <h3 className="font-bold text-base uppercase tracking-tight text-[#141414]">Receipt Statement</h3>
              <p className="text-[10px] font-mono text-[#141414]/60 uppercase mt-1">History of payments collected in {selectedMonth}</p>
            </div>
            <div className="bg-[#10B981] text-white px-3 py-1.5 border-2 border-[#141414] text-xs font-bold font-mono flex items-center space-x-1">
              <Wallet size={13} />
              <span>TOTAL DEPOSITS: ৳{totalMonthDeposits.toLocaleString()}</span>
            </div>
          </div>

          {monthDeposits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#141414]/40 space-y-2 border-2 border-dashed border-[#141414]/30 bg-[#F0EFEC]/20">
              <DollarSign size={36} />
              <p className="text-[10px] font-mono uppercase tracking-wider">No deposit records found for this cycle</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1" id="deposits-history-list">
              {monthDeposits.map((dep) => {
                const member = members.find(m => m.id === dep.memberId);
                return (
                  <div
                    key={dep.id}
                    className="p-3 border border-[#141414]/35 bg-[#F0EFEC]/30 hover:bg-[#F0EFEC]/75 flex items-center justify-between transition-all"
                    id={`deposit-item-${dep.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 border-2 border-[#141414] bg-[#10B981] text-white flex items-center justify-center font-bold text-[10px] font-mono">
                        +৳
                      </div>
                      <div className="font-mono">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[#141414]">৳{dep.amount}</span>
                          <span className="text-xs font-bold text-[#141414]/80 uppercase">
                            BY {member ? member.name.toUpperCase() : 'UNKNOWN MEMBER'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#141414]/60 block uppercase">
                          LOGGED: {dep.date}
                        </span>
                      </div>
                    </div>

                    {isManager && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete payment record of ৳${dep.amount} from ${member?.name || 'this member'}?`)) {
                            onDeleteDeposit(dep.id);
                          }
                        }}
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
  );
}
