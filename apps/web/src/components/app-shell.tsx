'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftRight, LayoutDashboard, LogOut, Plus, Settings, Tags, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMe } from '@/lib/queries';
import { useLogout } from '@/features/auth/use-logout';
import { Logo } from './logo';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/wallets', label: 'Wallets', icon: Wallet },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user } = useMe();
  const { logout, pending } = useLogout();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-stone-200/80 bg-white px-4 py-5 lg:flex">
        <Link href="/dashboard" className="px-2">
          <Logo />
        </Link>
        <Link
          href="/transactions/new"
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add transaction
        </Link>
        <nav aria-label="Main" className="mt-6 flex-1 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive(href) ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
              )}
            >
              <Icon className="h-4.5 w-4.5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-stone-100 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone-100 text-sm font-semibold text-stone-600" aria-hidden>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-900">{user?.name}</p>
              <p className="truncate text-xs text-stone-500">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              disabled={pending}
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <Link
          href="/transactions/new"
          aria-label="Add transaction"
          className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm"
        >
          <Plus className="h-4.5 w-4.5" />
        </Link>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-stone-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
              isActive(href) ? 'text-brand-700' : 'text-stone-500',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
