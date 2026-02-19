/**
 * PPTX Generation API helpers
 *
 * All calls go through the same backend that powers the rest of the app.
 * Base URL comes from NEXT_PUBLIC_API_URL (see .env.example).
 */

import { getEnv } from '@/lib/env';

function getBaseUrl(): string {
  return getEnv('NEXT_PUBLIC_API_URL', 'https://potomac-analyst-workbench-production.up.railway.app').replace(/\/+$/, '');
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UploadImageResponse {
  filename: string;
  upload_id: string;
  saved_as: string;
}

export interface GenerateDeckParams {
  outline: string;
  deck_family: string;
  uploaded_images: string[];
}

export interface GenerateDeckResponse {
  download_url: string;
  slide_count: number;
  plan: unknown;
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Upload a single chart image to the backend.
 * POST /pptx/upload-image  (multipart/form-data)
 */
export async function uploadChartImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${getBaseUrl()}/pptx/upload-image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => 'Unknown error');
    throw new Error(`Image upload failed (${res.status}): ${errBody}`);
  }

  return res.json();
}

/**
 * Generate a PowerPoint deck.
 * POST /pptx/generate  (JSON body)
 */
export async function generateDeck(params: GenerateDeckParams): Promise<GenerateDeckResponse> {
  const res = await fetch(`${getBaseUrl()}/pptx/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      outline: params.outline,
      deck_family: params.deck_family,
      uploaded_images: params.uploaded_images,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => 'Unknown error');
    throw new Error(`Deck generation failed (${res.status}): ${errBody}`);
  }

  return res.json();
}
