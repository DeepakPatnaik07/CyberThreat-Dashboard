"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, FileWarning, Home, Shield, ShieldAlert } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()

  const routes = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      title: "Threat Feed",
      href: "/threat-feed",
      icon: Bell,
    },
    {
      title: "CVE Details",
      href: "/cve-details",
      icon: Shield,
    },
    {
      title: "Mitigation",
      href: "/mitigation",
      icon: ShieldAlert,
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="py-4">
        <div className="flex items-center gap-2 px-4">
          <ShieldAlert className="h-6 w-6 text-purple-500" />
          <span className="text-lg font-bold tracking-tight cyber-glow text-purple-500 group-data-[collapsible=icon]:hidden">
            CyberShield
          </span>
        </div>
      </SidebarHeader>
      <SidebarSeparator className="bg-purple-900/30" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-400 group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {routes.map((route) => (
              <SidebarMenuItem key={route.href}>
                <Link href={route.href} className="w-full" suppressHydrationWarning>
                  <SidebarMenuButton 
                    isActive={pathname === route.href} 
                    tooltip={route.title}
                    className="w-full"
                    suppressHydrationWarning
                  >
                    <route.icon className="h-4 w-4 text-purple-400" />
                    <span className="ml-2">{route.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>System Status: Online</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
