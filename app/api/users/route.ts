import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

// GET /api/users - List all users (SUPER_ADMIN only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden - SUPER_ADMIN only" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            welcomebooks: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    console.log(`[API] SUPER_ADMIN ${user.email} fetched ${users.length} users`);

    return NextResponse.json(users);
  } catch (error) {
    console.error("[API] Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser || adminUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden - SUPER_ADMIN only" }, { status: 403 });
    }

    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Validate role (cannot create SUPER_ADMIN)
    const userRole = role === "ADMIN" ? "ADMIN" : "USER";

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        role: userRole,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            welcomebooks: true
          }
        }
      }
    });

    console.log(`[API] SUPER_ADMIN ${adminUser.email} created new user: ${newUser.email} with role ${newUser.role}`);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("[API] Create user error:", error);
    return NextResponse.json(
      { error: "Error al crear el usuario" },
      { status: 500 }
    );
  }
}
