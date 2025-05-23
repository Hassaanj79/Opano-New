
"use client";

import { Home, Clock, Folder, MoreHorizontal } from 'lucide-react'; // Changed FileText to Folder, added MoreHorizontal
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '#/history', icon: Clock, label: 'History' },
  { href: '#/documents', icon: Folder, label: 'Documents' }, // Changed icon
];

const moreNavItem = { href: '#/more-options', icon: MoreHorizontal, label: 'More Options' }; // New "More" item

export function ThinIconBar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col items-center w-16 h-screen py-4 space-y-1 bg-neutral-800 text-neutral-300 shadow-lg">
      {/* Optional: Placeholder for a small app icon/logo at the top of this bar */}
      {/* <div className="p-2 mb-4">
        <YourAppIcon className="w-8 h-8 text-primary" />
      </div> */}
      <nav className="flex flex-col items-center space-y-1 w-full flex-grow">
        {navItems.map((item) => (
          <Link href={item.href} key={item.label} passHref legacyBehavior>
            <a
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg hover:bg-neutral-700 hover:text-white cursor-pointer w-full aspect-square transition-colors duration-150 group",
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) 
                  ? "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary" 
                  : ""
              )}
              title={item.label}
            >
              <item.icon className={cn("w-6 h-6", 
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) ? "text-primary" : "group-hover:text-white"
              )} />
            </a>
          </Link>
        ))}
      </nav>
      {/* More Options Icon at the bottom */}
      <div className="mt-auto w-full">
        <Link href={moreNavItem.href} passHref legacyBehavior>
          <a
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg hover:bg-neutral-700 hover:text-white cursor-pointer w-full aspect-square transition-colors duration-150 group",
              pathname === moreNavItem.href ? "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary" : ""
            )}
            title={moreNavItem.label}
          >
            <moreNavItem.icon className={cn("w-6 h-6", pathname === moreNavItem.href ? "text-primary" : "group-hover:text-white")} />
          </a>
        </Link>
      </div>
    </div>
  );
}
