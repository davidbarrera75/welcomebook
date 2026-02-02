import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WelcomebooksList } from '@/components/admin/welcomebooks-list';
import { Plus, BookOpen, Users, BarChart3, FileText } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

async function getDashboardStats(userId: string) {
  const welcomebooks = await prisma.welcomebook.findMany({
    where: { userId },
    include: {
      sections: true,
      visits: true,
    },
  });

  const totalWelcomebooks = welcomebooks.length;
  const totalSections = welcomebooks.reduce((acc, wb) => acc + wb.sections.length, 0);
  const totalVisits = welcomebooks.reduce((acc, wb) => acc + wb.visits.length, 0);

  return {
    totalWelcomebooks,
    totalSections,
    totalVisits,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const stats = await getDashboardStats(userId);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Administra tus welcomebooks y monitorea el rendimiento
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/welcomebooks/import">
            <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <FileText className="h-5 w-5 mr-2" />
              Importar desde Word
            </Button>
          </Link>
          <Link href="/admin/welcomebooks/new">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" />
              Crear Welcomebook
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Welcomebooks</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWelcomebooks}</div>
            <p className="text-xs text-muted-foreground">
              Welcomebooks creados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            <p className="text-xs text-muted-foreground">
              Visitas a tus welcomebooks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Secciones Activas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSections}</div>
            <p className="text-xs text-muted-foreground">
              En {stats.totalWelcomebooks} welcomebook{stats.totalWelcomebooks !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Welcomebooks</CardTitle>
          <CardDescription>
            Lista de todos los welcomebooks creados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WelcomebooksList />
        </CardContent>
      </Card>
    </div>
  );
}
