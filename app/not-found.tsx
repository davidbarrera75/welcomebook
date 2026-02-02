
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8">
          <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcomebook no encontrado
          </h1>
          <p className="text-gray-600 mb-8">
            No pudimos encontrar el welcomebook que buscas. Puede que la URL no sea correcta o que el welcomebook haya sido eliminado.
          </p>
          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Home className="h-4 w-4 mr-2" />
                Ir al Inicio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
