import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { WelcomebookEditor } from '@/components/admin/welcomebook-editor';
import { transformWelcomebook } from '@/lib/types';

async function getWelcomebook(id: string) {
  try {
    const welcomebook = await prisma.welcomebook.findUnique({
      where: { id },
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

export default async function EditWelcomebookPage({
  params,
}: {
  params: { id: string };
}) {
  const welcomebook = await getWelcomebook(params.id);

  if (!welcomebook) {
    notFound();
  }

  return (
    <WelcomebookEditor welcomebook={{
      ...welcomebook,
      id: params.id,
      createdAt: welcomebook.createdAt instanceof Date
        ? welcomebook.createdAt.toISOString()
        : welcomebook.createdAt
    }} />
  );
}
