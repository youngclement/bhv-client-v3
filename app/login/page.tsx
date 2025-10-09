'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, GraduationCap, BookCheck } from 'lucide-react';
import { authService } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user } = await authService.login(email, password);
      if (user.role === 'student') {
        router.push('/submissions');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#004875] relative overflow-hidden">
       
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg overflow-hidden">
                <img 
                  src="/BHV-logo-page.jpg" 
                  alt="BHV English Logo" 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = '/logo.svg';
                  }}
                />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-[#004875] tracking-tight">BHV English</h1>
                <p className="text-xs text-slate-500 font-medium">IELTS Test Center</p>
              </div>
            </div>
          </div>

          <Card className="shadow-xl border-slate-200 bg-white">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold text-slate-900">Welcome back</CardTitle>
              <CardDescription className="text-slate-600">
                Sign in to access your dashboard and continue learning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 h-11 border-slate-300 focus:border-[#004875] focus:ring-[#004875]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 h-11 border-slate-300 focus:border-[#004875] focus:ring-[#004875]"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-[#004875] hover:bg-[#003a5c] text-white font-semibold shadow-md transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in '
                  )}
                </Button>
              </form>

              {/* <div className="pt-4 border-t border-slate-200">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs font-medium text-slate-600 mb-2">Demo Credentials:</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p><span className="font-semibold">Teacher:</span> teacher@example.com / password123</p>
                    <p><span className="font-semibold">Student:</span> student@example.com / password123</p>
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-slate-500 mt-6">
            © {new Date().getFullYear()} BHV English. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}