import React, { useState } from 'react';
import { Member, MemberStatus, MemberRole } from '../types';
import { Plus, Users, UserPlus, Phone, Mail, ToggleLeft, ToggleRight, Trash2, Shield, CircleAlert, Edit2, Save, X } from 'lucide-react';

interface MemberManagerProps {
  members: Member[];
  mealLogsCountByMember: Record<string, number>;
  bazarCountByMember: Record<string, number>;
  depositCountByMember: Record<string, number>;
  onAddMember: (member: Omit<Member, 'id' | 'branchId'>) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  currentMemberId: string;
  isManager: boolean;
}

export default function MemberManager({
  members,
  mealLogsCountByMember,
  bazarCountByMember,
  depositCountByMember,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  currentMemberId,
  isManager,
}: MemberManagerProps) {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<MemberRole>('Member');
  const [status, setStatus] = useState<MemberStatus>('Active');
  const [errorMsg, setErrorMsg] = useState('');
  const [editingMemberId, setEditingMemberId] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingPhone, setEditingPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a name');
      return;
    }

    // Check if name already exists (case insensitive)
    if (members.some(m => m.name.toLowerCase() === name.trim().toLowerCase())) {
      setErrorMsg('A member with this name already exists');
      return;
    }

    onAddMember({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@mess.com`,
      phone: phone.trim() || '01700000000',
      role,
      status,
    });

    // Reset Form
    setName('');
    setEmail('');
    setPhone('');
    setRole('Member');
    setStatus('Active');
  };

  const toggleStatus = (member: Member) => {
    onUpdateMember({
      ...member,
      status: member.status === 'Active' ? 'Inactive' : 'Active'
    });
  };

  const toggleRole = (member: Member) => {
    const managerCount = members.filter((m) => m.role === 'Manager').length;
    if (member.id === currentMemberId && member.role === 'Manager' && managerCount <= 1) {
      setErrorMsg('You cannot demote yourself until another manager is available');
      return;
    }

    onUpdateMember({
      ...member,
      role: member.role === 'Manager' ? 'Member' : 'Manager'
    });
  };

  const startEditingContact = (member: Member) => {
    setErrorMsg('');
    setEditingMemberId(member.id);
    setEditingEmail(member.email);
    setEditingPhone(member.phone);
  };

  const cancelEditingContact = () => {
    setEditingMemberId('');
    setEditingEmail('');
    setEditingPhone('');
  };

  const saveContact = (member: Member) => {
    if (editingEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingEmail.trim())) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    onUpdateMember({
      ...member,
      email: editingEmail.trim(),
      phone: editingPhone.trim(),
    });
    cancelEditingContact();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="member-manager-root">

      {/* Add Member Column */}
      <div className="lg:col-span-1" id="add-member-pane">
        {isManager ? (
          <div className="tech-box p-6 bg-white space-y-4">
            <div>
              <h3 className="font-bold text-base uppercase tracking-tight text-[#141414]">Onboard New Member</h3>
              <p className="text-[10px] font-mono text-[#141414]/60 uppercase mt-1 font-bold">Add a new member to the mess registry</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-600 text-rose-700 text-xs font-mono uppercase">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-[#141414] font-bold text-[10px] uppercase block">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Asif Iqbal"
                  required
                  className="w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 font-bold text-[#141414] focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[#141414] font-bold text-[10px] uppercase block">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. asif@mess.com"
                  className="w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 font-bold text-[#141414] focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Phone Input */}
              <div className="space-y-1">
                <label className="text-[#141414] font-bold text-[10px] uppercase block">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 017xxxxxxxx"
                  className="w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 font-bold text-[#141414] focus:outline-none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Role Select */}
              <div className="space-y-1">
                <label className="text-[#141414] font-bold text-[10px] uppercase block">System Role</label>
                <select
                  className="w-full bg-[#F0EFEC] border-2 border-[#141414] px-3 py-2 font-bold text-[#141414] focus:outline-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value as MemberRole)}
                >
                  <option value="Member">REGULAR MEMBER</option>
                  <option value="Manager">MESS MANAGER</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-[#141414] hover:bg-[#333] text-white text-xs font-bold uppercase tracking-widest cursor-pointer"
              >
                <UserPlus size={14} />
                <span>Register Member</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="tech-box p-6 bg-white space-y-4 border-2 border-dashed border-[#141414]/30 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)]">
            <div className="text-center py-6">
              <Users size={40} className="mx-auto text-amber-600 mb-3" />
              <h3 className="font-bold text-sm uppercase tracking-tight text-[#141414]">Read-Only Registry</h3>
              <p className="text-xs text-[#141414]/65 leading-relaxed font-sans mt-2">
                Only the designated <strong>Meal Manager</strong> is authorized to onboard new members or adjust user account roles and active states.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Members List Panel */}
      <div className="lg:col-span-2" id="members-list-pane">
        <div className="tech-box p-6 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 pb-3 border-b border-[#141414]/20">
            <div>
              <h3 className="font-bold text-base uppercase tracking-tight text-[#141414]">Mess Registry</h3>
              <p className="text-[10px] font-mono text-[#141414]/60 uppercase mt-1">Manage member privileges, status, and roles</p>
            </div>
            <span className="text-xs font-bold font-mono px-3 py-1.5 bg-[#141414] text-[#E4E3E0] border-2 border-[#141414]">
              {members.length} REGISTRY MEMBERS
            </span>
          </div>

          <div className="space-y-2.5" id="members-cards-container">
            {members.map((member) => {
              const isActive = member.status === 'Active';
              const isThisMemberManager = member.role === 'Manager';
              const isSelf = member.id === currentMemberId;
              const managerCount = members.filter((m) => m.role === 'Manager').length;
              const blocksSelfDemotion = isSelf && isThisMemberManager && managerCount <= 1;
              const isEditingContact = editingMemberId === member.id;
              const historyCount =
                (mealLogsCountByMember[member.id] || 0) +
                (bazarCountByMember[member.id] || 0) +
                (depositCountByMember[member.id] || 0);
              const canDelete = members.length > 2 && historyCount === 0;

              return (
                <div
                  key={member.id}
                  className={`p-3 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isActive ? 'bg-[#F0EFEC]/20 border-[#141414]/40 hover:border-[#141414]' : 'bg-gray-100 border-dashed border-gray-400 opacity-60'
                    }`}
                  id={`member-card-${member.id}`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className={`w-10 h-10 border-2 border-[#141414] flex items-center justify-center font-bold text-xs font-mono shadow-sm shrink-0 ${isActive ? 'bg-[#141414] text-[#E4E3E0]' : 'bg-gray-300 text-gray-500'
                      }`}>
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-1 font-mono">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-[#141414] uppercase">{member.name}</h4>
                        {isThisMemberManager && (
                          <span className="text-[9px] font-black bg-[#141414] text-[#E4E3E0] px-1.5 py-0.2 uppercase flex items-center space-x-0.5">
                            <Shield size={9} />
                            <span>MGR</span>
                          </span>
                        )}
                        {!isActive && (
                          <span className="text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-400 px-1.5 py-0.2 uppercase">
                            Inactive / Left
                          </span>
                        )}
                      </div>

                      {isEditingContact ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                          <label className="flex items-center gap-1 bg-white border border-[#141414]/40 px-2 py-1">
                            <Mail size={11} className="text-[#141414]/60 shrink-0" />
                            <input
                              type="email"
                              value={editingEmail}
                              onChange={(e) => setEditingEmail(e.target.value)}
                              className="min-w-0 w-full bg-transparent font-mono focus:outline-none text-[#141414]"
                              placeholder="email"
                            />
                          </label>
                          <label className="flex items-center gap-1 bg-white border border-[#141414]/40 px-2 py-1">
                            <Phone size={11} className="text-[#141414]/60 shrink-0" />
                            <input
                              type="text"
                              value={editingPhone}
                              onChange={(e) => setEditingPhone(e.target.value)}
                              className="min-w-0 w-full bg-transparent font-mono focus:outline-none text-[#141414]"
                              placeholder="phone"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#141414]/75">
                          {member.email && (
                            <span className="flex items-center space-x-1">
                              <Mail size={11} className="text-[#141414]/60" />
                              <span>{member.email}</span>
                            </span>
                          )}
                          {member.phone && (
                            <span className="flex items-center space-x-1">
                              <Phone size={11} className="text-[#141414]/60" />
                              <span>{member.phone}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Settings / Controls */}
                  <div className="flex items-center space-x-1.5 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#141414]/15">
                    {isManager ? (
                      <>
                        {isEditingContact ? (
                          <>
                            <button
                              onClick={() => saveContact(member)}
                              className="p-1 text-[#141414] hover:bg-emerald-600 hover:text-white border border-transparent hover:border-[#141414] transition-all cursor-pointer"
                              title="Save contact"
                              aria-label={`Save contact for ${member.name}`}
                            >
                              <Save size={13} />
                            </button>
                            <button
                              onClick={cancelEditingContact}
                              className="p-1 text-[#141414] hover:bg-[#141414] hover:text-white border border-transparent hover:border-[#141414] transition-all cursor-pointer"
                              title="Cancel edit"
                              aria-label={`Cancel contact edit for ${member.name}`}
                            >
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEditingContact(member)}
                            className="p-1 text-[#141414] hover:bg-[#141414] hover:text-white border border-transparent hover:border-[#141414] transition-all cursor-pointer"
                            title="Edit email and phone"
                            aria-label={`Edit email and phone for ${member.name}`}
                          >
                            <Edit2 size={13} />
                          </button>
                        )}

                        {/* Toggle Status Button */}
                        <button
                          onClick={() => toggleStatus(member)}
                          disabled={isThisMemberManager}
                          className={`flex items-center space-x-1 px-2 py-1 text-[10px] font-mono font-bold uppercase border transition-all ${isThisMemberManager
                              ? 'border-[#141414]/40 text-[#141414]/40 bg-[#F0EFEC] cursor-not-allowed'
                              : isActive
                                ? 'border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white cursor-pointer'
                                : 'border-[#141414]/40 text-[#141414]/60 hover:bg-[#141414]/10 cursor-pointer'
                            }`}
                          title={
                            isThisMemberManager
                              ? 'Managers cannot be paused'
                              : isActive
                                ? 'Set Inactive (Skips Utility Splits)'
                                : 'Set Active'
                          }
                          aria-label={
                            isThisMemberManager
                              ? `${member.name} is a manager and cannot be paused`
                              : isActive
                                ? `Set ${member.name} inactive`
                                : `Set ${member.name} active`
                          }
                        >
                          {isActive ? (
                            <>
                              <ToggleRight size={14} />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={14} />
                              <span>Paused</span>
                            </>
                          )}
                        </button>

                        {/* Toggle Role Button */}
                        <button
                          onClick={() => toggleRole(member)}
                          disabled={blocksSelfDemotion}
                          title={blocksSelfDemotion ? 'Add or promote another manager before demoting yourself' : undefined}
                          aria-label={isThisMemberManager ? `Demote ${member.name} from manager` : `Promote ${member.name} to manager`}
                          className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border border-[#141414] transition-all ${blocksSelfDemotion
                              ? 'text-[#141414]/40 cursor-not-allowed bg-[#F0EFEC]'
                              : 'text-[#141414] hover:bg-[#141414] hover:text-white cursor-pointer'
                            }`}
                        >
                          {isThisMemberManager ? 'Demote MGR' : 'Promote MGR'}
                        </button>

                        {/* Delete member option */}
                        {canDelete && (
                          <button
                            onClick={() => onDeleteMember(member.id)}
                            aria-label={`Delete ${member.name}`}
                            className="p-1 text-[#141414] hover:bg-rose-600 hover:text-white border border-transparent hover:border-[#141414] transition-all cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        {members.length > 2 && historyCount > 0 && (
                          <span
                            className="px-2 py-1 text-[10px] font-mono font-bold uppercase border border-[#141414]/30 text-[#141414]/55"
                            title="Members with meals, bazar purchases, or deposits are paused instead of deleted to preserve historical accounts."
                          >
                            Has History
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] font-mono text-gray-500 uppercase italic">
                        {isActive ? 'Active Member' : 'Paused Member'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-[#F0EFEC] border border-[#141414] flex items-start space-x-2 mt-4">
            <CircleAlert className="text-[#141414] shrink-0 mt-0.5" size={14} />
            <p className="text-[10px] font-mono uppercase text-[#141414]/80 leading-relaxed font-bold">
              <strong>Status behavior note:</strong> Paused/inactive members are temporarily skipped and will not split shared utility charges (like Bua/Cook, WIFI, or electricity) for the cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
