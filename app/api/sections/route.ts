
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { validateSectionData, SectionType } from '@/lib/section-types';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { welcomebookId, type, data, order } = await request.json();

    if (!welcomebookId || !type) {
      return NextResponse.json(
        { error: 'Welcomebook ID and type are required' },
        { status: 400 }
      );
    }

    // Only validate section data if data is provided (not empty)
    // Allow empty sections to be created initially
    if (data && Object.keys(data).length > 0) {
      try {
        validateSectionData(type as SectionType, data);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid section data', details: error },
          { status: 400 }
        );
      }
    }

    // Verify welcomebook exists
    const welcomebook = await prisma.welcomebook.findUnique({
      where: { id: welcomebookId }
    });

    if (!welcomebook) {
      return NextResponse.json(
        { error: 'Welcomebook not found' },
        { status: 404 }
      );
    }

    const section = await prisma.section.create({
      data: {
        welcomebookId,
        type: type as SectionType,
        data: data || {},
        order: order || 0,
      },
      include: {
        media: true,
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error('Create section error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
