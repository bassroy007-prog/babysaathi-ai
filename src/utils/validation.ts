export const Validators = {
  required: (value: string, label = 'This field') =>
    value.trim() ? null : `${label} is required`,

  email: (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
      ? null
      : 'Enter a valid email address',

  phone: (value: string) =>
    /^[6-9]\d{9}$/.test(value.replace(/\s/g, ''))
      ? null
      : 'Enter a valid 10-digit Indian mobile number',

  minLength: (value: string, min: number, label = 'This field') =>
    value.length >= min ? null : `${label} must be at least ${min} characters`,

  passwordMatch: (password: string, confirm: string) =>
    password === confirm ? null : 'Passwords do not match',

  positiveNumber: (value: string, label = 'Value') => {
    const n = parseFloat(value);
    return !isNaN(n) && n > 0 ? null : `${label} must be a positive number`;
  },

  name: (value: string) =>
    value.trim().length >= 2 ? null : 'Name must be at least 2 characters',
};

export function validate(rules: Array<() => string | null>): string | null {
  for (const rule of rules) {
    const error = rule();
    if (error) return error;
  }
  return null;
}
