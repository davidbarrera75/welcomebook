# Welcomebook - Guía del Proyecto

## Descripción
Plataforma SaaS para crear welcomebooks digitales para propiedades de alquiler vacacional (Airbnb, VRBO, etc). Los anfitriones pueden crear guías digitales con información de WiFi, acceso, ubicación, electrodomésticos, etc. que sus huéspedes pueden ver en cualquier dispositivo.

## Stack Tecnológico
- **Framework**: Next.js 14 (App Router)
- **Base de datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js
- **Estilos**: Tailwind CSS + shadcn/ui
- **AI**: Anthropic Claude API (para importación de documentos)
- **Almacenamiento**: Cloudflare R2 (para imágenes/videos)

## Estructura Principal
```
/app
  /admin              # Panel de administración
    /welcomebooks     # CRUD de welcomebooks
      /[id]           # Editor de welcomebook individual
      /import         # Importación con IA desde Word/PDF
    /users            # Gestión de usuarios (solo SUPER_ADMIN)
  /api
    /welcomebooks     # API de welcomebooks
      /extract        # Extracción con Claude AI (ES + EN automático)
    /sections         # API de secciones (soporta data + dataEn)
    /media            # Upload de imágenes/videos
  /[slug]             # Vista pública del welcomebook

/components
  /admin
    /welcomebook-editor.tsx   # Editor principal
    /section-editor.tsx       # Editor de secciones individuales
    /section-manager.tsx      # Gestión de secciones (agregar, reordenar, eliminar)
  /public
    /welcomebook-public-view.tsx  # Vista pública con soporte ES/EN

/lib
  /section-types.ts   # Tipos y validación de secciones (Zod)
  /db.ts              # Cliente Prisma
  /auth.ts            # Configuración NextAuth
```

## Tipos de Secciones Disponibles
- WIFI - Red y contraseña
- ACCESS - Instrucciones de acceso
- LOCATION - Dirección y cómo llegar
- HOST - Información del anfitrión
- EMERGENCY - Contactos de emergencia
- TRASH - Basura y reciclaje
- APPLIANCES - Electrodomésticos
- PLACES - Lugares de interés
- MAPS360 - Tour virtual 360°
- WIDGET - Widget de reservas
- CUSTOM - Sección personalizada (múltiples permitidas)
- HTML_EMBED - Código HTML personalizado (múltiples permitidas)

## Funcionalidades Clave

### Importación con IA
- Archivo: `/app/api/welcomebooks/extract/route.ts`
- Sube documento Word/PDF/TXT
- Claude extrae información y genera automáticamente:
  - `data` (español)
  - `dataEn` (inglés)
- Plantilla disponible: `/public/plantilla-welcomebook.doc`

### Multiidioma
- Cada sección tiene `data` (ES) y `dataEn` (EN)
- Vista pública permite cambiar entre idiomas
- Traducción automática en importación

### Roles de Usuario
- SUPER_ADMIN: Acceso total, gestión de usuarios
- ADMIN: Gestión de welcomebooks
- USER: Usuario básico

## Base de Datos (Prisma)
Modelos principales:
- User (con roles)
- Welcomebook (propertyName, slug único)
- Section (type, data JSON, dataEn JSON, order)
- Media (fotos/videos por sección)
- Visit (tracking de visitas)

## Variables de Entorno Requeridas
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ANTHROPIC_API_KEY=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_ENDPOINT=
CLOUDFLARE_R2_PUBLIC_URL=
```

## Comandos Útiles
```bash
npm run dev          # Desarrollo local
npx prisma studio    # Ver base de datos
npx prisma db push   # Sincronizar schema
npx prisma generate  # Regenerar cliente
```

## Notas de Desarrollo
- Los editores de sección solo editan español (data), inglés se genera en importación
- suppressHydrationWarning en fechas para evitar errores de timezone
- Secciones CUSTOM y HTML_EMBED pueden agregarse múltiples veces
