'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  UserPlus,
  Clock
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Welcomebook {
  id: string;
  propertyName: string;
  slug: string;
  sensitiveDataExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  sections: Array<{
    id: string;
    type: string;
    data: any;
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export function WelcomebooksList() {
  const [welcomebooks, setWelcomebooks] = useState<Welcomebook[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [welcomebookToDelete, setWelcomebookToDelete] = useState<Welcomebook | null>(null);
  const [welcomebookToTransfer, setWelcomebookToTransfer] = useState<Welcomebook | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isActivatingAccess, setIsActivatingAccess] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: session } = useSession();

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const fetchWelcomebooks = async () => {
    try {
      const response = await fetch('/api/welcomebooks');
      if (response.ok) {
        const data = await response.json();
        setWelcomebooks(data);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los welcomebooks',
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

  const fetchUsers = async () => {
    if (!isSuperAdmin) return;

    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter((u: User) => u.isActive));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const confirmDelete = (welcomebook: Welcomebook) => {
    setWelcomebookToDelete(welcomebook);
    setDeleteDialogOpen(true);
  };

  const openTransferDialog = (welcomebook: Welcomebook) => {
    setWelcomebookToTransfer(welcomebook);
    setSelectedUserId('');
    setTransferDialogOpen(true);
  };

  const deleteWelcomebook = async () => {
    if (!welcomebookToDelete) return;

    try {
      const response = await fetch(`/api/welcomebooks/${welcomebookToDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Welcomebook eliminado correctamente',
        });
        fetchWelcomebooks();
        setDeleteDialogOpen(false);
        setWelcomebookToDelete(null);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el welcomebook',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    }
  };

  const transferWelcomebook = async () => {
    if (!welcomebookToTransfer || !selectedUserId) return;

    setIsTransferring(true);
    try {
      const response = await fetch('/api/welcomebooks/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          welcomebookId: welcomebookToTransfer.id,
          newUserId: selectedUserId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: data.message || 'Welcomebook transferido correctamente',
        });
        fetchWelcomebooks();
        setTransferDialogOpen(false);
        setWelcomebookToTransfer(null);
        setSelectedUserId('');
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo transferir el welcomebook',
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
      setIsTransferring(false);
    }
  };

  const activateSensitiveAccess = async (welcomebookId: string) => {
    setIsActivatingAccess(welcomebookId);
    try {
      const response = await fetch('/api/welcomebooks/sensitive-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          welcomebookId,
          hours: 48, // 48 hours by default
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Acceso Activado',
          description: data.message || 'Acceso a WiFi/Códigos activado por 48 horas',
        });
        fetchWelcomebooks();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo activar el acceso',
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
      setIsActivatingAccess(null);
    }
  };

  useEffect(() => {
    fetchWelcomebooks();
    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (welcomebooks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Eye className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay welcomebooks
        </h3>
        <p className="text-gray-600 mb-6">
          Comienza creando tu primer welcomebook para tus huéspedes
        </p>
        <Link href="/admin/welcomebooks/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
            Crear Mi Primer Welcomebook
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {welcomebooks.map((welcomebook) => (
          <Card key={welcomebook.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {/* IZQUIERDA - INFO PRINCIPAL */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {welcomebook.propertyName}
                    </h3>
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-1">
                      {welcomebook.sections?.length || 0} secciones
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        /{welcomebook.slug}
                      </code>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(welcomebook.updatedAt).toLocaleDateString('es-ES')}
                    </div>
                    {isSuperAdmin && welcomebook.user && (
                      <div className="flex items-center">
                        <Badge variant="outline" className="text-xs">
                          {welcomebook.user.name || welcomebook.user.email}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* DERECHA - BOTONES SOLO ÍCONOS */}
                <div className="flex items-center gap-2">
                  {/* Ver */}
                  <Link href={`/${welcomebook.slug}`} target="_blank">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-300"
                      title="Ver welcomebook"
                    >
                      <Eye className="h-4 w-4 text-blue-600" />
                    </Button>
                  </Link>

                  {/* Editar */}
                  <Link href={`/admin/welcomebooks/${welcomebook.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 hover:bg-green-50 hover:border-green-300"
                      title="Editar welcomebook"
                    >
                      <Edit className="h-4 w-4 text-green-600" />
                    </Button>
                  </Link>

                  {/* Transferir (solo SUPER_ADMIN) */}
                  {isSuperAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 hover:bg-purple-50 hover:border-purple-300"
                      onClick={() => openTransferDialog(welcomebook)}
                      title="Transferir a otro usuario"
                    >
                      <UserPlus className="h-4 w-4 text-purple-600" />
                    </Button>
                  )}

                  {/* Activar Acceso 48h */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 p-0 hover:bg-orange-50 hover:border-orange-300"
                    onClick={() => activateSensitiveAccess(welcomebook.id)}
                    disabled={isActivatingAccess === welcomebook.id}
                    title="Activar acceso WiFi/Códigos por 48h"
                  >
                    <Clock className="h-4 w-4 text-orange-600" />
                  </Button>

                  {/* Eliminar */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 p-0 hover:bg-red-50 hover:border-red-300"
                    onClick={() => confirmDelete(welcomebook)}
                    title="Eliminar welcomebook"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar welcomebook?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar <strong>"{welcomebookToDelete?.propertyName}"</strong>.
              <br /><br />
              Esta acción eliminará:
              <ul className="list-disc list-inside mt-2">
                <li>{welcomebookToDelete?.sections?.length || 0} sección(es)</li>
                <li>Todos los archivos multimedia asociados</li>
              </ul>
              <br />
              <strong className="text-red-600">Esta acción no se puede deshacer.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteWelcomebook}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transferir Welcomebook</DialogTitle>
            <DialogDescription>
              Transferir <strong>"{welcomebookToTransfer?.propertyName}"</strong> a otro usuario.
              El usuario actual: <strong>{welcomebookToTransfer?.user?.name || welcomebookToTransfer?.user?.email || 'Desconocido'}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Seleccionar nuevo propietario:
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un usuario..." />
              </SelectTrigger>
              <SelectContent>
                {users
                  .filter(u => u.id !== welcomebookToTransfer?.userId)
                  .map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email} ({user.email})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransferDialogOpen(false)}
              disabled={isTransferring}
            >
              Cancelar
            </Button>
            <Button
              onClick={transferWelcomebook}
              disabled={!selectedUserId || isTransferring}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isTransferring ? 'Transfiriendo...' : 'Transferir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
