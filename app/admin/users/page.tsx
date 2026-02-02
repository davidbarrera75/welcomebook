'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Shield, UserX, CheckCircle, XCircle, Trash2, ArrowLeft, Key, Copy, Check, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    welcomebooks: number;
  };
}

export default function UsersManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordResultOpen, setResetPasswordResultOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create user state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'USER' | 'ADMIN'>('USER');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUsers();
    }
  }, [status, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/users');

      if (response.status === 403) {
        setError('Acceso denegado. Solo SUPER_ADMIN puede gestionar usuarios.');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('USER');
    setCreateError('');
    setCreateDialogOpen(true);
  };

  const createUser = async () => {
    setCreateError('');

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
      setCreateError('Todos los campos son obligatorios');
      return;
    }

    if (newUserPassword.length < 6) {
      setCreateError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setCreateLoading(true);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim().toLowerCase(),
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || 'Error al crear usuario');
        return;
      }

      // Add new user to the list
      setUsers([data, ...users]);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
      setCreateError('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(userId);
      setError('');

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al actualizar usuario');
        return;
      }

      setUsers(users.map(user =>
        user.id === userId ? { ...user, isActive: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Error al actualizar el estado del usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      setActionLoading(userId);
      setError('');

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al cambiar rol');
        return;
      }

      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole as any } : user
      ));
    } catch (error) {
      console.error('Error changing user role:', error);
      setError('Error al cambiar el rol del usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmResetPassword = (user: User) => {
    setUserToReset(user);
    setResetPasswordDialogOpen(true);
  };

  const resetPassword = async () => {
    if (!userToReset) return;

    try {
      setActionLoading(userToReset.id);
      setError('');
      setResetPasswordDialogOpen(false);

      const response = await fetch(`/api/users/${userToReset.id}/reset-password`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al resetear contraseña');
        return;
      }

      setTempPassword(data.tempPassword);
      setResetPasswordResultOpen(true);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Error al resetear la contraseña');
    } finally {
      setActionLoading(null);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying password:', error);
    }
  };

  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      setActionLoading(userToDelete.id);
      setError('');

      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al eliminar usuario');
        return;
      }

      setUsers(users.filter(user => user.id !== userToDelete.id));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error al eliminar el usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      SUPER_ADMIN: { variant: 'destructive', icon: Shield },
      ADMIN: { variant: 'default', icon: Shield },
      USER: { variant: 'secondary', icon: Users },
    };

    const config = variants[role] || variants.USER;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {role}
      </Badge>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600 mt-1">Administra roles y permisos de usuarios</p>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Crear Usuario
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuarios ({users.length})
            </CardTitle>
            <CardDescription>
              Gestiona usuarios, roles y permisos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No hay usuarios registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Welcomebooks</TableHead>
                      <TableHead>Fecha Registro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name || 'Sin nombre'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => changeUserRole(user.id, value)}
                            disabled={actionLoading === user.id || user.role === 'SUPER_ADMIN'}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">USER</SelectItem>
                              <SelectItem value="ADMIN">ADMIN</SelectItem>
                              <SelectItem value="SUPER_ADMIN" disabled>SUPER_ADMIN</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? 'default' : 'secondary'}
                            className="flex items-center gap-1 w-fit"
                          >
                            {user.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Activo
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactivo
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user._count.welcomebooks}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => confirmResetPassword(user)}
                              disabled={actionLoading === user.id || user.role === 'SUPER_ADMIN'}
                              title="Resetear contraseña"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={user.isActive ? 'outline' : 'default'}
                              size="sm"
                              onClick={() => toggleUserActive(user.id, user.isActive)}
                              disabled={actionLoading === user.id || user.role === 'SUPER_ADMIN'}
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : user.isActive ? (
                                <>
                                  <UserX className="w-4 h-4 mr-1" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Activar
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => confirmDeleteUser(user)}
                              disabled={actionLoading === user.id || user.role === 'SUPER_ADMIN'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Crear Nuevo Usuario
              </DialogTitle>
              <DialogDescription>
                Crea una cuenta de usuario con los datos proporcionados
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  disabled={createLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  disabled={createLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  disabled={createLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={newUserRole}
                  onValueChange={(value: 'USER' | 'ADMIN') => setNewUserRole(value)}
                  disabled={createLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER - Usuario normal</SelectItem>
                    <SelectItem value="ADMIN">ADMIN - Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {createError && (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={createUser}
                disabled={createLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear Usuario
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Confirmation Dialog */}
        <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Resetear contraseña?</AlertDialogTitle>
              <AlertDialogDescription>
                Estás a punto de resetear la contraseña de <strong>{userToReset?.email}</strong>.
                <br /><br />
                Se generará una contraseña temporal: <code className="bg-gray-100 px-2 py-1 rounded">Temporal123!</code>
                <br /><br />
                Deberás comunicarle esta contraseña temporal al usuario para que pueda iniciar sesión.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={resetPassword}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Resetear Contraseña
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Password Result Dialog */}
        <Dialog open={resetPasswordResultOpen} onOpenChange={setResetPasswordResultOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                Contraseña Reseteada
              </DialogTitle>
              <DialogDescription>
                La contraseña ha sido reseteada exitosamente para <strong>{userToReset?.email}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Contraseña Temporal:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-4 py-3 rounded border border-blue-300 text-lg font-mono font-bold text-blue-700">
                    {tempPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPassword}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <Alert>
                <AlertDescription>
                  <strong>Importante:</strong> Comunica esta contraseña temporal al usuario por un canal seguro (WhatsApp, email, etc.).
                  El usuario podrá cambiar su contraseña después de iniciar sesión.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                setResetPasswordResultOpen(false);
                setUserToReset(null);
                setTempPassword('');
                setCopied(false);
              }}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
              <AlertDialogDescription>
                Estás a punto de eliminar a <strong>{userToDelete?.email}</strong>.
                <br /><br />
                Esta acción eliminará:
                <ul className="list-disc list-inside mt-2">
                  <li>{userToDelete?._count.welcomebooks || 0} welcomebook(s)</li>
                  <li>Todas las secciones asociadas</li>
                  <li>Todos los archivos multimedia</li>
                </ul>
                <br />
                <strong className="text-red-600">Esta acción no se puede deshacer.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteUser}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Eliminar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
