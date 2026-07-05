export function isValidMealInput(value: string) {
  return value === '' || /^\d+(\.5?)?$/.test(value);
}

export function parseMealQuantity(value: string) {
  if (!isValidMealInput(value)) return 0;
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return Number.isInteger(parsed * 2) ? parsed : 0;
}
