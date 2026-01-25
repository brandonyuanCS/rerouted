'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Crew', url: '/crew', icon: Users },
  { title: 'Flights', url: '/flights', icon: Plane },
  { title: 'Assignments', url: '/assignments', icon: ClipboardList },
  { title: 'Disruptions', url: '/disruptions', icon: AlertTriangle },
];

function LayoutDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function Plane({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function ClipboardList({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-none p-3 bg-transparent">
      <div 
        className="liquid-glass-sidebar-inner h-full rounded-2xl overflow-hidden flex flex-col"
      >
      <SidebarHeader className="p-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center">
            <img src="/logo.png" alt="CrewSync Logo" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white drop-shadow-sm">CrewSync</h1>
            <p className="text-xs text-white/70">Manager Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <div className="px-4">
        <Separator className="bg-white/30" />
      </div>
      <SidebarContent className="relative z-10 flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/80 text-xs uppercase tracking-wider">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="liquid-glass-nav-button hover:bg-white/20 data-[active=true]:bg-white/30 data-[active=true]:backdrop-blur-sm rounded-xl transition-all duration-300 text-white/90 hover:text-white border border-white/15 hover:border-white/30 data-[active=true]:border-white/40"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 relative z-10">
        <div className="px-0">
          <Separator className="bg-white/30 mb-4" />
        </div>
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25">
          <Avatar className="border border-white/30">
            <AvatarFallback className="bg-white/20 text-white font-semibold">JD</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-white/60">Operations Manager</p>
          </div>
        </div>
      </SidebarFooter>
      </div>
    </Sidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto relative">
          <div className="relative z-10 p-6">
            <div className="flex items-center gap-4 px-6 py-4 liquid-glass-card rounded-2xl mb-6">
              <SidebarTrigger className="text-slate-700 hover:bg-white/30 rounded-xl p-2 transition-all" />
              <h2 className="text-lg font-semibold text-slate-800">American Airlines Operations</h2>
            </div>
            <div>{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
