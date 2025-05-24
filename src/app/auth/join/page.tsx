
"use client";

import React, { useState } from 'react';
import { OpanoLogo } from '@/components/OpanoLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { AppleIcon } from '@/components/icons/AppleIcon';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchSignInMethodsForEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function JoinPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        // Email exists, redirect to sign-in
        router.push(`/auth/signin?email=${encodeURIComponent(email)}`);
      } else {
        // Email does not exist, redirect to sign-up
        router.push(`/auth/signup?email=${encodeURIComponent(email)}`);
      }
    } catch (error: any) {
      console.error("Error checking email:", error);
      toast({
        title: "Error",
        description: error.message || "Could not process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Firebase's onAuthStateChanged listener in AppContext will handle redirection
      // and setting the current user. We can show a success toast here if desired,
      // though it might be quick if redirection happens fast.
      toast({ title: "Signed In with Google", description: "Welcome!"});
      // router.push('/'); // AppContext should handle redirection
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    console.log('Continue with Apple clicked');
    toast({
      title: "Feature Coming Soon",
      description: "Apple Sign-In will be implemented in a future update.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="py-8 px-6 md:px-10">
        <OpanoLogo />
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4 -mt-16">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
            Join Opano Workspace
          </h1>
          <p className="text-muted-foreground mb-8">
            Start by entering the email address you use for work.
          </p>

          <form onSubmit={handleContinue} className="space-y-6">
            <Input
              type="email"
              placeholder="name@work-email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-base"
              disabled={isLoading || isGoogleLoading}
            />
            <Button type="submit" className="w-full h-12 text-base bg-primary hover:bg-primary/90" disabled={isLoading || isGoogleLoading}>
              {isLoading ? 'Processing...' : 'Continue'}
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <Separator className="flex-grow" />
            <span className="mx-4 text-xs text-muted-foreground">OR</span>
            <Separator className="flex-grow" />
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full h-12 text-base border-border hover:bg-muted/50" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
              {isGoogleLoading ? (
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <GoogleIcon className="mr-2 h-5 w-5" />
              )}
              {isGoogleLoading ? 'Signing In...' : 'Continue With Google'}
            </Button>
            <Button variant="outline" className="w-full h-12 text-base border-border hover:bg-muted/50" onClick={handleAppleSignIn} disabled={isLoading || isGoogleLoading}>
              <AppleIcon className="mr-2 h-5 w-5" />
              Continue With Apple
            </Button>
          </div>

          <div className="mt-8 p-4 bg-muted/50 rounded-md text-sm text-muted-foreground text-left">
            <p>
              Don&apos;t have a company email address or not invited yet?
              Contact your workspace administrator at Opano Workspace for an invitation.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 px-6 md:px-10 text-center md:text-left border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground space-y-2 md:space-y-0">
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground">Privacy & Terms</Link>
            <Link href="#" className="hover:text-foreground">Contact Us</Link>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            <Globe className="mr-1.5 h-3.5 w-3.5" />
            Change region
          </Button>
        </div>
      </footer>
    </div>
  );
}
