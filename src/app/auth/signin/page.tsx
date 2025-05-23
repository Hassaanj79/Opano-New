
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

function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth } = useAppContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  if (isLoadingAuth) {
      return (
        <div className="flex items-center justify-center h-full">
            <p>Loading...</p>
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
              readOnly={!!searchParams.get('email')} // Readonly if email came from query
              className={searchParams.get('email') ? "bg-muted/50" : ""}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
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
        <Suspense fallback={<div className="flex items-center justify-center h-full"><p>Loading...</p></div>}>
            <SignInFormContent />
        </Suspense>
      </div>
    );
}
