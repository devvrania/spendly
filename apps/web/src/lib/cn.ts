import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** clsx + tailwind-merge, so a caller's `w-auto` reliably overrides a base `w-full`. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
