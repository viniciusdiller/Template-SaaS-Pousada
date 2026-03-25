import { NextResponse } from 'next/server';
import { assertPermission, getSessionUserFromRequest } from '@/lib/auth';
import { getReservations, updateReservation } from '@/services/channexService';
import { Reservation } from '@/types/channex';

export async function GET(request: Request) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, 'calendar');

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const reservations = await getReservations();
  return NextResponse.json(reservations);
}

export async function PUT(request: Request) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, 'calendar');

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const body = await request.json() as Reservation;
  const updated = await updateReservation(body);
  return NextResponse.json(updated);
}