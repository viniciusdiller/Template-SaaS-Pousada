import { NextResponse } from 'next/server';
import { assertPermission, getSessionUserFromRequest } from '@/lib/auth';
import { getCheckInOutBoard, registerCheckIn, registerCheckOut } from '@/services/channexService';

export async function GET(request: Request) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, 'checkin');

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const board = await getCheckInOutBoard();
  return NextResponse.json(board);
}

export async function POST(request: Request) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, 'checkin');

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const body = (await request.json()) as {
    reservationId?: string;
    action?: 'checkin' | 'checkout';
  };

  if (!body.reservationId || !body.action) {
    return NextResponse.json({ message: 'Informe a reserva e a acao.' }, { status: 400 });
  }

  try {
    const reservation =
      body.action === 'checkin' ? await registerCheckIn(body.reservationId) : await registerCheckOut(body.reservationId);

    return NextResponse.json({ reservation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao atualizar status da reserva.';
    return NextResponse.json({ message }, { status: 400 });
  }
}
