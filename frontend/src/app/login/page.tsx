'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiClient.post<{ accessToken: string; user: Record<string, unknown> }>(
        '/auth/login', { email, password },
      );
      login(res.user as any);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-secondary/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] bg-card rounded-2xl p-8 sm:p-10 border border-border/50 shadow-xl shadow-black/5">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary font-bold text-2xl tracking-tighter">P</span>
          </div>
          <h1 className="text-foreground font-bold text-2xl mb-2 tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to manage your portfolio
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label className="text-foreground text-sm font-semibold block">Email address</label>
            <input
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-12 px-4 rounded-lg bg-secondary/50 border border-input
                         text-foreground text-sm placeholder:text-muted-foreground/70
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                         transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-foreground text-sm font-semibold block">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 px-4 pr-11 rounded-lg bg-secondary/50 border border-input
                           text-foreground text-sm placeholder:text-muted-foreground/70
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                           transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground
                       font-semibold text-sm hover:bg-primary/90 active:scale-[0.98]
                       disabled:opacity-70 disabled:cursor-not-allowed
                       transition-all mt-4 flex items-center justify-center gap-2 shadow-md shadow-primary/20">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Divider + link */}
        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <span className="text-muted-foreground text-sm">
            Don&apos;t have an account?{' '}
          </span>
          <Link href="/register" className="text-primary text-sm font-semibold hover:underline decoration-primary/30 underline-offset-4 transition-all">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
