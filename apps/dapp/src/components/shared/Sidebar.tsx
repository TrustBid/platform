'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import trustBidLogo from '@/assets/ISO2_transp.jpg'
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
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
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
  { title: 'Reports', href: '/dashboard/reports', icon: FileText },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface AppSidebarProps {
  userEmail?: string
  userName?: string
  onSignOut?: () => Promise<void> | void
}

export function AppSidebar({
  userEmail,
  userName,
  onSignOut,
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const initials =
    userName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    userEmail?.slice(0, 2).toUpperCase() ||
    '?'

  const handleSignOut = async () => {
    try {
      if (onSignOut) await onSignOut()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      
      {/* Header con el isotipo de TrustBid */}
      <SidebarHeader className="border-b border-sidebar-border/70 bg-sidebar px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src={trustBidLogo}
            alt="TrustBid"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
            TrustBid
          </span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="bg-zinc-200 dark:bg-zinc-800/60" />

      {/* Contenido de navegación principal */}
      <SidebarContent className="bg-sidebar px-3 space-y-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`w-full font-medium transition-all duration-200 rounded-lg px-3 py-2.5 flex items-center gap-3 text-sm ${
                        isActive
                          ? 'bg-zinc-200/70 text-zinc-900 dark:bg-zinc-800/35 dark:text-zinc-200'
                          : 'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Link href={item.href}>
                        <item.icon className={`h-4 w-4 ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grupo Blockchain / Stellar Network */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">
            Blockchain
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 text-sm">
                  <Shield className="h-4 w-4 text-zinc-600 dark:text-zinc-500" />
                  <span className="text-zinc-700 dark:text-zinc-300">Stellar Testnet</span>
                  <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="bg-zinc-200 dark:bg-zinc-800/60" />

      {/* Footer del perfil del usuario */}
      <SidebarFooter className="p-4 bg-sidebar border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-sidebar/40 border border-sidebar-border/40">
          <Avatar className="h-8 w-8 border border-sidebar-border/50">
            <AvatarFallback className="bg-sidebar text-xs text-sidebar-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-200">
              {userName ?? 'Mi cuenta'}
            </span>
            <span className="truncate text-[11px] text-zinc-600 dark:text-zinc-500 font-medium">
              {userEmail ?? ''}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}