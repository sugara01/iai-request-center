import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, BookOpenCheck, CarFront, Check, ChevronDown, ChevronRight, ClipboardList, Gauge, Inbox as InboxIcon, KeyRound, Languages, LogOut, Presentation, SquarePen, UserRound, Users, Workflow } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InboxNotificationBell, useAdminNotificationCounts } from '@/components/admin-notification-center';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserIdentity } from '@/components/user-identity';
import { useUser, type AppUser } from '@/hooks/use-user';
import { useAdminAuthorization } from '@/hooks/use-admin-access';
import { useInboxApprovals, useUserNotifications } from '@/hooks/use-inbox';
import { useLanguage, type Language } from '@/lib/localization';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

const requesterLinks = [
  { to: '/', label: 'Dashboard Saya', icon: Gauge },
  { to: '/buat-request', label: 'Buat Request', icon: SquarePen },
  { to: '/panduan-requester', label: 'Panduan Requester', icon: BookOpenCheck },
];

type SidebarSectionState = {
  requester: boolean;
  inbox: boolean;
  administration: boolean;
};

const SIDEBAR_SECTION_STATE_KEY = 'iai-request-center-sidebar-sections';
const defaultSidebarSectionState: SidebarSectionState = {
  requester: true,
  inbox: true,
  administration: true,
};

function loadSidebarSectionState(): SidebarSectionState {
  try {
    const saved = JSON.parse(localStorage.getItem(SIDEBAR_SECTION_STATE_KEY) ?? 'null') as Partial<SidebarSectionState> | null;
    return {
      requester: typeof saved?.requester === 'boolean' ? saved.requester : true,
      inbox: typeof saved?.inbox === 'boolean' ? saved.inbox : true,
      administration: typeof saved?.administration === 'boolean' ? saved.administration : true,
    };
  } catch {
    return defaultSidebarSectionState;
  }
}

type DemoViewRole = 'User' | 'Approver' | 'Vehicle Admin' | 'Meal Admin';

const demoViewRoles: DemoViewRole[] = ['User', 'Approver', 'Vehicle Admin', 'Meal Admin'];

function roleBadgeClass(role: AppUser['role']) {
  if (role === 'SuperAdmin') return 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200';
  if (role === 'ITAdmin') return 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200';
  return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300';
}

function roleBadgeLabel(role: AppUser['role']) {
  if (role === 'SuperAdmin') return 'SUPER ADMIN';
  if (role === 'ITAdmin') return 'IT ADMIN';
  return 'USER';
}

