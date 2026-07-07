import { Member, MealLog, BazarExpense, Utility, Deposit, MonthlySummary, MemberSummary, MessBranch } from '../types';

export const DEFAULT_BRANCH_ID = 'branch-main';

export const DEFAULT_BRANCHES: MessBranch[] = [
  { id: DEFAULT_BRANCH_ID, name: 'Main Branch' },
  { id: 'branch-2', name: 'Branch 2' },
  { id: 'branch-3', name: 'Branch 3' },
  { id: 'branch-4', name: 'Branch 4' },
];

// Default member list
export const DEFAULT_MEMBERS: Member[] = [
  { id: 'm1', branchId: DEFAULT_BRANCH_ID, name: 'Rahim', email: 'rahim@mess.com', phone: '01711111111', status: 'Active', role: 'Manager' },
  { id: 'm2', branchId: DEFAULT_BRANCH_ID, name: 'Shuvo', email: 'shuvo@mess.com', phone: '01722222222', status: 'Active', role: 'Member' },
  { id: 'm3', branchId: DEFAULT_BRANCH_ID, name: 'Robi', email: 'robi@mess.com', phone: '01733333333', status: 'Active', role: 'Member' },
  { id: 'm4', branchId: DEFAULT_BRANCH_ID, name: 'Sani', email: 'sani@mess.com', phone: '01744444444', status: 'Active', role: 'Member' },
  { id: 'm5', branchId: DEFAULT_BRANCH_ID, name: 'Nayem', email: 'nayem@mess.com', phone: '01755555555', status: 'Active', role: 'Member' },
  { id: 'm6', branchId: DEFAULT_BRANCH_ID, name: 'Noman', email: 'noman@mess.com', phone: '01766666666', status: 'Active', role: 'Member' },
  { id: 'm7', branchId: DEFAULT_BRANCH_ID, name: 'Nazmul', email: 'nazmul@mess.com', phone: '01777777777', status: 'Active', role: 'Member' },
  { id: 'm8', branchId: DEFAULT_BRANCH_ID, name: 'Rafi', email: 'rafi@mess.com', phone: '01788888888', status: 'Active', role: 'Member' },
];

// Seed data helper to get date strings relative to current year/month
const getRelativeDateStr = (dayOffsetFromToday: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffsetFromToday);
  return d.toISOString().split('T')[0];
};

const getRelativeMonthStr = (monthOffset: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  return d.toISOString().substring(0, 7); // YYYY-MM
};

