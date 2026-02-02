import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = "force-dynamic";

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

    const { welcomebookId, hours } = await request.json();

    if (!welcomebookId) {
      return NextResponse.json(
        { error: 'Welcomebook ID is required' },
        { status: 400 }
      );
    }

    // Verify welcomebook exists and user has access
    const welcomebook = await prisma.welcomebook.findUnique({
      where: { id: welcomebookId },
      select: { id: true, propertyName: true, userId: true }
    });

    if (!welcomebook) {
      return NextResponse.json(
        { error: 'Welcomebook not found' },
        { status: 404 }
      );
    }

    // Check if user owns the welcomebook OR is SUPER_ADMIN
    if (welcomebook.userId !== user.id && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to modify this welcomebook' },
        { status: 403 }
      );
    }

    // Calculate expiration time (default 48 hours if not specified)
    const hoursToAdd = hours || 48;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hoursToAdd);

    // Update welcomebook with new expiration time
    const updatedWelcomebook = await prisma.welcomebook.update({
      where: { id: welcomebookId },
      data: { sensitiveDataExpiresAt: expiresAt },
      select: {
        id: true,
        propertyName: true,
        sensitiveDataExpiresAt: true,
      }
    });

    console.log(
      `[API] User ${user.email} activated sensitive access for "${welcomebook.propertyName}" ` +
      `until ${expiresAt.toISOString()}`
    );

    return NextResponse.json({
      success: true,
      welcomebook: updatedWelcomebook,
      message: `Acceso activado hasta ${expiresAt.toLocaleString('es-ES')}`,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('[API] Activate sensitive access error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { welcomebookId } = await request.json();

    if (!welcomebookId) {
      return NextResponse.json(
        { error: 'Welcomebook ID is required' },
        { status: 400 }
      );
    }

    // Verify welcomebook exists and user has access
    const welcomebook = await prisma.welcomebook.findUnique({
      where: { id: welcomebookId },
      select: { id: true, propertyName: true, userId: true }
    });

    if (!welcomebook) {
      return NextResponse.json(
        { error: 'Welcomebook not found' },
        { status: 404 }
      );
    }

    // Check if user owns the welcomebook OR is SUPER_ADMIN
    if (welcomebook.userId !== user.id && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to modify this welcomebook' },
        { status: 403 }
      );
    }

    // Deactivate sensitive access by setting expiration to null
    const updatedWelcomebook = await prisma.welcomebook.update({
      where: { id: welcomebookId },
      data: { sensitiveDataExpiresAt: null },
      select: {
        id: true,
        propertyName: true,
        sensitiveDataExpiresAt: true,
      }
    });

    console.log(
      `[API] User ${user.email} deactivated sensitive access for "${welcomebook.propertyName}"`
    );

    return NextResponse.json({
      success: true,
      welcomebook: updatedWelcomebook,
      message: 'Acceso desactivado correctamente',
    });

  } catch (error) {
    console.error('[API] Deactivate sensitive access error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
