import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://potomac-analyst-workbench-production.up.railway.app';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  const url = taskId ? `${API_URL}/tasks/${taskId}` : `${API_URL}/tasks`;

  try {
    const resp = await fetch(url, {
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const body = await req.json();

  // Check if this is a cancel request
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const action = searchParams.get('action');

  let url = `${API_URL}/tasks`;
  if (taskId && action === 'cancel') {
    url = `${API_URL}/tasks/${taskId}/cancel`;
  }

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit task' }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  const url = taskId ? `${API_URL}/tasks/${taskId}` : `${API_URL}/tasks`;

  try {
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to manage task' }, { status: 502 });
  }
}
