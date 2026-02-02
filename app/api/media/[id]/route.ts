import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const media = await db.media.findUnique({
      where: { id: params.id },
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    try {
      const filePath = join(process.cwd(), 'public', media.url);
      await unlink(filePath);
    } catch (error) {
      console.warn('Could not delete file from disk:', error);
    }

    await db.media.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