export const getSeedData = () => {
  const currentMonth = getRelativeMonthStr(0);
  const prevMonth = getRelativeMonthStr(-1);

  // Generate seed meal logs for the previous month (3 days of demo data)
  const seedMealLogs: MealLog[] = [];
  const seedBazarExpenses: BazarExpense[] = [];
  const seedDeposits: Deposit[] = [];

  // Previous Month Samples
  const daysInPrevMonth = [5, 12, 20, 26];
  daysInPrevMonth.forEach((day, index) => {
    const dateStr = `${prevMonth}-${day < 10 ? '0' + day : day}`;
    
    // Daily meals for 8 members
    DEFAULT_MEMBERS.forEach((m) => {
      // Rahim eats full; others vary
      const mIdx = parseInt(m.id.substring(1));
      const lunchVal = (mIdx + day) % 3 === 0 ? 0.5 : (mIdx + day) % 4 === 0 ? 0 : 1;
      const dinnerVal = (mIdx + day) % 5 === 0 ? 2 : (mIdx + day) % 3 === 0 ? 0 : 1;
      seedMealLogs.push({
        id: `ml-prev-${m.id}-${day}`,
        branchId: DEFAULT_BRANCH_ID,
        date: dateStr,
        memberId: m.id,
        breakfast: index % 2 === 0 ? 1 : 0.5,
        lunch: lunchVal,
        dinner: dinnerVal,
      });
    });
  });

  // Sample Bazar Expenses for previous month
  seedBazarExpenses.push(
    { id: 'be-prev-1', branchId: DEFAULT_BRANCH_ID, date: `${prevMonth}-05`, amount: 1800, buyerId: 'm1', details: 'Rice 25kg, Soybean Oil 5L, Salt, Onions' },
    { id: 'be-prev-2', branchId: DEFAULT_BRANCH_ID, date: `${prevMonth}-12`, amount: 2400, buyerId: 'm2', details: 'Chicken 4kg, Potatoes, Ginger, Garlic' },
    { id: 'be-prev-3', branchId: DEFAULT_BRANCH_ID, date: `${prevMonth}-20`, amount: 1550, buyerId: 'm4', details: 'Fish, Vegetables, Eggs 2 Crates' },
    { id: 'be-prev-4', branchId: DEFAULT_BRANCH_ID, date: `${prevMonth}-26`, amount: 1150, buyerId: 'm7', details: 'Beef 1.5kg, Spices, Daal' }
  );

  // Sample Deposits for previous month
  DEFAULT_MEMBERS.forEach((m) => {
    // Rahim deposited 2500, others 2000 or 1500
    const amt = m.id === 'm1' ? 3000 : m.id === 'm3' || m.id === 'm5' ? 1800 : 2000;
    seedDeposits.push({
      id: `dp-prev-${m.id}`,
      branchId: DEFAULT_BRANCH_ID,
      date: `${prevMonth}-02`,
      memberId: m.id,
      amount: amt
    });
  });

  // Previous Month Utilities
  const seedUtilities: Utility[] = [
    {
      id: 'ut-prev',
      branchId: DEFAULT_BRANCH_ID,
      month: prevMonth,
      bua: 3500,
      electricity: 1450,
      gas: 950,
      waste: 100,
      internet: 500,
      others: 200
    },
    {
      id: 'ut-current',
      branchId: DEFAULT_BRANCH_ID,
      month: currentMonth,
      bua: 3500,
      electricity: 1200,
      gas: 950,
      waste: 100,
      internet: 500,
      others: 150
    }
  ];

  // Current Month Samples (some records to make it active)
  const currentDays = [-5, -3, -1, 0];
  currentDays.forEach((dayOffset) => {
    const dateStr = getRelativeDateStr(dayOffset);
    // Don't generate future logs
    if (dateStr.substring(0, 7) === currentMonth) {
      DEFAULT_MEMBERS.forEach((m) => {
        const mIdx = parseInt(m.id.substring(1));
        const lunchVal = (mIdx + Math.abs(dayOffset)) % 4 === 0 ? 0 : 1;
        const dinnerVal = 1;
        seedMealLogs.push({
          id: `ml-curr-${m.id}-${Math.abs(dayOffset)}`,
          branchId: DEFAULT_BRANCH_ID,
          date: dateStr,
          memberId: m.id,
          breakfast: 1,
          lunch: lunchVal,
          dinner: dinnerVal,
        });
      });
    }
  });

  seedBazarExpenses.push(
    { id: 'be-curr-1', branchId: DEFAULT_BRANCH_ID, date: getRelativeDateStr(-4), amount: 1200, buyerId: 'm1', details: 'Grocery essentials (Oil, Salt, Rice)' },
    { id: 'be-curr-2', branchId: DEFAULT_BRANCH_ID, date: getRelativeDateStr(-2), amount: 1600, buyerId: 'm3', details: 'Chicken, spices, milk' }
  );

  DEFAULT_MEMBERS.forEach((m) => {
    seedDeposits.push({
      id: `dp-curr-${m.id}`,
      branchId: DEFAULT_BRANCH_ID,
      date: getRelativeDateStr(-6),
      memberId: m.id,
      amount: 2500
    });
  });

  return {
    branches: DEFAULT_BRANCHES,
    members: DEFAULT_MEMBERS,
    mealLogs: seedMealLogs,
    bazarExpenses: seedBazarExpenses,
    utilities: seedUtilities,
    deposits: seedDeposits
  };
};

