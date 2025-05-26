
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Mail, Phone, Edit3, MessageSquare, PhoneCall, CalendarDays, Laptop, Moon, Clock, Link as LinkIcon, Users as UsersIcon, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function UserProfilePanel() {
  const {
    viewingUserProfile,
    closeUserProfilePanel,
    currentUser,
    setActiveConversation,
    startCall,
    openEditProfileDialog, // Assuming this function exists in context to open the edit dialog
  } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  if (!viewingUserProfile) {
    return null;
  }

  const isCurrentUserProfile = currentUser?.id === viewingUserProfile.id;
  const isAdmin = currentUser?.role === 'admin';

  // Mock data - some will be replaced by actual data
  const mockStatus = viewingUserProfile.isOnline ? "Online" : "Away, notifications snoozed";
  const mockLocalTime = "6:20 AM local time";
  const mockStartDate = "Dec 6, 2022 (7 months ago)";

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
    if (currentUser) {
      // Assuming AppContext has a function to open the dialog
      // For example: appContext.openEditProfileDialog(currentUser);
      // For now, direct action based on sidebar or if a global dialog open function exists
      closeUserProfilePanel(); // Close this panel first
      // A more integrated solution would call a function from AppContext
      // to open the EditProfileDialog. The sidebar has this logic.
      // If a global openEditProfileDialog exists in context, use it:
      if (openEditProfileDialog) {
        openEditProfileDialog();
      } else {
        toast({title: "Edit Profile", description: "Please use the settings in the main sidebar to edit your profile."});
      }
    }
  }

  const handleManageUsers = () => {
    closeUserProfilePanel();
    router.push('/admin/users');
  }

  return (
    <div className="h-full flex flex-col p-0 bg-card text-card-foreground border-l border-border">
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

      <div className="flex-grow overflow-y-auto p-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Main User Info & Image */}
          <div className="lg:w-2/5 flex flex-col items-center lg:items-start space-y-3">
            <div className="w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
               <UserAvatar
                user={{ ...viewingUserProfile, avatarUrl: viewingUserProfile.avatarUrl || 'https://placehold.co/600x400.png' }}
                className="w-full h-full object-cover text-6xl"
                data-ai-hint="profile photo"
               />
            </div>
            <div className="text-center lg:text-left space-y-0.5 w-full">
              <h3 className="text-2xl font-bold text-foreground">{viewingUserProfile.name}</h3>
              {viewingUserProfile.designation && (
                <p className="text-md text-muted-foreground">{viewingUserProfile.designation}</p>
              )}
              {viewingUserProfile.pronouns && (
                <p className="text-sm text-muted-foreground/80">{viewingUserProfile.pronouns}</p>
              )}
            </div>
            <div className="space-y-1.5 text-sm w-full">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Moon className="h-4 w-4" />
                    <span>{mockStatus}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{mockLocalTime}</span>
                </div>
            </div>
             <div className="space-y-2 w-full pt-2">
              {isCurrentUserProfile ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleEditProfile} className="w-full">
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                  {isAdmin && (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full border-primary text-primary hover:bg-primary/10">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Admin Settings
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          <DropdownMenuItem onClick={handleManageUsers}>
                            <UsersIcon className="mr-2 h-4 w-4" />
                            Manage Users
                          </DropdownMenuItem>
                          {/* Add other admin-specific actions here if needed */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                  )}
                </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={handleMessageUser}>
                        <MessageSquare className="h-4 w-4" /> Message
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={handleCallUser}>
                        <PhoneCall className="h-4 w-4" /> Call
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast({title: "Calendar (Coming Soon)", description:"Calendar integration will be available soon."})}>
                        <CalendarDays className="h-4 w-4" /> Calendar
                    </Button>
                  </>
              )}
            </div>
          </div>

          {/* Right Column - About Me & Contact */}
          <div className="lg:w-3/5 flex flex-col space-y-5 pt-2">
            <Separator className="lg:hidden" />
            <div>
              <h4 className="text-md font-semibold text-foreground mb-3">About me</h4>
              <div className="space-y-3 text-sm">
                <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Start Date</span>
                    <span className="text-foreground">{mockStartDate}</span>
                </div>
                {viewingUserProfile.linkedinProfileUrl && (
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">LinkedIn</span>
                        <a
                            href={viewingUserProfile.linkedinProfileUrl.startsWith('http') ? viewingUserProfile.linkedinProfileUrl : `https://${viewingUserProfile.linkedinProfileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 break-all"
                        >
                           <LinkIcon className="h-3.5 w-3.5 shrink-0"/> {viewingUserProfile.linkedinProfileUrl}
                        </a>
                    </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-md font-semibold text-foreground mb-3">Contact Information</h4>
              <div className="space-y-3 text-sm">
                {viewingUserProfile.email && (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Email</span>
                    <a href={`mailto:${viewingUserProfile.email}`} className="text-primary hover:underline break-all">{viewingUserProfile.email}</a>
                  </div>
                )}
                {viewingUserProfile.phoneNumber && (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Phone</span>
                    <span className="text-foreground">{viewingUserProfile.phoneNumber}</span>
                  </div>
                )}
                 {!viewingUserProfile.email && !viewingUserProfile.phoneNumber && !viewingUserProfile.linkedinProfileUrl && (
                    <p className="text-xs text-muted-foreground">No contact information provided.</p>
                 )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
