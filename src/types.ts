export type MemberStatus = 'Active' | 'Inactive';
export type MemberRole = 'Manager' | 'Member';

export interface MessBranch {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  branchId: string;
  name: string;
  email: string;
  phone: string;
  status: MemberStatus;
  role: MemberRole;
}

export interface MealLog {
  id: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  memberId: string;
  breakfast: number; // e.g. 0, 0.5, 1
  lunch: number; // integers only, e.g. 0, 1, 2, 5
  dinner: number; // integers only, e.g. 0, 1, 2, 5
}

export interface BazarExpense {
  id: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  buyerId: string; // Member ID
  details: string;
}

export interface Utility {
  id: string;
  branchId: string;
  month: string; // YYYY-MM
  bua: number; // Cook
  electricity: number;
  gas: number;
  waste: number;
  internet: number;
  others: number;
}

export interface Deposit {
  id: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  memberId: string;
  amount: number;
}

export interface MemberSummary {
  member: Member;
  totalMeals: number;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  depositedAmount: number;
  mealCost: number;
  utilityShare: number;
  totalCost: number;
  balance: number; // Positive means extra deposit (refundable/to-be-paid), negative means due (must pay)
}

export interface MonthlySummary {
  branchId: string;
  month: string; // YYYY-MM
  totalBazarExpense: number;
  totalMeals: number;
  mealRate: number;
  totalUtilities: number;
  utilitySharePerMember: number;
  totalDeposits: number;
  memberSummaries: MemberSummary[];
}
