#!/bin/bash

# Script de corrección automática v2 para welcomebook
# Corrige: app/api/welcomebooks/route.ts, scripts/seed.ts, ecosystem.config.js

set -e

PROJECT_PATH="/var/www/welcomebook/nextjs_space"
cd "$PROJECT_PATH"

echo "╔════════════════════════════════════════════════════╗"
echo "║  🔧 SCRIPT DE CORRECCIÓN AUTOMÁTICA v2 - WELCOMEBOOK║"
echo "╚════════════════════════════════════════════════════╝"

# ========== PASO 1: Detener el servidor ==========
echo ""
echo "📍 PASO 1: Deteniendo PM2..."
pm2 stop welcomebook || true
sleep 2

# ========== PASO 2: Corregir app/api/welcomebooks/route.ts ==========
echo ""
echo "📍 PASO 2: Corrigiendo app/api/welcomebooks/route.ts..."

cat > app/api/welcomebooks/route.ts << 'ENDPOINT_EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { generateSlug, validateSlug } from '@/lib/slug-utils';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const welcomebooks = await prisma.welcomebook.findMany({
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
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(welcomebooks);
  } catch (error) {
    console.error('Get welcomebooks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        userId: session.user.id,
      },
    });

    return NextResponse.json(welcomebook);
  } catch (error) {
    console.error('Create welcomebook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
ENDPOINT_EOF

echo "✅ app/api/welcomebooks/route.ts corregido"

# ========== PASO 3: Corregir scripts/seed.ts ==========
echo ""
echo "📍 PASO 3: Corrigiendo scripts/seed.ts..."

cat > scripts/seed.ts << 'SEED_EOF'
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.media.deleteMany();
  await prisma.section.deleteMany();
  await prisma.welcomebook.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await hash('admin123456', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@welcomebook.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create sample welcomebook
  const welcomebook = await prisma.welcomebook.create({
    data: {
      propertyName: 'Mi Glamping Paradise',
      slug: 'mi-glamping',
      userId: admin.id,
    },
  });

  // Create sample sections
  const section1 = await prisma.section.create({
    data: {
      welcomebookId: welcomebook.id,
      type: 'WIFI',
      customTitle: 'Wi-Fi Information',
      order: 1,
      data: {
        ssid: 'GlampingWiFi',
        password: 'password123',
        frequency: '5GHz',
      },
    },
  });

  const section2 = await prisma.section.create({
    data: {
      welcomebookId: welcomebook.id,
      type: 'HOST',
      customTitle: 'Host Information',
      order: 2,
      data: {
        name: 'John Doe',
        email: 'host@example.com',
        phone: '+1234567890',
      },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created user: ${admin.email}`);
  console.log(`Created welcomebook: ${welcomebook.propertyName}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
SEED_EOF

echo "✅ scripts/seed.ts corregido"

# ========== PASO 4: Corregir ecosystem.config.js ==========
echo ""
echo "📍 PASO 4: Corrigiendo ecosystem.config.js..."

cat > ecosystem.config.js << 'ECOSYSTEM_EOF'
module.exports = {
  apps: [{
    name: 'welcomebook',
    script: '.next/standalone/server.js',
    args: '',
    cwd: '/var/www/welcomebook/nextjs_space',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: '/var/log/welcomebook/error-1.log',
    out_file: '/var/log/welcomebook/out-1.log',
    log_file: '/var/log/welcomebook/combined.log',
    time: true
  }]
};
ECOSYSTEM_EOF

echo "✅ ecosystem.config.js corregido"

# ========== PASO 5: Compilar ==========
echo ""
echo "📍 PASO 5: Compilando con yarn build..."
yarn build

if [ $? -ne 0 ]; then
  echo "❌ Build falló. Por favor revisa los errores arriba."
  exit 1
fi

echo "✅ Build completado exitosamente"

# ========== PASO 6: Reiniciar PM2 ==========
echo ""
echo "📍 PASO 6: Reiniciando PM2..."
pm2 restart welcomebook
pm2 save

# ========== PASO 7: Esperar a que inicie ==========
echo ""
echo "⏳ Esperando 3 segundos para que la aplicación inicie..."
sleep 3

# ========== PASO 8: Verificar estado ==========
echo ""
echo "📍 PASO 8: Estado final..."
pm2 status

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  ✅ ¡CORRECCIÓN COMPLETADA EXITOSAMENTE!          ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "📊 Resumen de cambios:"
echo "   1. ✅ app/api/welcomebooks/route.ts - Agregado userId"
echo "   2. ✅ scripts/seed.ts - Agregado userId"
echo "   3. ✅ ecosystem.config.js - Actualizado a usar standalone"
echo "   4. ✅ Build exitoso"
echo "   5. ✅ PM2 reiniciado"
echo ""
echo "🔍 Para verificar los logs, usa:"
echo "   pm2 logs welcomebook --lines 30"
echo ""
