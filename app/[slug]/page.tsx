import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { WelcomebookPublicView } from '@/components/public/welcomebook-public-view';
import { transformWelcomebook } from '@/lib/types';

const RESERVED_ROUTES = ['admin', 'api', 'login', 'signup', '_next', 'favicon.ico'];

async function getWelcomebookBySlug(slug: string) {
  try {
    const welcomebook = await prisma.welcomebook.findUnique({
      where: { slug },
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
    return welcomebook ? transformWelcomebook(welcomebook) : null;
  } catch (error) {
    console.error('Error fetching welcomebook:', error);
    return null;
  }
}

async function trackVisit(welcomebookId: string) {
  try {
    const headersList = headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || undefined;
    const referer = headersList.get('referer') || undefined;

    await prisma.visit.create({
      data: {
        welcomebookId,
        ipAddress,
        userAgent,
        referer,
      },
    });
  } catch (error) {
    console.error('Error tracking visit:', error);
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (RESERVED_ROUTES.includes(params.slug)) {
    return { title: 'Welcomebook' };
  }
  const welcomebook = await getWelcomebookBySlug(params.slug);
  if (!welcomebook) {
    return { title: 'Welcomebook no encontrado' };
  }
  return {
    title: `${welcomebook.propertyName} - Welcomebook`,
    description: `Informacion completa sobre ${welcomebook.propertyName}`,
  };
}

export default async function PublicWelcomebookPage({
  params,
}: {
  params: { slug: string };
}) {
  if (RESERVED_ROUTES.includes(params.slug)) {
    notFound();
  }

  const welcomebook = await getWelcomebookBySlug(params.slug);

  if (!welcomebook) {
    notFound();
  }

  // Track visit
  await trackVisit(welcomebook.id);

  return <WelcomebookPublicView welcomebook={welcomebook} />;
}
