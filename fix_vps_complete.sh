#!/bin/Bash Terminal

# Script de diagnóstico y reparación completa
# Para ejecutar en el VPS

set -e

echo "=========================================="
echo "🔍 DIAGNÓSTICO Y REPARACIÓN WELCOMEBOOK"
echo "=========================================="
echo ""

cd /var/www/welcomebook/nextjs_space

# 1. Verificar DATABASE_URL
echo "=== 1. Verificando DATABASE_URL ==="
if grep -q "DATABASE_URL" .env; then
    echo "✅ DATABASE_URL encontrado en .env"
    grep DATABASE_URL .env | head -1
else
    echo "❌ ERROR: DATABASE_URL no encontrado en .env"
    exit 1
fi
echo ""

# 2. Verificar conexión a base de datos
echo "=== 2. Verificando conexión a base de datos ==="
if yarn prisma db execute --stdin <<< "SELECT 1 as test;" > /dev/null 2>&1; then
    echo "✅ Conexión a base de datos exitosa"
else
    echo "❌ ERROR: No se puede conectar a la base de datos"
    echo "Intentando mostrar el error:"
    yarn prisma db execute --stdin <<< "SELECT 1 as test;" 2>&1 | tail -5
    exit 1
fi
echo ""

# 3. Verificar y regenerar Prisma Client
echo "=== 3. Verificando Prisma Client ==="
if [ -f "node_modules/.prisma/client/index.js" ]; then
    echo "✅ Prisma Client existe"
else
    echo "⚠️  Prisma Client no encontrado"
fi

echo ""
echo "=== 4. Regenerando Prisma Client ==="
yarn prisma generate
echo "✅ Prisma Client regenerado"
echo ""

# 5. Verificar que el directorio de uploads existe
echo "=== 5. Verificando directorio de uploads ==="
mkdir -p public/uploads
chmod 755 public/uploads
echo "✅ Directorio public/uploads creado/verificado"
echo ""

# 6. Rebuild de la aplicación
echo "=== 6. Rebuilding aplicación ==="
yarn build
echo "✅ Build completado"
echo ""

# 7. Reiniciar PM2
echo "=== 7. Reiniciando PM2 ==="
pm2 restart welcomebook
sleep 3
echo "✅ PM2 reiniciado"
echo ""

# 8. Verificar estado
echo "=== 8. Estado de PM2 ==="
pm2 status welcomebook
echo ""

# 9. Mostrar logs recientes
echo "=== 9. Logs recientes (últimas 30 líneas) ==="
pm2 logs welcomebook --lines 30 --nostream
echo ""

echo "=========================================="
echo "✅ REPARACIÓN COMPLETADA"
echo "=========================================="
echo ""
echo "📋 Próximos pasos:"
echo "1. Intenta guardar algo en la aplicación"
echo "2. Si hay error, ejecuta: pm2 logs welcomebook --lines 20"
echo "3. Comparte el error específico que aparece"
echo ""
