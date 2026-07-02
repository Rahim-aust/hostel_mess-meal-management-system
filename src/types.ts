export type MemberStatus = 'Active' | 'Inactive';
export type MemberRole = 'Manager' | 'Member';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: MemberStatus;
  role: MemberRole;
}

export interface MealLog {
  id: string;
  date: string; // YYYY-MM-DD
  memberId: string;
  lunch: number; // e.g. 0, 0.5, 1, 1.5, 2
  dinner: number; // e.g. 0, 0.5, 1, 1.5, 2
}

export interface BazarExpense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  buyerId: string; // Member ID
  details: string;
}

export interface Utility {
  id: string;
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
  date: string; // YYYY-MM-DD
  memberId: string;
  amount: number;
}

export interface MemberSummary {
  member: Member;
  totalMeals: number;
  lunchCount: number;
  dinnerCount: number;
  depositedAmount: number;
  mealCost: number;
  utilityShare: number;
  totalCost: number;
  balance: number; // Positive means extra deposit (refundable/to-be-paid), negative means due (must pay)
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  totalBazarExpense: number;
  totalMeals: number;
  mealRate: number;
  totalUtilities: number;
  utilitySharePerMember: number;
  totalDeposits: number;
  memberSummaries: MemberSummary[];
}
