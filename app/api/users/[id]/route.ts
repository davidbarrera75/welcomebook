import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = "force-dynamic";

// PATCH /api/users/[id] - Update user (SUPER_ADMIN only)
export async function PATCH(
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

    const { isActive, role } = await request.json();
    const userId = params.id;

    // Prevent admin from deactivating themselves
    if (userId === adminUser.id && isActive === false) {
      return NextResponse.json(
        { error: 'No puedes desactivar tu propia cuenta' },
        { status: 400 }
      );
    }

    // Prevent admin from changing their own role
    if (userId === adminUser.id && role && role !== adminUser.role) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio rol' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (role && ['SUPER_ADMIN', 'ADMIN', 'USER'].includes(role)) {
      updateData.role = role;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    console.log(`[API] SUPER_ADMIN ${adminUser.email} updated user ${updatedUser.email}:`, updateData);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[API] Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (SUPER_ADMIN only)
export async function DELETE(
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

    // Prevent admin from deleting themselves
    if (userId === adminUser.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      );
    }

    // Get user info before deletion for logging
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        _count: {
          select: {
            welcomebooks: true
          }
        }
      }
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Delete user (cascades to welcomebooks, sections, media)
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log(
      `[API] SUPER_ADMIN ${adminUser.email} deleted user ${userToDelete.email} ` +
      `(${userToDelete._count.welcomebooks} welcomebooks deleted)`
    );

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente',
      welcomebooksDeleted: userToDelete._count.welcomebooks
    });
  } catch (error) {
    console.error('[API] Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
