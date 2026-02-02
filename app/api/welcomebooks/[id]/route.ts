
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { generateSlug, validateSlug } from '@/lib/slug-utils';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const welcomebook = await prisma.welcomebook.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          include: {
            media: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!welcomebook) {
      return NextResponse.json(
        { error: 'Welcomebook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(welcomebook);
  } catch (error) {
    console.error('Get welcomebook error:', error);
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
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyName, slug } = await request.json();

    if (!propertyName?.trim()) {
      return NextResponse.json(
        { error: 'Property name is required' },
        { status: 400 }
      );
    }

    let finalSlug = slug;
    
    if (!finalSlug) {
      // Generate new slug
      const baseSlug = generateSlug(propertyName);
      finalSlug = baseSlug;
      let counter = 1;

      // Check if slug exists and make it unique (excluding current record)
      while (await prisma.welcomebook.findFirst({ 
        where: { 
          slug: finalSlug, 
          id: { not: params.id } 
        } 
      })) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    if (!validateSlug(finalSlug)) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      );
    }

    // Check if new slug conflicts with other welcomebooks
    const existingWithSlug = await prisma.welcomebook.findFirst({
      where: { 
        slug: finalSlug, 
        id: { not: params.id } 
      }
    });

    if (existingWithSlug) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const welcomebook = await prisma.welcomebook.update({
      where: { id: params.id },
      data: {
        propertyName: propertyName.trim(),
        slug: finalSlug,
      },
    });

    return NextResponse.json(welcomebook);
  } catch (error) {
    console.error('Update welcomebook error:', error);
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
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete welcomebook (sections and media will be deleted due to cascade)
    await prisma.welcomebook.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Welcomebook deleted successfully' });
  } catch (error) {
    console.error('Delete welcomebook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
