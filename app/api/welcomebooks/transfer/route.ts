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

    // Only SUPER_ADMIN can transfer welcomebooks
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can transfer welcomebooks' },
        { status: 403 }
      );
    }

    const { welcomebookId, newUserId } = await request.json();

    if (!welcomebookId || !newUserId) {
      return NextResponse.json(
        { error: 'Welcomebook ID and new user ID are required' },
        { status: 400 }
      );
    }

    // Verify welcomebook exists
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

    // Verify new user exists and is active
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
      select: { id: true, name: true, email: true, isActive: true }
    });

    if (!newUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    if (!newUser.isActive) {
      return NextResponse.json(
        { error: 'Target user account is inactive' },
        { status: 400 }
      );
    }

    // Transfer the welcomebook
    const updatedWelcomebook = await prisma.welcomebook.update({
      where: { id: welcomebookId },
      data: { userId: newUserId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    console.log(
      `[API] SUPER_ADMIN ${user.email} transferred welcomebook "${welcomebook.propertyName}" ` +
      `to user ${newUser.email}`
    );

    return NextResponse.json({
      success: true,
      welcomebook: updatedWelcomebook,
      message: `Welcomebook transferred successfully to ${newUser.name || newUser.email}`
    });

  } catch (error) {
    console.error('[API] Transfer welcomebook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
