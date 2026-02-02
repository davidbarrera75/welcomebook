
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewWelcomebookPage() {
  const [propertyName, setPropertyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!propertyName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la propiedad es requerido',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/welcomebooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyName: propertyName.trim(),
        }),
      });

      if (response.ok) {
        const welcomebook = await response.json();
        toast({
          title: 'Éxito',
          description: 'Welcomebook creado correctamente',
        });
        router.push(`/admin/welcomebooks/${welcomebook.id}`);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'No se pudo crear el welcomebook',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Welcomebook</h1>
        <p className="text-gray-600 mt-2">
          Crea un welcomebook para tu propiedad con toda la información que tus huéspedes necesitan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Propiedad</CardTitle>
          <CardDescription>
            Ingresa el nombre de tu propiedad. Esto generará automáticamente una URL única.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="propertyName">Nombre de la Propiedad *</Label>
              <Input
                id="propertyName"
                type="text"
                placeholder="ej: Mi Glamping Paradise, Casa de Montaña, Villa del Mar"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                required
                disabled={isLoading}
                className="text-lg"
              />
              <p className="text-sm text-gray-600">
                Este nombre aparecerá como título principal en tu welcomebook
              </p>
            </div>

            {propertyName && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>URL generada:</strong>
                </p>
                <code className="text-blue-600 bg-blue-100 px-2 py-1 rounded text-sm">
                  wbook.12y3.online/{propertyName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}
                </code>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={isLoading || !propertyName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Welcomebook'
                )}
              </Button>
              <Link href="/admin">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
