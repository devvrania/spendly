import { registerDecorator, ValidationOptions } from 'class-validator';
import { isCalendarDate } from '../utils/date';

export function IsCalendarDate(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isCalendarDate',
      target: object.constructor,
      propertyName,
      options: { message: `${propertyName} must be a valid date in YYYY-MM-DD format`, ...options },
      validator: { validate: (value: unknown) => isCalendarDate(value) },
    });
}
