import { NextResponse } from "next/server";
import { authConfig, validateCredentials } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    console.log("🔓 Login attempt for:", body.email);

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: validation.error.errors[0]?.message || "Dados inválidos.",
        },
        { status: 400 },
      );
    }

    const authResult = await validateCredentials(
      validation.data.email,
      validation.data.password,
    );

    console.log("🔐 Auth result:", authResult.ok ? "SUCCESS" : "FAILED");

    if (!authResult.ok) {
      if (authResult.reason === "login_disabled") {
        return NextResponse.json(
          { message: "Este login da equipe esta desativado." },
          { status: 403 },
        );
      }

      return NextResponse.json(
        { message: "Credenciais invalidas." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: authResult.session,
    });

    response.cookies.set(authConfig.cookieName, authResult.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("❌ Login endpoint error:", error);
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 });
  }
}
