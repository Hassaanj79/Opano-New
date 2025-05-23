
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

export default function JoinPage() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Continue with email:', email);
    toast({
      title: "Next Step: Email Authentication",
      description: "Email authentication flow to be implemented.",
    });
    // TODO: Implement Firebase email sign-in or sign-up flow
    // e.g., check if email exists, then prompt for password or new account details.
  };

  const handleGoogleSignIn = () => {
    console.log('Continue with Google clicked');
    toast({
      title: "Feature Coming Soon",
      description: "Google Sign-In will be implemented in a future update.",
    });
    // TODO: Implement Firebase Google Sign-In
  };

  const handleAppleSignIn = () => {
    console.log('Continue with Apple clicked');
    toast({
      title: "Feature Coming Soon",
      description: "Apple Sign-In will be implemented in a future update.",
    });
    // TODO: Implement Firebase Apple Sign-In
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
            />
            <Button type="submit" className="w-full h-12 text-base bg-primary hover:bg-primary/90">
              Continue
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <Separator className="flex-grow" />
            <span className="mx-4 text-xs text-muted-foreground">OR</span>
            <Separator className="flex-grow" />
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full h-12 text-base border-border hover:bg-muted/50" onClick={handleGoogleSignIn}>
              <GoogleIcon className="mr-2 h-5 w-5" />
              Continue With Google
            </Button>
            <Button variant="outline" className="w-full h-12 text-base border-border hover:bg-muted/50" onClick={handleAppleSignIn}>
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
