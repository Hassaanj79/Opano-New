
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OpanoLogo } from '@/components/OpanoLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { useAppContext } from '@/contexts/AppContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Eye, EyeOff } from 'lucide-react'; // Import Eye and EyeOff icons

function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth } = useAppContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [searchParams]);
  
  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      router.replace('/'); // Redirect if user is already logged in
    }
  }, [currentUser, isLoadingAuth, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Signed In", description: "Welcome back!" });
      // AppContext's onAuthStateChanged will handle redirection to '/'
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isLoadingAuth) {
      return (
        <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
        </div>
      )
  }


  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSignIn}>
        <CardHeader>
          <div className="mx-auto mb-4">
            <OpanoLogo />
          </div>
          <CardTitle className="text-center text-2xl">Sign In to Opano</CardTitle>
          <CardDescription className="text-center">
            Enter your password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={!!searchParams.get('email')} 
              className={searchParams.get('email') ? "bg-muted/50" : ""}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10" // Add padding to the right for the icon
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" className="text-primary-foreground"/> : 'Sign In'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Not you or new here? <Link href="/auth/join" className="underline hover:text-primary">Start over</Link>.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}


export default function SignInPage() {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-background">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner size="lg"/></div>}>
            <SignInFormContent />
        </Suspense>
      </div>
    );
}
