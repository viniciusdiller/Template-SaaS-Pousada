'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarRange, Landmark, PanelLeftClose } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    href: '/dashboard/calendar',
    label: 'Calendário',
    description: 'Operação e moderação de reservas',
    icon: CalendarRange,
  },
  {
    href: '/dashboard/finance',
    label: 'Financeiro',
    description: 'KPIs, despesas e margem líquida',
    icon: Landmark,
  },
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-white/10 bg-slate-900/85 p-5 shadow-2xl shadow-slate-950/30">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Channel Manager</p>
              <h1 className="mt-3 text-2xl font-semibold text-white">Empresa Sancho</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Painel operacional para disponibilidade, moderação de reservas e controle financeiro.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-3 text-slate-300">
              <PanelLeftClose className="h-5 w-5" />
            </div>
          </div>

          <nav className="mt-5 space-y-3">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block rounded-[24px] border px-4 py-4 transition-all',
                    isActive
                      ? 'border-sky-400/40 bg-sky-500/10 shadow-lg shadow-sky-950/20'
                      : 'border-white/8 bg-slate-950/40 hover:border-white/15 hover:bg-slate-800/80',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'rounded-2xl p-3',
                        isActive ? 'bg-sky-400/15 text-sky-300' : 'bg-slate-800/80 text-slate-300',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
