import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import fs from 'fs';
import path from 'path';

export async function POST({ request }: RequestEvent) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));

    // Return URL (served by src/routes/uploads/[...path]/+server.ts)
    const url = `/uploads/${filename}`;
    return json({ url });
  } catch (err) {
    console.error('Upload error:', err);
    return json({ error: 'Upload failed' }, { status: 500 });
  }
}
