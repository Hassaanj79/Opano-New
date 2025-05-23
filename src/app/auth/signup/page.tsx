
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OpanoLogo } from '@/components/OpanoLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { useAppContext } from '@/contexts/AppContext';


function SignUpFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth } = useAppContext();


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (!fullName.trim()) {
      toast({ title: "Full Name required", description: "Please enter your full name.", variant: "destructive"});
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName,
        });
        // In a real app, you'd also save designation to Firestore here
        console.log("User designation (mock save):", designation);
      }
      toast({ title: "Account Created", description: "Welcome to Opano!" });
      // AppContext's onAuthStateChanged will handle redirection to '/'
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "Could not create your account.",
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
      <form onSubmit={handleSignUp}>
        <CardHeader>
          <div className="mx-auto mb-4">
            <OpanoLogo />
          </div>
          <CardTitle className="text-center text-2xl">Create your Opano Account</CardTitle>
          <CardDescription className="text-center">
            Complete your profile to join the workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly // Email is pre-filled and read-only
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="e.g. Alex Doe"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="designation">Designation (Optional)</Label>
            <Input
              id="designation"
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Software Engineer"
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
              placeholder="Must be at least 6 characters"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up & Join'}
          </Button>
           <p className="text-xs text-center text-muted-foreground">
            Already have an account? <Link href={`/auth/signin?email=${encodeURIComponent(email)}`} className="underline hover:text-primary">Sign In</Link>.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SignUpPage() {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-background">
         <Suspense fallback={<div className="flex items-center justify-center h-full"><p>Loading...</p></div>}>
            <SignUpFormContent />
        </Suspense>
      </div>
    );
}
