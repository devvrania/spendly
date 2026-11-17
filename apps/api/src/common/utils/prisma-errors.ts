import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}

export function isForeignKeyViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003';
}

/** Re-throw a unique-constraint violation as a friendly 409. */
export function rethrowUnique(e: unknown, message: string): never {
  if (isUniqueViolation(e)) throw new ConflictException(message);
  throw e;
}