export default function Layout() {
  const { language, setLanguage, t } = useLanguage();
  const { data: user, isPending: isUserPending } = useUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [demoRole, setDemoRole] = useState<DemoViewRole | null>(null);
  const [sidebarSectionState, setSidebarSectionState] = useState<SidebarSectionState>(loadSidebarSectionState);
  const email = user?.userPrincipalName;
  const { isVehicleAdmin, isMealAdmin, isITAdmin, isSuperAdmin, isPending: isAccessPending } = useAdminAuthorization(email);
  const notificationCounts = useAdminNotificationCounts(isVehicleAdmin, isMealAdmin);
  const canSeeApprovalQueue = isVehicleAdmin || isMealAdmin;
  const { data: inboxApprovals = [] } = useInboxApprovals(canSeeApprovalQueue);
  const { data: notifications } = useUserNotifications();
  const showVehicleAdmin = demoRole ? demoRole === 'Vehicle Admin' : isVehicleAdmin;
  const showMealAdmin = demoRole ? demoRole === 'Meal Admin' : isMealAdmin;
  const adminLinks = [
    ...(showVehicleAdmin ? [{ to: '/admin-kendaraan', label: t('Admin Kendaraan'), icon: CarFront, count: notificationCounts.vehicle }] : []),
    ...(showMealAdmin ? [{ to: '/admin-meal', label: t('Admin Extra Meal'), icon: ClipboardList, count: notificationCounts.meal }] : []),
    ...(showVehicleAdmin || showMealAdmin ? [{ to: '/panduan-power-automate', label: t('Workflow Request'), icon: Workflow }] : []),
    ...(!demoRole && (isITAdmin || isSuperAdmin) ? [{ to: '/kelola-pengguna', label: t('Kelola Pengguna'), icon: Users }] : []),
  ];
  const inboxLinks = [
    ...(canSeeApprovalQueue ? [{ to: '/inbox/approvals', label: t('Pending Approvals'), icon: InboxIcon, count: inboxApprovals.length }] : []),
    { to: '/inbox/notifications', label: t('Notifications'), icon: Bell, count: notifications?.unreadCount ?? 0 },
  ];
  const localizedRequesterLinks = requesterLinks.map((link: typeof requesterLinks[number]) => ({ ...link, label: t(link.label) }));
  useEffect(() => {
    localStorage.setItem(SIDEBAR_SECTION_STATE_KEY, JSON.stringify(sidebarSectionState));
  }, [sidebarSectionState]);
  useEffect(() => {
    let section: keyof SidebarSectionState | undefined;
    if (location.pathname === '/' ||
      ['/buat-request', '/request-kendaraan', '/request-extra-meal', '/panduan-requester'].includes(location.pathname) ||
      location.pathname.startsWith('/request/')) {
      section = 'requester';
    } else if (location.pathname.startsWith('/inbox/')) {
      section = 'inbox';
    } else if (
      location.pathname.startsWith('/admin-kendaraan') ||
      location.pathname.startsWith('/admin-meal') ||
      location.pathname.startsWith('/panduan-power-automate') ||
      location.pathname.startsWith('/kelola-pengguna')
    ) {
      section = 'administration';
    }
    if (section) {
      setSidebarSectionState((current) => current[section!] ? current : { ...current, [section!]: true });
    }
  }, [location.pathname]);
  const toggleSidebarSection = (section: keyof SidebarSectionState) => {
    setSidebarSectionState((current) => ({ ...current, [section]: !current[section] }));
  };
  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      setDemoRole(null);
      queryClient.clear();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not sign out.');
    }
  };
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
            <Collapsible open={sidebarSectionState.requester} onOpenChange={() => toggleSidebarSection('requester')}>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel asChild>
                    <button type="button" className="flex w-full cursor-pointer items-center justify-between rounded-md pr-2 hover:text-sidebar-accent-foreground" aria-expanded={sidebarSectionState.requester}>
                      <span>{t('Requester')}</span>
                      {sidebarSectionState.requester ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </button>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent><SidebarMenu>{renderLinks(localizedRequesterLinks)}</SidebarMenu></SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
            <Collapsible open={sidebarSectionState.inbox} onOpenChange={() => toggleSidebarSection('inbox')}>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel asChild>
                    <button type="button" className="flex w-full cursor-pointer items-center justify-between rounded-md pr-2 hover:text-sidebar-accent-foreground" aria-expanded={sidebarSectionState.inbox}>
                      <span>{t('Inbox')}</span>
                      {sidebarSectionState.inbox ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </button>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent><SidebarMenu>{renderLinks(inboxLinks)}</SidebarMenu></SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
            {isUserPending || isAccessPending ? (
              <Collapsible open={sidebarSectionState.administration} onOpenChange={() => toggleSidebarSection('administration')}>
                <SidebarGroup aria-label={t('Memuat akses administrasi')}>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel asChild>
                      <button type="button" className="flex w-full cursor-pointer items-center justify-between rounded-md pr-2 hover:text-sidebar-accent-foreground" aria-expanded={sidebarSectionState.administration}>
                        <span>{t('Administration')}</span>
                        {sidebarSectionState.administration ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </button>
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent><div className="space-y-2 px-2" aria-hidden="true"><div className="h-8 animate-pulse rounded-md bg-sidebar-accent" /><div className="h-8 animate-pulse rounded-md bg-sidebar-accent" /></div></SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ) : adminLinks.length > 0 && (
              <Collapsible open={sidebarSectionState.administration} onOpenChange={() => toggleSidebarSection('administration')}>
                <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel asChild>
                      <button type="button" className="flex w-full cursor-pointer items-center justify-between rounded-md pr-2 hover:text-sidebar-accent-foreground" aria-expanded={sidebarSectionState.administration}>
                        <span>{t('Administration')}</span>
                        {sidebarSectionState.administration ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </button>
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent><SidebarMenu>{renderLinks(adminLinks)}</SidebarMenu></SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            )}
            <div className="mx-3 mt-auto mb-4 rounded-lg bg-sidebar-accent p-3 text-left text-sidebar-foreground">
              <p className="text-xs font-medium">Database</p>
              <p className="mt-2 text-xs">PostgreSQL • Docker Desktop</p>
              <p className="mt-3 border-t border-sidebar-border pt-2 text-[11px]">Authenticated account</p>
            </div>
          </SidebarContent>
        </Sidebar>
        <main className="min-w-0 flex-1 overflow-x-hidden">
          {demoRole && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-100 px-4 py-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
              <div>
                <p className="text-sm font-bold tracking-wide">DEMO MODE ACTIVE</p>
                <p className="text-sm">Viewing application as: <span className="font-semibold">{demoRole}</span></p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setDemoRole(null)}>{t('Keluar dari Mode Demo')}</Button>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2 border-b bg-card p-3 text-card-foreground">
            <SidebarTrigger className="mr-auto" aria-label={t('Tampilkan/sembunyikan menu navigasi')} title={t('Tampilkan/sembunyikan menu navigasi')} />
            {!isUserPending && <InboxNotificationBell />}
            <ThemeToggle />
            {languageMenu}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('Menu profil pengguna')}>
                  {user ? <UserIdentity user={user} /> : <span className="rounded-xl border bg-card px-3 py-2 text-sm">{t('Memuat pengguna')}...</span>}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="font-normal">
                  <span className="block truncate font-semibold text-foreground">{user?.fullName}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
                  {user && <Badge className={`mt-2 ${roleBadgeClass(user.role)}`}>{roleBadgeLabel(user.role)}</Badge>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/profile"><UserRound />{t('Lihat Profil')}</NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/change-password"><KeyRound />{t('Ubah Password')}</NavLink>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger><Presentation />{t('Mode Demo')}</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={demoRole ?? ''}
                        onValueChange={(value) => {
                          if (demoViewRoles.includes(value as DemoViewRole)) setDemoRole(value as DemoViewRole);
                        }}
                      >
                        {demoViewRoles.map((role) => (
                          <DropdownMenuRadioItem key={role} value={role}>{role}</DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { void logout(); }}><LogOut />{t('Keluar')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
