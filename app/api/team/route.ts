import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { assertPermission, getSessionUserFromRequest } from "@/lib/auth";
import { getDatabase } from "@/lib/database";
import {
  createTeamMemberSchema,
  type CreateTeamMemberInput,
} from "@/lib/validations";
import type { TeamPermission } from "@/types/team";

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

export async function GET(request: Request) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, "team");

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const db = await getDatabase();
    const members = await db.User.findAll({
      where: { isActive: true },
      attributes: ["id", "name", "email", "role", "permissions", "isActive"],
      order: [["createdAt", "DESC"]],
    });

    const formattedMembers = members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      permissions: JSON.parse(member.permissions),
      loginEnabled: member.isActive,
    }));

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { message: "Erro ao buscar membros da equipe." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, "team");

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const body = (await request.json()) as CreateTeamMemberInput;

  const validation = createTeamMemberSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: validation.error.issues[0]?.message || "Dados inválidos.",
      },
      { status: 400 },
    );
  }

  const validatedData = validation.data;

  try {
    const db = await getDatabase();

    const existingMember = await db.User.findOne({
      where: { email: validatedData.email, isActive: true },
    });

    if (existingMember) {
      return NextResponse.json(
        { message: "Ja existe uma pessoa da equipe com esse e-mail." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10);
    const permissions = sanitizePermissions(validatedData.permissions);

    const member = await db.User.create({
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      role: validatedData.role,
      permissions: JSON.stringify(permissions),
      isActive: true,
    });

    return NextResponse.json(
      {
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          permissions,
          loginEnabled: member.isActive,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating team member:", error);
    return NextResponse.json(
      { message: "Erro ao criar membro da equipe." },
      { status: 500 },
    );
  }
}
