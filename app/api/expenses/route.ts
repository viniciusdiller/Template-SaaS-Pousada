import { NextResponse } from 'next/server';
import { assertPermission, getSessionUserFromRequest } from '@/lib/auth';
import { createExpense, getExpenses } from '@/services/channexService';
import type { Expense } from '@/types/channex';

export async function GET(request: Request) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, 'finance');

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const expenses = await getExpenses();
  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  const user = getSessionUserFromRequest(request);
  const unauthorizedResponse = assertPermission(user, 'finance');

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const body = await request.json() as Omit<Expense, 'id'>;
  const expense = await createExpense(body);
  return NextResponse.json(expense);
}