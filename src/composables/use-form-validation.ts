import { reactive } from 'vue';
import { EMAIL_RE, PHONE_RE, SLUG_RE, URL_RE } from '../utils/validation';

export { EMAIL_RE, PHONE_RE, SLUG_RE, URL_RE };

export type Validator<V = unknown> = (value: V) => string | null;

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export function required(message = 'Required'): Validator {
  return (v) => (isEmpty(v) ? message : null);
}

export function email(message = 'Invalid email address'): Validator<string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    return EMAIL_RE.test(String(v)) ? null : message;
  };
}

export function phone(message = 'Invalid phone number'): Validator<string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    return PHONE_RE.test(String(v)) ? null : message;
  };
}

export function slug(message = 'Lowercase letters, numbers, and hyphens only'): Validator<string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    return SLUG_RE.test(String(v)) ? null : message;
  };
}

export function url(message = 'Invalid URL'): Validator<string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    return URL_RE.test(String(v)) ? null : message;
  };
}

export function pattern(re: RegExp, message: string): Validator<string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    return re.test(String(v)) ? null : message;
  };
}

export function minLength(min: number, message?: string): Validator<string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    return String(v).length >= min ? null : (message ?? `Must be at least ${min} characters`);
  };
}

export function maxLength(max: number, message?: string): Validator<string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    return String(v).length <= max ? null : (message ?? `Must be at most ${max} characters`);
  };
}

export function minValue(min: number, message?: string): Validator<number | string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isNaN(n)) return null;
    return n >= min ? null : (message ?? `Must be at least ${min}`);
  };
}

export function maxValue(max: number, message?: string): Validator<number | string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isNaN(n)) return null;
    return n <= max ? null : (message ?? `Must be at most ${max}`);
  };
}

export function range(min: number, max: number, message?: string): Validator<number | string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isNaN(n)) return null;
    return n >= min && n <= max ? null : (message ?? `Must be between ${min} and ${max}`);
  };
}

export function numeric(message = 'Must be a number'): Validator<number | string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? null : message;
  };
}

export function integer(message = 'Must be a whole number'): Validator<number | string | undefined | null> {
  return (v) => {
    if (isEmpty(v)) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isInteger(n) ? null : message;
  };
}

type FieldRules<T> = {
  [K in keyof T]?: Validator<T[K]> | Array<Validator<T[K]>>;
};

type Errors<T> = { [K in keyof T]?: string | null };

export interface UseFormValidation<T extends object> {
  errors: Errors<T>;
  validate: (values: T) => boolean;
  validateField: <K extends keyof T>(field: K, value: T[K]) => boolean;
  clearErrors: () => void;
  clearError: <K extends keyof T>(field: K) => void;
  setError: <K extends keyof T>(field: K, message: string | null) => void;
  hasErrors: () => boolean;
  firstError: () => string | null;
}

export function useFormValidation<T extends object>(
  rules: FieldRules<T>,
): UseFormValidation<T> {
  const errors = reactive({}) as Errors<T>;

  function runRules<K extends keyof T>(field: K, value: T[K]): string | null {
    const rule = rules[field];
    if (!rule) return null;
    const list = Array.isArray(rule) ? rule : [rule];
    for (const v of list) {
      const err = v(value);
      if (err) return err;
    }
    return null;
  }

  function validateField<K extends keyof T>(field: K, value: T[K]): boolean {
    const err = runRules(field, value);
    errors[field] = err;
    return !err;
  }

  function validate(values: T): boolean {
    let ok = true;
    for (const key of Object.keys(rules) as Array<keyof T>) {
      const fieldOk = validateField(key, values[key]);
      if (!fieldOk) ok = false;
    }
    return ok;
  }

  function clearErrors() {
    for (const key of Object.keys(errors) as Array<keyof T>) {
      errors[key] = null;
    }
  }

  function clearError<K extends keyof T>(field: K) {
    errors[field] = null;
  }

  function setError<K extends keyof T>(field: K, message: string | null) {
    errors[field] = message;
  }

  function hasErrors(): boolean {
    return Object.values(errors).some((e) => !!e);
  }

  function firstError(): string | null {
    for (const e of Object.values(errors)) {
      if (e) return e as string;
    }
    return null;
  }

  return { errors, validate, validateField, clearErrors, clearError, setError, hasErrors, firstError };
}
