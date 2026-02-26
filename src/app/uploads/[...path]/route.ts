import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const relativePath = segments.join('/');

  // Prevent path traversal
  if (relativePath.includes('..')) {
    return new NextResponse('Not found', { status: 404 });
  }

  const uploadDir = path.join(process.cwd(), 'uploads');
  const filePath = path.join(uploadDir, relativePath);

  // Ensure file is within uploads directory
  if (!filePath.startsWith(uploadDir)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const stat = await fs.stat(filePath);
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const etag = `"${stat.mtimeMs.toString(36)}-${stat.size.toString(36)}"`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, must-revalidate',
        'ETag': etag,
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
