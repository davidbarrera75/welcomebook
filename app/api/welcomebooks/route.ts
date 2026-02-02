import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { generateSlug, validateSlug } from '@/lib/slug-utils';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // SUPER_ADMIN sees ALL welcomebooks
    // Regular users only see their own
    const whereClause = user.role === 'SUPER_ADMIN'
      ? {}
      : { userId: user.id };

    const welcomebooks = await prisma.welcomebook.findMany({
      where: whereClause,
      include: {
        sections: {
          include: {
            media: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    console.log(`[API] User ${user.email} (${user.role}) fetched ${welcomebooks.length} welcomebooks`);

    return NextResponse.json(welcomebooks);
  } catch (error) {
    console.error('[API] Get welcomebooks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
    }

    const { propertyName } = await request.json();

    if (!propertyName?.trim()) {
      return NextResponse.json(
        { error: 'Property name is required' },
        { status: 400 }
      );
    }

    // Generate slug
    const baseSlug = generateSlug(propertyName);
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and make it unique
    while (await prisma.welcomebook.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    if (!validateSlug(slug)) {
      return NextResponse.json(
        { error: 'Unable to generate valid slug from property name' },
        { status: 400 }
      );
    }

    const welcomebook = await prisma.welcomebook.create({
      data: {
        propertyName: propertyName.trim(),
        slug,
        userId: user.id,
      },
    });

    console.log(`[API] User ${user.email} created welcomebook: ${welcomebook.propertyName}`);

    return NextResponse.json(welcomebook);
  } catch (error) {
    console.error('[API] Create welcomebook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
