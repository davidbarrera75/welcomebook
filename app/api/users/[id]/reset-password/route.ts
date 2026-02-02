import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import bcrypt from 'bcryptjs';

export const dynamic = "force-dynamic";

// POST /api/users/[id]/reset-password - Reset user password (SUPER_ADMIN only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser || adminUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SUPER_ADMIN only' }, { status: 403 });
    }

    const userId = params.id;

    // Prevent admin from resetting their own password this way
    if (userId === adminUser.id) {
      return NextResponse.json(
        { error: 'No puedes resetear tu propia contraseña de esta manera. Usa la opción de cambiar contraseña.' },
        { status: 400 }
      );
    }

    // Get user info
    const userToReset = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        role: true
      }
    });

    if (!userToReset) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Generate a temporary password
    const tempPassword = 'Temporal123!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    console.log(
      `[API] SUPER_ADMIN ${adminUser.email} reset password for user ${userToReset.email}`
    );

    return NextResponse.json({
      message: 'Contraseña reseteada exitosamente',
      tempPassword: tempPassword,
      userEmail: userToReset.email,
      userName: userToReset.name
    });
  } catch (error) {
    console.error('[API] Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
