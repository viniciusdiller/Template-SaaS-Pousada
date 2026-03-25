import { NextResponse } from 'next/server';
import { assertPermission, getSessionUserFromRequest } from '@/lib/auth';
import { getRooms } from '@/services/channexService';

export async function GET(request: Request) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, 'calendar');

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const rooms = await getRooms();
  return NextResponse.json(rooms);
}