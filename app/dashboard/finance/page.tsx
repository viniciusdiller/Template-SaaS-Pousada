'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle, Landmark, Plus, ReceiptText, WalletCards, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';
import { createExpense, getExpenses, getReservations } from '@/services/channexService';
import type { Expense, ExpenseCategory, Reservation } from '@/types/channex';

const expenseCategories: ExpenseCategory[] = ['limpeza', 'manutenção', 'impostos', 'insumos', 'comissões', 'outros'];

const categoryLabel: Record<ExpenseCategory, string> = {
  limpeza: 'Limpeza',
  manutenção: 'Manutenção',
  impostos: 'Impostos',
  insumos: 'Insumos',
  comissões: 'Comissões',
  outros: 'Outros',
};

type ExpenseForm = {
  description: string;
  amount: string;
  category: ExpenseCategory;
  date: string;
};

const initialExpenseForm: ExpenseForm = {
  description: '',
  amount: '',
  category: 'limpeza',
  date: '2026-03-23',
};

function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

export default function FinancePage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(initialExpenseForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [reservationList, expenseList] = await Promise.all([getReservations(), getExpenses()]);
      setReservations(reservationList);
      setExpenses(expenseList);
      setLoading(false);
    }

    void loadData();
  }, []);

  const grossRevenue = useMemo(
    () =>
      reservations
        .filter((reservation) => reservation.status !== 'cancelled' && reservation.status !== 'blocked')
        .reduce((total, reservation) => total + reservation.amount, 0),
    [reservations],
  );
  const totalExpenses = useMemo(() => expenses.reduce((total, expense) => total + expense.amount, 0), [expenses]);
  const netProfit = grossRevenue - totalExpenses;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.description || !form.amount || !form.date) {
      setError('Preencha descrição, valor e data para continuar.');
      return;
    }

    const amount = parseCurrencyInput(form.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      setError('Informe um valor válido maior do que zero.');
      return;
    }

    setIsSaving(true);

    try {
      const nextExpense = await createExpense({
        description: form.description,
        amount,
        category: form.category,
        date: form.date,
      });

      setExpenses((current) => [nextExpense, ...current]);
      setForm(initialExpenseForm);
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  const cards = [
    {
      title: 'Faturamento Bruto',
      value: formatCurrency(grossRevenue),
      description: 'Receita consolidada de todas as reservas ativas carregadas.',
      icon: ArrowUpCircle,
      tone: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
    },
    {
      title: 'Total de Despesas',
      value: formatCurrency(totalExpenses),
      description: 'Despesas operacionais registradas no período atual.',
      icon: ArrowDownCircle,
      tone: 'text-rose-300 bg-rose-400/10 border-rose-400/20',
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(netProfit),
      description: 'Resultado líquido após dedução de custos e comissões.',
      icon: WalletCards,
      tone: 'text-sky-300 bg-sky-400/10 border-sky-400/20',
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[28px] border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Aba financeira</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Saúde financeira da operação</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                Monitore a receita total das reservas, acompanhe custos recorrentes e registre novas despesas sem sair do painel.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30"
            >
              <Plus className="h-4 w-4" />
              Nova Despesa
            </button>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">{card.title}</p>
                    <p className="mt-4 text-3xl font-semibold text-white">{card.value}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{card.description}</p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${card.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-5 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-3 py-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-300">
                <ReceiptText className="h-4 w-4 text-sky-300" />
                Histórico de despesas
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white">Custos registrados</h3>
              <p className="mt-2 text-sm text-slate-400">Atualizado a partir do mock service preparado para futura integração via Sequelize.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              {expenses.length} lançamentos registrados
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-slate-950/60 text-left text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Descrição</th>
                    <th className="px-5 py-4 font-medium">Categoria</th>
                    <th className="px-5 py-4 font-medium">Data</th>
                    <th className="px-5 py-4 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-900/50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                        Carregando lançamentos financeiros...
                      </td>
                    </tr>
                  ) : expenses.length ? (
                    expenses.map((expense) => (
                      <tr key={expense.id} className="transition-colors hover:bg-white/[0.03]">
                        <td className="px-5 py-4 text-white">{expense.description}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-300">
                            {categoryLabel[expense.category]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{formatLongDate(expense.date)}</td>
                        <td className="px-5 py-4 text-right font-semibold text-rose-300">
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                        Ainda não existem despesas lançadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-400">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-3 py-2">
              <Landmark className="h-4 w-4 text-sky-300" />
              Receita baseada no campo <span className="font-medium text-slate-200">amount</span> das reservas.
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="w-full max-w-xl rounded-[28px] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Nova despesa</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">Adicionar lançamento financeiro</h3>
                  <p className="mt-2 text-sm text-slate-400">Registre despesas operacionais para refletir o lucro líquido da pousada.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Descrição</span>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Ex.: Reparo do sistema hidráulico"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Valor</span>
                    <input
                      type="text"
                      value={form.amount}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, amount: formatCurrencyInput(event.target.value) }))
                      }
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">Data</span>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Categoria</span>
                  <select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ExpenseCategory }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                  >
                    {expenseCategories.map((category) => (
                      <option key={category} value={category}>
                        {categoryLabel[category]}
                      </option>
                    ))}
                  </select>
                </label>

                {error ? <p className="text-sm text-rose-300">{error}</p> : null}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-3 text-sm font-medium text-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar despesa'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
