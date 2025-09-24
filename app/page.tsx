'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">IELTS Manager</h1>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}