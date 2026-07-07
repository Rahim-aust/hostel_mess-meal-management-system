export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export function isValidMealInput(value: string, slot: MealSlot) {
  if (value === '') return true;
  if (slot === 'breakfast') return /^\d+(\.5?)?$/.test(value);
  return /^\d+$/.test(value);
}

export function parseMealQuantity(value: string, slot: MealSlot) {
  if (!isValidMealInput(value, slot)) return 0;
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  if (slot === 'breakfast') return Number.isInteger(parsed * 2) ? parsed : 0;
  return Number.isInteger(parsed) ? parsed : 0;
}
