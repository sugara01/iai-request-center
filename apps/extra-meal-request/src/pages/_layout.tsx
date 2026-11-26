import { NavLink, Outlet } from 'react-router-dom';
import { BookOpenCheck, CarFront, Check, ChevronDown, ClipboardList, Gauge, Languages, ShieldCheck, SquarePen, Workflow } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdminNotificationCenter, useAdminNotificationCounts } from '@/components/admin-notification-center';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserIdentity } from '@/components/user-identity';
import { useDemoUsers, useUser } from '@/hooks/use-user';
import { useAdminAuthorization } from '@/hooks/use-admin-access';
import { useLanguage, type Language } from '@/lib/localization';
import { getDemoUserEmail, setDemoUserEmail } from '@/lib/api';

const requesterLinks = [
  { to: '/', label: 'Dashboard Saya', icon: Gauge },
  { to: '/buat-request', label: 'Buat Request', icon: SquarePen },
  { to: '/panduan-requester', label: 'Panduan Requester', icon: BookOpenCheck },
];
export default function Layout() {
  const { language, setLanguage, t } = useLanguage();
  const { data: user, isPending: isUserPending } = useUser();
  const { data: demoUsers = [] } = useDemoUsers();
  const email = user?.userPrincipalName;
  const { isVehicleAdmin, isMealAdmin, isSuperAdmin, isPending: isAccessPending } = useAdminAuthorization(email);
  const notificationCounts = useAdminNotificationCounts(isVehicleAdmin, isMealAdmin);
  const adminLinks = [
    ...(isVehicleAdmin ? [{ to: '/admin-kendaraan', label: t('Admin Kendaraan'), icon: CarFront, count: notificationCounts.vehicle }] : []),
    ...(isMealAdmin ? [{ to: '/admin-meal', label: t('Admin Extra Meal'), icon: ClipboardList, count: notificationCounts.meal }] : []),
    ...(isVehicleAdmin || isMealAdmin ? [{ to: '/panduan-power-automate', label: t('Workflow Request'), icon: Workflow }] : []),
    ...(isSuperAdmin ? [{ to: '/kelola-admin', label: t('Kelola Admin'), icon: ShieldCheck }] : []),
  ];
  const localizedRequesterLinks = requesterLinks.map((link: typeof requesterLinks[number]) => ({ ...link, label: t(link.label) }));
  const renderLinks = (links: Array<{ to: string; label: string; icon: typeof Gauge; count?: number }>) => links.map(({ to, label, icon: Icon, count }: { to: string; label: string; icon: typeof Gauge; count?: number }) => <SidebarMenuItem key={to}><SidebarMenuButton asChild><NavLink to={to} end={to === '/'} className={({ isActive }: { isActive: boolean }) => isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}><Icon /><span>{label}</span>{Boolean(count) && <Badge className="ml-auto min-w-5 justify-center px-1 text-xs">{count && count > 99 ? '99+' : count}</Badge>}</NavLink></SidebarMenuButton></SidebarMenuItem>);
  const languageMenu = <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="gap-2" data-i18n-ignore><Languages className="size-4" /><span>{language === 'id' ? 'Bahasa Indonesia' : 'English'}</span><ChevronDown className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" data-i18n-ignore>{([{ value: 'id', label: 'Bahasa Indonesia' }, { value: 'en', label: 'English' }] as const).map((option: { value: Language; label: string }) => <DropdownMenuItem key={option.value} onClick={() => setLanguage(option.value)}><span className="w-5">{language === option.value && <Check className="size-4" />}</span>{option.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader className="border-b border-sidebar-border p-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><SquarePen className="size-5" /></div>
              <div><p className="font-semibold">IAI Request Center</p><p className="text-xs text-sidebar-foreground">INEOS Aromatics Indonesia</p></div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t('Requester')}</SidebarGroupLabel>
              <SidebarGroupContent><SidebarMenu>{renderLinks(localizedRequesterLinks)}</SidebarMenu></SidebarGroupContent>
            </SidebarGroup>
            {isUserPending || isAccessPending ? (
              <SidebarGroup aria-label={t('Memuat akses administrasi')}>
                <SidebarGroupLabel>{t('Administration')}</SidebarGroupLabel>
                <SidebarGroupContent><div className="space-y-2 px-2" aria-hidden="true"><div className="h-8 animate-pulse rounded-md bg-sidebar-accent" /><div className="h-8 animate-pulse rounded-md bg-sidebar-accent" /></div></SidebarGroupContent>
              </SidebarGroup>
            ) : adminLinks.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>{t('Administration')}</SidebarGroupLabel>
                <SidebarGroupContent><SidebarMenu>{renderLinks(adminLinks)}</SidebarMenu></SidebarGroupContent>
              </SidebarGroup>
            )}
            <div className="mx-3 mt-auto mb-4 rounded-lg bg-sidebar-accent p-3 text-left text-sidebar-foreground">
              <p className="text-xs font-medium">Database</p>
              <p className="mt-2 text-xs">PostgreSQL • Docker Desktop</p>
              <p className="mt-3 border-t border-sidebar-border pt-2 text-[11px]">Local demo mode</p>
            </div>
          </SidebarContent>
        </Sidebar>
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="flex flex-wrap items-center justify-end gap-2 border-b bg-card p-3 text-card-foreground">
            <SidebarTrigger className="mr-auto" aria-label={t('Tampilkan/sembunyikan menu navigasi')} title={t('Tampilkan/sembunyikan menu navigasi')} />
            {!isUserPending && !isAccessPending && (isVehicleAdmin || isMealAdmin) && <AdminNotificationCenter isVehicleAdmin={isVehicleAdmin} isMealAdmin={isMealAdmin} />}
            <ThemeToggle />
            {languageMenu}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('Ganti pengguna demo')}>
                  {user ? <UserIdentity user={user} /> : <span className="rounded-xl border bg-card px-3 py-2 text-sm">{t('Memuat pengguna')}...</span>}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>{t('Pilih pengguna demo')}</DropdownMenuLabel>
                {demoUsers.map((demoUser) => (
                  <DropdownMenuItem key={demoUser.email} onSelect={() => { if (demoUser.email !== (user?.userPrincipalName ?? getDemoUserEmail())) { setDemoUserEmail(demoUser.email); window.location.reload(); } }} className="items-start py-2">
                    <span className="mt-1 flex size-4 shrink-0 items-center justify-center">{demoUser.email === (user?.userPrincipalName ?? getDemoUserEmail()) && <Check className="size-3.5" />}</span>
                    <span className="flex min-w-0 flex-col"><span className="truncate font-medium">{demoUser.fullName}</span><span className="truncate text-xs text-muted-foreground">{demoUser.email}</span></span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
