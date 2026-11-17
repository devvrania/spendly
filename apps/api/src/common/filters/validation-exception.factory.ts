import { BadRequestException, ValidationError } from '@nestjs/common';

export interface FieldError {
  field: string;
  messages: string[];
}

function flatten(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((err) => {
    const field = parent ? `${parent}.${err.property}` : err.property;
    const own = err.constraints ? [{ field, messages: Object.values(err.constraints) }] : [];
    return [...own, ...flatten(err.children ?? [], field)];
  });
}

/** Produces a predictable `{ statusCode, error, message, errors[] }` body. */
export function buildValidationException(errors: ValidationError[]) {
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: 'Validation failed',
    errors: flatten(errors),
  });
}
