import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-brand-100/70 to-transparent" />
      <Link href="/" className="relative mb-8">
        <Logo className="text-lg" />
      </Link>
      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200/80 bg-white p-7 shadow-sm">{children}</div>
      <p className="relative mt-6 text-center text-xs text-stone-400">Track income and expenses in PKR, calmly.</p>
    </div>
  );
}
