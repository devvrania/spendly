import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, BarChart3, ShieldCheck, Tags, Wallet } from 'lucide-react';
import { Logo } from '@/components/logo';
import { DemoButton } from '@/features/auth/demo-button';

export const metadata: Metadata = {
  title: 'Spendly — calm personal finance tracking',
};

// Logged-in visitors never see this page: middleware sends them to /dashboard.

const features = [
  {
    icon: Wallet,
    title: 'Wallets that add up',
    body: 'Keep cash, bank and savings apart. Balances are always calculated from your transactions, so they never drift.',
  },
  {
    icon: Tags,
    title: 'Categories your way',
    body: 'Start with sensible income and expense categories, then rename, add or archive them as your life changes.',
  },
  {
    icon: BarChart3,
    title: 'See where it goes',
    body: 'Monthly income vs. expenses, a spending breakdown by category and your net for any month, at a glance.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    body: 'Your data is yours alone. The database itself refuses to link your records to anyone else’s.',
  },
];

const steps = [
  { n: '1', title: 'Create an account', body: 'You get a main wallet and starter categories straight away.' },
  { n: '2', title: 'Log what comes and goes', body: 'Add income and expenses in seconds, in PKR.' },
  { n: '3', title: 'Read your month', body: 'The dashboard turns your entries into totals and trends.' },
];

export default function Home() {
  return (
    <div className="min-h-dvh">
      {/* Header + hero fill exactly one screen, so the next section never peeks in cut off. */}
      <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-100/70 via-brand-50/30 to-transparent" />
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Spendly home">
          <Logo className="text-lg" />
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
            Log in
          </Link>
          <Link href="/register" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700">
            Sign up
          </Link>
        </nav>
      </header>

        {/* Hero */}
        <section className="relative flex flex-1 items-center">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="mb-4 inline-flex items-center rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700">
                Personal finance, without the spreadsheet
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                Know where your money goes.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-stone-600">
                Spendly is a calm, simple place to track income and expenses across your wallets, and to see each month clearly.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 sm:w-auto text-sm font-medium text-white shadow-sm hover:bg-brand-700"
                >
                  Get started free <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                {/* "Log in" stays in the header; the second hero action lets visitors look around first. */}
                <DemoButton className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 sm:w-auto text-sm font-medium text-stone-800 shadow-xs hover:bg-stone-50" />
              </div>
              <p className="mt-3 text-xs text-stone-500">No sign-up needed. The demo is filled with sample data and resets after 24 hours.</p>
            </div>

            <PreviewCard />
          </div>
        </section>
      </div>

      <main>

        {/* Features */}
        <section className="border-t border-stone-200/80 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Everything you need, nothing you don’t</h2>
            <p className="mt-3 max-w-2xl text-stone-600">No bank logins, no budgeting jargon. Just your entries, organised.</p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Up and running in a minute</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">{s.n}</span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-stone-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-3xl bg-brand-900 px-6 py-12 text-center text-white sm:px-12">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Start tracking this month</h2>
            <p className="mx-auto mt-3 max-w-md text-brand-100">Free to use. Your first wallet and categories are ready the moment you sign up.</p>
            <Link
              href="/register"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-brand-900 hover:bg-brand-50"
            >
              Create your account <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:px-6">
          <Logo className="text-sm" />
          <p>Track income and expenses in PKR, calmly.</p>
        </div>
      </footer>
    </div>
  );
}

/** Static, illustrative dashboard preview (no real data). */
function PreviewCard() {
  const bars = [
    { m: 'Jun', i: 70, e: 52 },
    { m: 'Jul', i: 72, e: 61 },
    { m: 'Aug', i: 70, e: 48 },
    { m: 'Sep', i: 78, e: 57 },
    { m: 'Oct', i: 74, e: 66 },
    { m: 'Nov', i: 80, e: 50 },
  ];
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xl shadow-brand-900/5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">November</p>
          <span className="rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-500">All wallets</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Income" value="185,000" tone="text-income" />
          <Stat label="Expenses" value="112,450" tone="text-expense" />
          <Stat label="Net" value="72,550" tone="text-stone-900" />
        </div>
        <div className="mt-5 rounded-xl bg-stone-50 p-4">
          <div className="flex h-32 items-end justify-between gap-3">
            {bars.map((b) => (
              <div key={b.m} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-28 w-full items-end justify-center gap-1">
                  <span className="w-2.5 rounded-t bg-income" style={{ height: `${b.i}%` }} />
                  <span className="w-2.5 rounded-t bg-expense/80" style={{ height: `${b.e}%` }} />
                </div>
                <span className="text-[10px] text-stone-400">{b.m}</span>
              </div>
            ))}
          </div>
        </div>
        <ul className="mt-4 divide-y divide-stone-100 text-sm">
          <Row name="Salary" meta="Main Wallet" amount="+150,000" tone="text-income" />
          <Row name="Groceries" meta="Cash" amount="−8,240" tone="text-expense" />
          <Row name="Electricity bill" meta="Main Wallet" amount="−6,900" tone="text-expense" />
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-stone-200/80 p-2.5 sm:p-3">
      <p className="text-[11px] text-stone-500">{label}</p>
      <p className={`tabular mt-1 whitespace-nowrap text-xs font-semibold sm:text-sm ${tone}`}>Rs {value}</p>
    </div>
  );
}

function Row({ name, meta, amount, tone }: { name: string; meta: string; amount: string; tone: string }) {
  return (
    <li className="flex items-center justify-between py-2.5">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-stone-400">{meta}</p>
      </div>
      <span className={`tabular font-medium ${tone}`}>Rs {amount}</span>
    </li>
  );
}
