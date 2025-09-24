'use client';

import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MobileSidebar } from './sidebar';
import { useState, useEffect } from 'react';
import { authService, User as UserType } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function Header() {
  const [user, setUser] = useState<UserType | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userProfile = await authService.getProfile();
        setUser(userProfile);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    if (authService.isAuthenticated()) {
      fetchUser();
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : 'U';

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <MobileSidebar />
      
      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={user?.firstName || 'User'} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user ? `${user.firstName} ${user.lastName}` : 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}