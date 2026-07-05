import { BazarExpense, Deposit, MealLog, Member, Utility } from '../types';

export interface AppBackup {
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

  const requiredArrays = ['members', 'mealLogs', 'bazarExpenses', 'utilities', 'deposits'] as const;
  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) {
      errors.push(`${key} must be an array.`);
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  const backup = data as unknown as AppBackup;
  const memberIds = new Set<string>();

  backup.members.forEach((member, index) => {
    if (!isObject(member)) {
      errors.push(`members[${index}] must be an object.`);
      return;
    }
    if (typeof member.id !== 'string' || !member.id) errors.push(`members[${index}].id is required.`);
    if (memberIds.has(member.id)) errors.push(`Duplicate member id: ${member.id}.`);
    memberIds.add(member.id);
    if (typeof member.name !== 'string' || !member.name.trim()) errors.push(`members[${index}].name is required.`);
    if (typeof member.email !== 'string') errors.push(`members[${index}].email must be a string.`);
    if (typeof member.phone !== 'string') errors.push(`members[${index}].phone must be a string.`);
    if (member.status !== 'Active' && member.status !== 'Inactive') errors.push(`members[${index}].status is invalid.`);
    if (member.role !== 'Manager' && member.role !== 'Member') errors.push(`members[${index}].role is invalid.`);
  });

  const managerCount = backup.members.filter(member => member.role === 'Manager').length;
  if (managerCount !== 1) errors.push(`Backup must contain exactly one Manager. Found ${managerCount}.`);

  backup.mealLogs.forEach((log, index) => {
    if (!isDate(log.date)) errors.push(`mealLogs[${index}].date must be YYYY-MM-DD.`);
    if (!memberIds.has(log.memberId)) errors.push(`mealLogs[${index}].memberId does not exist.`);
    if (!isNonNegativeNumber(log.lunch)) errors.push(`mealLogs[${index}].lunch must be a non-negative number.`);
    if (!isNonNegativeNumber(log.dinner)) errors.push(`mealLogs[${index}].dinner must be a non-negative number.`);
  });

  backup.bazarExpenses.forEach((expense, index) => {
    if (!isDate(expense.date)) errors.push(`bazarExpenses[${index}].date must be YYYY-MM-DD.`);
    if (!isNonNegativeNumber(expense.amount) || expense.amount <= 0) errors.push(`bazarExpenses[${index}].amount must be greater than 0.`);
    if (!memberIds.has(expense.buyerId)) errors.push(`bazarExpenses[${index}].buyerId does not exist.`);
    if (typeof expense.details !== 'string' || !expense.details.trim()) errors.push(`bazarExpenses[${index}].details is required.`);
  });

  backup.utilities.forEach((utility, index) => {
    if (!isMonth(utility.month)) errors.push(`utilities[${index}].month must be YYYY-MM.`);
    for (const key of ['bua', 'electricity', 'gas', 'waste', 'internet', 'others'] as const) {
      if (!isNonNegativeNumber(utility[key])) errors.push(`utilities[${index}].${key} must be a non-negative number.`);
    }
  });

  backup.deposits.forEach((deposit, index) => {
    if (!isDate(deposit.date)) errors.push(`deposits[${index}].date must be YYYY-MM-DD.`);
    if (!memberIds.has(deposit.memberId)) errors.push(`deposits[${index}].memberId does not exist.`);
    if (!isNonNegativeNumber(deposit.amount) || deposit.amount <= 0) errors.push(`deposits[${index}].amount must be greater than 0.`);
  });

  return errors.length > 0 ? { valid: false, errors } : { valid: true, backup, errors: [] };
}
