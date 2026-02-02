
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { validateSectionData, SectionType } from '@/lib/section-types';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const section = await prisma.section.findUnique({
      where: { id: params.id },
      include: {
        media: true,
        welcomebook: true,
      },
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error('Get section error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, dataEn, order, customTitle } = await request.json();

    const existingSection = await prisma.section.findUnique({
      where: { id: params.id }
    });

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    if (data !== undefined && Object.keys(data).length > 0) {
      try {
        validateSectionData(existingSection.type as SectionType, data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid section data';
        return NextResponse.json(
          { error: 'Invalid section data', details: errorMessage },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (data !== undefined) updateData.data = data;
    if (dataEn !== undefined) updateData.dataEn = dataEn;
    if (order !== undefined) updateData.order = order;
    if (customTitle !== undefined) updateData.customTitle = customTitle;

    const section = await prisma.section.update({
      where: { id: params.id },
      data: updateData,
      include: {
        media: true,
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error('Update section error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.section.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