// Calculate all statistics for a given month (YYYY-MM)
export const calculateMonthlySummary = (
  members: Member[],
  mealLogs: MealLog[],
  bazarExpenses: BazarExpense[],
  utilities: Utility[],
  deposits: Deposit[],
  targetMonth: string // YYYY-MM
): MonthlySummary => {
  
  // 1. Filter Bazar Expenses for the target month
  const monthBazar = bazarExpenses.filter(e => e.date.substring(0, 7) === targetMonth);
  const totalBazarExpense = monthBazar.reduce((sum, e) => sum + e.amount, 0);

  // 2. Filter Meal Logs for the target month
  const monthMealLogs = mealLogs.filter(log => log.date.substring(0, 7) === targetMonth);
  
  // 3. Count total meals
  const totalMeals = monthMealLogs.reduce((sum, log) => sum + (log.breakfast || 0) + log.lunch + log.dinner, 0);

  // 4. Calculate Meal Rate (Total Bazar Expense / Total Meals Consumed)
  const mealRate = totalMeals > 0 ? totalBazarExpense / totalMeals : 0;

  // 5. Get utility cost for this month
  const monthUtility = utilities.find(u => u.month === targetMonth) || {
    id: 'temp', month: targetMonth, bua: 0, electricity: 0, gas: 0, waste: 0, internet: 0, others: 0
  };
  const totalUtilities = monthUtility.bua + monthUtility.electricity + monthUtility.gas + 
                         monthUtility.waste + monthUtility.internet + monthUtility.others;

  // 6. Active Members count for utility distribution
  const activeMembers = members.filter(m => m.status === 'Active');
  const activeMembersCount = activeMembers.length > 0 ? activeMembers.length : members.length;
  const utilitySharePerMember = totalUtilities / (activeMembersCount || 1);

  // 7. Filter Deposits for this month
  const monthDeposits = deposits.filter(d => d.date.substring(0, 7) === targetMonth);
  const totalDeposits = monthDeposits.reduce((sum, d) => sum + d.amount, 0);

  // 8. Individual summaries
  const memberSummaries: MemberSummary[] = members.map(member => {
    // Member meal logs in this month
    const mLogs = monthMealLogs.filter(log => log.memberId === member.id);
    const breakfastCount = mLogs.reduce((sum, log) => sum + (log.breakfast || 0), 0);
    const lunchCount = mLogs.reduce((sum, log) => sum + log.lunch, 0);
    const dinnerCount = mLogs.reduce((sum, log) => sum + log.dinner, 0);
    const totalMemberMeals = breakfastCount + lunchCount + dinnerCount;

    // Deposits for this member in this month
    const mDeposits = monthDeposits.filter(d => d.memberId === member.id);
    const depositedAmount = mDeposits.reduce((sum, d) => sum + d.amount, 0);

    // Costs
    const mealCost = totalMemberMeals * mealRate;
    const utilityShare = member.status === 'Active' ? utilitySharePerMember : 0;
    const totalCost = mealCost + utilityShare;

    // Balance
    const balance = depositedAmount - totalCost;

    return {
      member,
      totalMeals: totalMemberMeals,
      breakfastCount,
      lunchCount,
      dinnerCount,
      depositedAmount,
      mealCost,
      utilityShare,
      totalCost,
      balance
    };
  });

  return {
    branchId: members[0]?.branchId || DEFAULT_BRANCH_ID,
    month: targetMonth,
    totalBazarExpense,
    totalMeals,
    mealRate,
    totalUtilities,
    utilitySharePerMember,
    totalDeposits,
    memberSummaries
  };
};

export const normalizeState = (state: any) => {
  const branches = Array.isArray(state.branches) && state.branches.length > 0
    ? state.branches
    : DEFAULT_BRANCHES;

  return {
    branches,
    members: (state.members || []).map((member: any) => ({
      ...member,
      branchId: member.branchId || DEFAULT_BRANCH_ID,
    })),
    mealLogs: (state.mealLogs || []).map((log: any) => ({
      ...log,
      branchId: log.branchId || DEFAULT_BRANCH_ID,
      breakfast: typeof log.breakfast === 'number' ? log.breakfast : 0,
    })),
    bazarExpenses: (state.bazarExpenses || []).map((expense: any) => ({
      ...expense,
      branchId: expense.branchId || DEFAULT_BRANCH_ID,
    })),
    utilities: (state.utilities || []).map((utility: any) => ({
      ...utility,
      branchId: utility.branchId || DEFAULT_BRANCH_ID,
    })),
    deposits: (state.deposits || []).map((deposit: any) => ({
      ...deposit,
      branchId: deposit.branchId || DEFAULT_BRANCH_ID,
    })),
  };
};

// Local storage management helpers
export const loadLocalState = () => {
  try {
    const saved = localStorage.getItem('mess_meal_system_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.members && parsed.mealLogs && parsed.bazarExpenses && parsed.utilities && parsed.deposits) {
        return normalizeState(parsed);
      }
    }
  } catch (e) {
    console.error("Error reading localStorage", e);
  }
  
  // Return seed data if nothing is saved
  const seed = getSeedData();
  saveLocalState(seed);
  return seed;
};

export const saveLocalState = (state: {
  branches: MessBranch[];
  members: Member[];
  mealLogs: MealLog[];
  bazarExpenses: BazarExpense[];
  utilities: Utility[];
  deposits: Deposit[];
}) => {
  try {
    localStorage.setItem('mess_meal_system_data', JSON.stringify(state));
  } catch (e) {
    console.error("Error writing localStorage", e);
  }
};
