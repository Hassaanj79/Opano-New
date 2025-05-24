
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Mail, Phone, Edit3, MessageSquare, PhoneCall, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function UserProfilePanel() {
  const { 
    viewingUserProfile, 
    closeUserProfilePanel, 
    currentUser, 
    openUserProfilePanel, // For "Edit Profile" button on self
    setActiveConversation, // For "Message" button
    startCall // For "Call" button
  } = useAppContext();

  if (!viewingUserProfile) {
    return null;
  }

  const isCurrentUserProfile = currentUser?.id === viewingUserProfile.id;
  const [hours, minutes] = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).split(':');
  const localTime = `${hours}:${minutes}`;


  const handleMessageUser = () => {
    if (viewingUserProfile.id !== currentUser?.id) { // Don't message self from here
      setActiveConversation('dm', viewingUserProfile.id);
      closeUserProfilePanel(); // Close panel after navigating to DM
    }
  };
  
  const handleCallUser = () => {
     if (viewingUserProfile.id !== currentUser?.id) {
      // Construct a minimal ActiveConversation object for the call
      const conversationForCall = {
        type: 'dm' as 'dm',
        id: viewingUserProfile.id,
        name: viewingUserProfile.name,
        recipient: viewingUserProfile
      };
      startCall(conversationForCall);
      // Do not close panel, call dialog will overlay
    }
  };

  const handleEditProfile = () => {
    if(isCurrentUserProfile && currentUser) {
      // This would typically open an EditProfileDialog
      // For now, we re-use openUserProfilePanel to signal an intent to edit or close this one and open another
      // In a real app, you'd have a dedicated EditProfileDialog and state for it
      console.log("Edit profile clicked for:", currentUser.name);
      // If you have an EditProfileDialog, trigger it here.
      // For now, let's assume we would close this and the sidebar would handle opening the edit dialog.
      closeUserProfilePanel(); 
      // The actual EditProfileDialog is triggered from ChatterboxSidebar
    }
  }

  return (
    <div className="h-full flex flex-col p-0">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <Button variant="ghost" size="icon" onClick={closeUserProfilePanel} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
          <span className="sr-only">Close profile</span>
        </Button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {/* User Info Section */}
        <div className="flex flex-col items-center text-center space-y-2">
          <UserAvatar user={viewingUserProfile} className="h-28 w-28 text-4xl mb-2 ring-2 ring-offset-2 ring-offset-card ring-primary" />
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-foreground">{viewingUserProfile.name}</h3>
            <Badge variant={viewingUserProfile.isOnline ? "default" : "secondary"} className={`capitalize text-xs px-2 py-0.5 ${viewingUserProfile.isOnline ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-700'}`}>
              {viewingUserProfile.isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{viewingUserProfile.designation || 'No designation specified'}</p>
          {isCurrentUserProfile && (
            <Button variant="outline" size="sm" onClick={handleEditProfile} className="mt-2 text-xs">
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Edit Profile
            </Button>
          )}
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact Information</h4>
          {viewingUserProfile.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground break-all">{viewingUserProfile.email}</span>
            </div>
          )}
          {viewingUserProfile.phoneNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{viewingUserProfile.phoneNumber}</span>
            </div>
          )}
           <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-medium w-20">Local Time:</span>
              <span className="text-foreground">{localTime} (Mock)</span>
            </div>
        </div>
        
        {!isCurrentUserProfile && (
          <>
            <Separator />
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={handleMessageUser}>
                <MessageSquare className="mr-2 h-4 w-4" /> Message
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleCallUser}>
                <PhoneCall className="mr-2 h-4 w-4" /> Call
              </Button>
            </div>
          </>
        )}

        <Separator />

        {/* About Me (Placeholder) */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">About Me</h4>
          <p className="text-sm text-foreground italic">
            {viewingUserProfile.id === 'u1' ? "Focused on creating intuitive and beautiful user experiences." : 
             viewingUserProfile.id === 'u2' ? "Building robust and scalable backend systems." :
             "User has not added an 'About Me' section yet."}
          </p>
        </div>

        <Separator />
        
        {/* Files (Placeholder) */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Files Shared (Placeholder)</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted/80 cursor-pointer">
              <FileText className="h-4 w-4 text-primary"/>
              <span>Project_Alpha_Brief.pdf</span>
            </div>
             <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted/80 cursor-pointer">
              <FileText className="h-4 w-4 text-primary"/>
              <span>User_Research_Summary.docx</span>
            </div>
             <p className="text-xs text-center py-2">No files shared yet by this user.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
    