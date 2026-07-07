import { BazarExpense, Deposit, MealLog, Member, Utility, MessBranch } from '../types';
import { normalizeState } from './dataStore';

export interface AppBackup {
  branches: MessBranch[];
  members: Member[];
  mealLogs: MealLog[];
  bazarExpenses: BazarExpense[];
  utilities: Utility[];
  deposits: Deposit[];
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isDate = (value: unknown) => {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const isMonth = (value: unknown) => {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value);
};

const isNonNegativeNumber = (value: unknown) => {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
};

export function validateBackup(data: unknown): { valid: boolean; backup?: AppBackup; errors: string[] } {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { valid: false, errors: ['Backup root must be an object.'] };
  }

  const normalized = normalizeState(data);
  const requiredArrays = ['branches', 'members', 'mealLogs', 'bazarExpenses', 'utilities', 'deposits'] as const;
  for (const key of requiredArrays) {
    if (!Array.isArray(normalized[key])) {
      errors.push(`${key} must be an array.`);
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  const backup = normalized as AppBackup;
  const branchIds = new Set<string>();
  const memberIds = new Set<string>();

  backup.branches.forEach((branch, index) => {
    if (!isObject(branch)) {
      errors.push(`branches[${index}] must be an object.`);
      return;
    }
    if (typeof branch.id !== 'string' || !branch.id) errors.push(`branches[${index}].id is required.`);
    if (branchIds.has(branch.id)) errors.push(`Duplicate branch id: ${branch.id}.`);
    branchIds.add(branch.id);
    if (typeof branch.name !== 'string' || !branch.name.trim()) errors.push(`branches[${index}].name is required.`);
  });

  backup.members.forEach((member, index) => {
    if (!isObject(member)) {
      errors.push(`members[${index}] must be an object.`);
      return;
    }
    if (typeof member.id !== 'string' || !member.id) errors.push(`members[${index}].id is required.`);
    if (!branchIds.has(member.branchId)) errors.push(`members[${index}].branchId does not exist.`);
    if (memberIds.has(member.id)) errors.push(`Duplicate member id: ${member.id}.`);
    memberIds.add(member.id);
    if (typeof member.name !== 'string' || !member.name.trim()) errors.push(`members[${index}].name is required.`);
    if (typeof member.email !== 'string') errors.push(`members[${index}].email must be a string.`);
    if (typeof member.phone !== 'string') errors.push(`members[${index}].phone must be a string.`);
    if (member.status !== 'Active' && member.status !== 'Inactive') errors.push(`members[${index}].status is invalid.`);
    if (member.role !== 'Manager' && member.role !== 'Member') errors.push(`members[${index}].role is invalid.`);
  });

  for (const branchId of branchIds) {
    const managerCount = backup.members.filter(member => member.branchId === branchId && member.role === 'Manager').length;
    if (managerCount > 1) errors.push(`Branch ${branchId} has more than one Manager.`);
  }

  backup.mealLogs.forEach((log, index) => {
    if (!branchIds.has(log.branchId)) errors.push(`mealLogs[${index}].branchId does not exist.`);
    if (!isDate(log.date)) errors.push(`mealLogs[${index}].date must be YYYY-MM-DD.`);
    if (!memberIds.has(log.memberId)) errors.push(`mealLogs[${index}].memberId does not exist.`);
    if (!isNonNegativeNumber(log.breakfast)) errors.push(`mealLogs[${index}].breakfast must be a non-negative number.`);
    if (!isNonNegativeNumber(log.lunch)) errors.push(`mealLogs[${index}].lunch must be a non-negative number.`);
    if (!isNonNegativeNumber(log.dinner)) errors.push(`mealLogs[${index}].dinner must be a non-negative number.`);
  });

  backup.bazarExpenses.forEach((expense, index) => {
    if (!branchIds.has(expense.branchId)) errors.push(`bazarExpenses[${index}].branchId does not exist.`);
    if (!isDate(expense.date)) errors.push(`bazarExpenses[${index}].date must be YYYY-MM-DD.`);
    if (!isNonNegativeNumber(expense.amount) || expense.amount <= 0) errors.push(`bazarExpenses[${index}].amount must be greater than 0.`);
    if (!memberIds.has(expense.buyerId)) errors.push(`bazarExpenses[${index}].buyerId does not exist.`);
    if (typeof expense.details !== 'string' || !expense.details.trim()) errors.push(`bazarExpenses[${index}].details is required.`);
  });

  backup.utilities.forEach((utility, index) => {
    if (!branchIds.has(utility.branchId)) errors.push(`utilities[${index}].branchId does not exist.`);
    if (!isMonth(utility.month)) errors.push(`utilities[${index}].month must be YYYY-MM.`);
    for (const key of ['bua', 'electricity', 'gas', 'waste', 'internet', 'others'] as const) {
      if (!isNonNegativeNumber(utility[key])) errors.push(`utilities[${index}].${key} must be a non-negative number.`);
    }
  });

  backup.deposits.forEach((deposit, index) => {
    if (!branchIds.has(deposit.branchId)) errors.push(`deposits[${index}].branchId does not exist.`);
    if (!isDate(deposit.date)) errors.push(`deposits[${index}].date must be YYYY-MM-DD.`);
    if (!memberIds.has(deposit.memberId)) errors.push(`deposits[${index}].memberId does not exist.`);
    if (!isNonNegativeNumber(deposit.amount) || deposit.amount <= 0) errors.push(`deposits[${index}].amount must be greater than 0.`);
  });

  return errors.length > 0 ? { valid: false, errors } : { valid: true, backup, errors: [] };
}
