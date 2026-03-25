import { NextResponse } from "next/server";
import { assertPermission, getSessionUserFromRequest } from "@/lib/auth";
import { getDatabase } from "@/lib/database";
import {
  updateTeamMemberSchema,
  type UpdateTeamMemberInput,
} from "@/lib/validations";
import type { TeamPermission, TeamRole } from "@/types/team";

const allowedPermissions: TeamPermission[] = [
  "calendar",
  "finance",
  "checkin",
  "team",
];

function sanitizePermissions(permissions: TeamPermission[] | undefined) {
  if (!permissions?.length) {
    return [];
  }

  return permissions.filter((permission) =>
    allowedPermissions.includes(permission),
  );
}

const allowedPermissions: TeamPermission[] = [
  "calendar",
  "finance",
  "checkin",
  "team",
];

function sanitizePermissions(permissions: TeamPermission[] | undefined) {
  if (!permissions?.length) {
    return [];
  }

  return permissions.filter((permission) =>
    allowedPermissions.includes(permission),
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, "team");

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { id } = await params;
  const body = (await request.json()) as UpdateTeamMemberInput;

  const validation = updateTeamMemberSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: validation.error.errors[0]?.message || "Dados inválidos.",
      },
      { status: 400 },
    );
  }

  const validatedData = validation.data;

  try {
    const db = await getDatabase();
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    const member = await db.User.findByPk(memberId);
    if (!member) {
      return NextResponse.json(
        { message: "Pessoa da equipe nao encontrada." },
        { status: 404 },
      );
    }

    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.role !== undefined) updateData.role = validatedData.role;
    if (validatedData.permissions !== undefined)
      updateData.permissions = JSON.stringify(validatedData.permissions);
    if (validatedData.loginEnabled !== undefined)
      updateData.isActive = validatedData.loginEnabled;

    await member.update(updateData);

    // Refresh member data
    await member.reload();

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        permissions: JSON.parse(member.permissions),
        loginEnabled: member.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar membro da equipe." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, "team");

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { id } = await params;

  try {
    const db = await getDatabase();
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    const member = await db.User.findByPk(memberId);
    if (!member) {
      return NextResponse.json(
        { message: "Pessoa da equipe nao encontrada." },
        { status: 404 },
      );
    }

    await member.destroy();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json(
      { message: "Erro ao remover membro da equipe." },
      { status: 500 },
    );
  }
}
