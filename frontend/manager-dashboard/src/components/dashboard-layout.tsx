'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AlertTriangle, ClipboardList, LayoutDashboard, Plane, Users } from 'lucide-react';
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
              <Image src="/logo.png" alt="Rerouted" width={40} height={40} className="rounded-lg object-contain" priority />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white drop-shadow-sm">Rerouted</h1>
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
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2">
            <Avatar className="border border-white/20">
              <AvatarFallback className="bg-white/10 text-white font-semibold">OP</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white">Operations</p>
              <p className="text-xs text-white/65">Recovery workspace</p>
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
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
              <SidebarTrigger className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Network operations</h2>
                <p className="text-xs text-slate-500">Crew recovery control center</p>
              </div>
            </div>
            <div>{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
