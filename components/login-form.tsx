"use client";

import { motion } from "framer-motion";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  firstAllowedDashboardRoute,
  type SessionUser,
} from "@/lib/auth-shared";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@pousadasancho.com",
      password: "sancho123",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    setLoading(false);

    const payload = (await response.json()) as {
      message?: string;
      user?: SessionUser;
    };

    if (!response.ok) {
      setError(payload.message ?? "Nao foi possivel acessar a conta.");
      return;
    }

    router.push(firstAllowedDashboardRoute(payload.user ?? null));
    router.refresh();
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onSubmit={handleSubmit(onSubmit)}
      className="glass-panel w-full max-w-md rounded-[32px] p-8"
    >
      <div className="mb-8 space-y-2">
        <span className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-sky-200">
          Sistema de Gestão de Reservas
        </span>
        <h1 className="text-3xl font-semibold text-white">
          Bem-vindo à {process.env.APP_NAME}
        </h1>
        <p className="text-sm leading-6 text-slate-300">
          Entre para acompanhar a ocupação, organizar bloqueios e manter o
          calendário da sua hospedagem sempre atualizado.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            E-mail
          </span>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <Mail className="h-4 w-4 text-slate-400" />
            <input
              type="email"
              {...register("email")}
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="gestao@pousada.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-rose-300">{errors.email.message}</p>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Senha
          </span>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <LockKeyhole className="h-4 w-4 text-slate-400" />
            <input
              type="password"
              {...register("password")}
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="••••••••"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-rose-300">
              {errors.password.message}
            </p>
          )}
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-glow disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Acessar painel
      </motion.button>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <p className="font-medium text-white">Acesso de demonstração</p>
        <p>E-mail: admin@pousadasancho.com</p>
        <p>Senha: sancho123</p>
      </div>
    </motion.form>
  );
}
