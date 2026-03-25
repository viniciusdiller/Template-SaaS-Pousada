import { z } from "zod";

export const createTeamMemberSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["owner", "staff"], { required_error: "Papel é obrigatório" }),
  permissions: z
    .array(z.enum(["calendar", "finance", "checkin", "team"]))
    .optional(),
});

export const updateTeamMemberSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome muito longo")
    .optional(),
  role: z.enum(["owner", "staff"]).optional(),
  permissions: z
    .array(z.enum(["calendar", "finance", "checkin", "team"]))
    .optional(),
  loginEnabled: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
