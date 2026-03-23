import { ArrowRightLeft, Building2, ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/components/login-form';

const highlights = [
  {
    icon: ArrowRightLeft,
    title: 'Integração futura com Channex',
    description: 'Arquitetura desacoplada via service layer para substituir mocks por API real sem retrabalho na UI.',
  },
  {
    icon: ShieldCheck,
    title: 'Proteção de rotas na raiz',
    description: 'A homepage atua como login e o middleware bloqueia qualquer acesso direto ao dashboard.',
  },
  {
    icon: Building2,
    title: 'Visão premium por quarto',
    description: 'Calendário estilo Gantt com foco em ocupação, manutenção e prevenção de overbooking.',
  },
];

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-10 px-6 py-10 lg:flex-row lg:items-center lg:px-10">
      <section className="max-w-xl space-y-8">
        <div className="space-y-4">
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-300">
            Operação exclusiva da pousada
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Unifique reservas de Booking, Expedia e Hoteis.com em um só painel.
          </h1>
          <p className="max-w-lg text-base leading-7 text-slate-300">
            MVP full-stack preparado para evoluir para um channel manager conectado ao Channex.io e persistido em MySQL com Sequelize.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {highlights.map((highlight) => (
            <div key={highlight.title} className="glass-panel rounded-[24px] p-4">
              <highlight.icon className="h-5 w-5 text-sky-300" />
              <h2 className="mt-4 text-sm font-semibold text-white">{highlight.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{highlight.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-1 justify-center lg:justify-end">
        <LoginForm />
      </section>
    </main>
  );
}
