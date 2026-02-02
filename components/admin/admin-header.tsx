'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Crown, Users, Shield, Menu, Key } from 'lucide-react';

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'A';

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isAdmin = user.role === 'ADMIN';

  const getRoleDisplay = () => {
    if (isSuperAdmin) {
      return {
        icon: Crown,
        text: 'Super Admin',
        fullText: 'Super Administrador',
        color: 'text-yellow-500'
      };
    } else if (isAdmin) {
      return {
        icon: Shield,
        text: 'Admin',
        fullText: 'Administrador',
        color: 'text-blue-500'
      };
    } else {
      return {
        icon: User,
        text: 'Usuario',
        fullText: 'Usuario',
        color: 'text-gray-500'
      };
    }
  };

  const roleDisplay = getRoleDisplay();
  const RoleIcon = roleDisplay.icon;

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-2">
        {/* Title - Hidden on mobile, show abbreviated on tablet */}
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
            <span className="hidden sm:inline">Panel de Administración</span>
            <span className="sm:hidden">Admin</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Users Management Button - Desktop only */}
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/users')}
              className="hidden lg:flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              <span>Gestionar Usuarios</span>
            </Button>
          )}

          {/* Users Management Button - Mobile (icon only) */}
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/users')}
              className="lg:hidden flex items-center justify-center p-2"
              title="Gestionar Usuarios"
            >
              <Users className="h-4 w-4" />
            </Button>
          )}

          {/* Role Badge - Desktop */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
            <RoleIcon className={`h-4 w-4 ${roleDisplay.color}`} />
            <span className="hidden lg:inline">{roleDisplay.fullText}</span>
            <span className="lg:hidden">{roleDisplay.text}</span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full flex-shrink-0"
              >
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>

              {/* Role info in mobile menu */}
              <div className="md:hidden px-2 py-1.5 flex items-center space-x-2 text-sm text-gray-600">
                <RoleIcon className={`h-4 w-4 ${roleDisplay.color}`} />
                <span>{roleDisplay.fullText}</span>
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/change-password')}>                <Key className="h-4 w-4 mr-2" />                Cambiar Contraseña              </DropdownMenuItem>              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
