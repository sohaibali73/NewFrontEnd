/**
 * Next.js API Route: /api/upload
 * 
 * Proxies file upload requests to the backend to avoid CORS issues.
 * The backend endpoint at /chat/conversations/{id}/upload returns 500
 * without CORS headers, so we proxy through Next.js.
 */

import { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'https://potomac-analyst-workbench-production.up.railway.app');

export async function POST(req: NextRequest) {
  try {
    // Get conversation ID from query params
    const conversationId = req.nextUrl.searchParams.get('conversationId');
    
    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token
    const authToken = req.headers.get('authorization') || '';

    // Forward the form data directly to backend
    const formData = await req.formData();
    
    const backendResponse = await fetch(
      `${API_BASE_URL}/chat/conversations/${conversationId}/upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': authToken,
        },
        body: formData,
      }
    );

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ 
        detail: `Upload failed with status ${backendResponse.status}` 
      }));
      return new Response(
        JSON.stringify({ error: error.detail || `HTTP ${backendResponse.status}` }), 
        { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await backendResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Upload API route error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Upload failed' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
