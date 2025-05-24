
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Mail, Phone, Edit3, MessageSquare, PhoneCall, CalendarDays, Laptop, Moon, Clock } from 'lucide-react'; // Added Laptop, Moon, Clock, CalendarDays
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge'; // Keep for potential future use if needed

export function UserProfilePanel() {
  const { 
    viewingUserProfile, 
    closeUserProfilePanel, 
    currentUser, 
    setActiveConversation,
    startCall
  } = useAppContext();

  if (!viewingUserProfile) {
    return null;
  }

  const isCurrentUserProfile = currentUser?.id === viewingUserProfile.id;

  // Mock data to match the image
  const mockPronouns = "She/her/hers";
  const mockStatus = "Away, notifications snoozed";
  const mockLocalTime = "6:20 AM local time";
  const mockStartDate = "Dec 6, 2022 (7 months ago)";
  const mockLinkedInProfile = "https://linkedin.com/in/placeholder";


  const handleMessageUser = () => {
    if (viewingUserProfile.id !== currentUser?.id) { 
      setActiveConversation('dm', viewingUserProfile.id);
      closeUserProfilePanel(); 
    }
  };
  
  const handleCallUser = () => {
     if (viewingUserProfile.id !== currentUser?.id) {
      const conversationForCall = {
        type: 'dm' as 'dm',
        id: viewingUserProfile.id,
        name: viewingUserProfile.name,
        recipient: viewingUserProfile
      };
      startCall(conversationForCall);
    }
  };

  const handleEditProfile = () => {
    // This should trigger the EditProfileDialog, currently in ChatterboxSidebar
    // For now, it can remain a console log or be wired to a context function
    console.log("Edit profile clicked for:", currentUser?.name);
    // Example: appContext.openEditProfileDialog(); // if such function existed
    closeUserProfilePanel(); // Close this panel, user settings dropdown from sidebar will open the actual edit dialog
  }

  return (
    <div className="h-full flex flex-col p-0 bg-card text-card-foreground">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <div className="flex items-center gap-2">
          <Laptop className="h-5 w-5 text-muted-foreground" />
          <Button variant="ghost" size="icon" onClick={closeUserProfilePanel} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
            <span className="sr-only">Close profile</span>
          </Button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {/* User Image */}
        <div className="flex justify-center">
            <img 
                src="https://placehold.co/600x400.png" 
                alt={viewingUserProfile.name} 
                className="rounded-lg object-cover w-full max-w-xs aspect-[3/2]" 
                data-ai-hint="profile photo"
            />
        </div>
        
        {/* User Info Section */}
        <div className="text-left space-y-1 mt-4">
          <h3 className="text-2xl font-bold text-foreground">{viewingUserProfile.name}</h3>
          <p className="text-md text-muted-foreground">{viewingUserProfile.designation || 'No designation'}</p>
          <p className="text-sm text-muted-foreground/80">{mockPronouns}</p>
        </div>

        <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Moon className="h-4 w-4" />
                <span>{mockStatus}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{mockLocalTime}</span>
            </div>
        </div>
        
        {isCurrentUserProfile ? (
            <Button variant="outline" size="sm" onClick={handleEditProfile} className="w-full mt-2">
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="space-y-2 mt-4">
                <Button variant="outline" className="w-full justify-start" onClick={handleMessageUser}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleCallUser}>
                    <PhoneCall className="mr-2 h-4 w-4" /> Call 
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => alert("Calendar feature coming soon!")}>
                    <CalendarDays className="mr-2 h-4 w-4" /> Calendar
                </Button>
            </div>
        )}

        <Separator />

        {/* About Me */}
        <div>
          <h4 className="text-md font-semibold text-foreground mb-2">About me</h4>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">Start Date</p>
            <p className="text-foreground">{mockStartDate}</p>
          </div>
          <div className="space-y-1 text-sm mt-3">
            <p className="text-muted-foreground">LinkedIn</p>
            <a href={mockLinkedInProfile} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                My LinkedIn profile
            </a>
          </div>
        </div>

        {/* Original Contact Info (can be removed if image implies it's not needed) */}
        {/* 
        <Separator />
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
        </div>
        */}

        {/* Original Files Placeholder (can be removed or redesigned based on image) */}
        {/*
        <Separator />
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Files Shared (Placeholder)</h4>
          <p className="text-xs text-center py-2 text-muted-foreground">No files shared yet by this user.</p>
        </div>
        */}
      </div>
    </div>
  );
}
    
