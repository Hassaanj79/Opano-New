
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { PendingInvitation } from '@/types';
import { OpanoLogo } from '@/components/OpanoLogo'; // Changed from ChatterboxLogo
import { useToast } from '@/hooks/use-toast';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const { verifyInviteToken, acceptInvitation } = useAppContext();
  const { toast } = useToast();

  const [invitation, setInvitation] = useState<PendingInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const inviteToken = typeof params.inviteToken === 'string' ? params.inviteToken : '';

  useEffect(() => {
    if (inviteToken) {
      const validInvitation = verifyInviteToken(inviteToken);
      if (validInvitation) {
        setInvitation(validInvitation);
      } else {
        setError("Invalid or expired invitation link.");
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is not valid or has already been used.",
          variant: "destructive"
        });
      }
    } else {
      setError("No invitation token provided.");
    }
    setIsLoading(false);
  }, [inviteToken, verifyInviteToken, toast]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !designation.trim()) {
      toast({ title: "Missing Information", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    if (invitation) {
      const success = acceptInvitation(invitation.token, { name, designation });
      if (success) {
        // AppContext handles redirection via router.push
      } else {
        // Error toast is handled by acceptInvitation
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4">
             <OpanoLogo />
            </div>
            <CardTitle className="text-center">Verifying Invitation...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Please wait while we check your invitation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
             <div className="mx-auto mb-4">
                <OpanoLogo />
             </div>
            <CardTitle className="text-center">Invitation Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-destructive">{error || "This invitation is no longer valid."}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full">Go to Homepage</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
             <div className="mx-auto mb-4">
                <OpanoLogo />
             </div>
            <CardTitle className="text-center">Join Opano</CardTitle> 
            <CardDescription className="text-center">
              You've been invited to join the workspace. Please complete your profile.
            </CardDescription>
            <p className="text-sm text-center text-muted-foreground pt-2">Invited email: {invitation.email}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Alex Doe"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="designation">Designation / Role</Label>
              <Input
                id="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
                placeholder="e.g. Software Engineer"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Complete Sign Up</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
