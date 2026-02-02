
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sectionId = formData.get('sectionId') as string;
    const mediaType = formData.get('type') as 'PHOTO' | 'VIDEO';

    if (!file || !sectionId || !mediaType) {
      return NextResponse.json(
        { error: 'File, section ID, and media type are required' },
        { status: 400 }
      );
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    const validPhotoTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];

    if (mediaType === 'PHOTO' && !validPhotoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid photo file type. Supported: JPG, PNG, WebP' },
        { status: 400 }
      );
    }

    if (mediaType === 'VIDEO' && !validVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid video file type. Supported: MP4, WebM, OGG' },
        { status: 400 }
      );
    }

    const maxSize = mediaType === 'PHOTO' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size: ${mediaType === 'PHOTO' ? '10MB' : '50MB'}` 
        },
        { status: 400 }
      );
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedFilename}`;
    const filepath = join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/${filename}`;

    const media = await prisma.media.create({
      data: {
        sectionId,
        type: mediaType,
        url: fileUrl,
        filename: file.name,
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error('Upload media error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
