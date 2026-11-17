import { registerDecorator, ValidationOptions } from 'class-validator';

// NUMERIC(12,2): up to 10 integer digits and 2 decimal places.
const MONEY_RE = /^\d{1,10}(\.\d{1,2})?$/;

/** A positive amount with at most 2 decimals, given as a string (preferred) or number. */
export function IsPositiveMoney(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isPositiveMoney',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a positive amount with at most 2 decimal places (max 9,999,999,999.99)`,
        ...options,
      },
      validator: {
        validate: (value: unknown) => {
          const s = typeof value === 'number' ? String(value) : value;
          return typeof s === 'string' && MONEY_RE.test(s) && Number(s) > 0;
        },
      },
    });
}
