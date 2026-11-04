import { NavLink, Outlet } from 'react-router-dom';
import { BookOpenCheck, CarFront, Check, ChevronDown, ClipboardList, Gauge, Languages, ShieldCheck, SquarePen, Workflow } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdminNotificationCenter, useAdminNotificationCounts } from '@/components/admin-notification-center';
import { useUser } from '@/hooks/use-user';
import { useAdminAuthorization } from '@/hooks/use-admin-access';
import { useLanguage, type Language } from '@/lib/localization';

const requesterLinks = [
  { to: '/', label: 'Dashboard Saya', icon: Gauge },
  { to: '/buat-request', label: 'Buat Request', icon: SquarePen },
  { to: '/panduan-requester', label: 'Panduan Requester', icon: BookOpenCheck },
];
export default function Layout() {
  const { language, setLanguage, t } = useLanguage();
  const { data: user, isPending: isUserPending } = useUser();
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
  return <SidebarProvider><div className="flex min-h-screen w-full bg-background text-foreground"><Sidebar><SidebarHeader className="border-b border-sidebar-border p-5"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><SquarePen className="size-5" /></div><div><p className="font-semibold">IAI Request Center</p><p className="text-xs text-sidebar-foreground">INEOS Aromatics Indonesia</p></div></div></SidebarHeader><SidebarContent><SidebarGroup><SidebarGroupLabel>{t('Requester')}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{renderLinks(localizedRequesterLinks)}</SidebarMenu></SidebarGroupContent></SidebarGroup>{isUserPending || isAccessPending ? <SidebarGroup aria-label={t('Memuat akses administrasi')}><SidebarGroupLabel>{t('Administration')}</SidebarGroupLabel><SidebarGroupContent><div className="space-y-2 px-2" aria-hidden="true"><div className="h-8 rounded-md bg-sidebar-accent animate-pulse" /><div className="h-8 rounded-md bg-sidebar-accent animate-pulse" /></div></SidebarGroupContent></SidebarGroup> : adminLinks.length > 0 && <SidebarGroup><SidebarGroupLabel>{t('Administration')}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{renderLinks(adminLinks)}</SidebarMenu></SidebarGroupContent></SidebarGroup>}<div className="mx-3 mt-auto mb-4 rounded-lg bg-sidebar-accent p-3 text-left text-sidebar-accent-foreground"><p className="text-xs font-medium">Data sources:</p><div className="mt-2 flex items-center justify-start gap-2 text-xs"><span>SharePoint List Db: Online</span><span className="size-2 shrink-0 rounded-full bg-online" role="img" aria-label="Online" /></div><p className="mt-3 border-t border-sidebar-border pt-2 text-[11px]">Riyan Sugara @2026</p></div></SidebarContent></Sidebar><main className="min-w-0 flex-1 overflow-x-hidden"><div className="flex justify-end gap-2 border-b bg-card p-3 text-card-foreground">{!isUserPending && !isAccessPending && (isVehicleAdmin || isMealAdmin) && <AdminNotificationCenter isVehicleAdmin={isVehicleAdmin} isMealAdmin={isMealAdmin} />}{languageMenu}</div><Outlet /></main></div></SidebarProvider>;
}
