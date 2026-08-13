import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Bell, CalendarDays, Clock3, FileText, LayoutDashboard, LogOut, PanelLeft, Plus, Settings, Users } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/app" },
  { icon: CalendarDays, label: "Calendar", path: "/calendar" },
  { icon: FileText, label: "Library", path: "/library" },
  { icon: Users, label: "Accounts", path: "/accounts" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="grid min-h-screen place-items-center bg-[#f8f7fb] p-5"><div className="max-w-sm rounded-[24px] border border-[#ebe7f2] bg-white p-7 text-center shadow-[0_20px_45px_rgba(52,39,111,0.08)]"><span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#eeebff] text-[#6657df]"><Clock3 className="size-5"/></span><h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.05em] text-[#302740]">A calm place to publish.</h1><p className="mt-2 text-sm leading-6 text-[#766e81]">Sign in to enter your TimePilot workspace.</p><Button onClick={()=>startLogin()} className="mt-6 w-full rounded-xl bg-[#5c4ee5] text-white hover:bg-[#4e40d8]">Sign in</Button></div></div>;
  return <SidebarProvider defaultOpen><WorkspaceLayout>{children}</WorkspaceLayout></SidebarProvider>;
}

function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth(); const [location, setLocation] = useLocation(); const mobile = useIsMobile();
  const active = menuItems.find(item=>item.path===location) ?? menuItems[0];
  return <><Sidebar collapsible="icon" className="border-r border-[#e9e6ef] bg-white"><SidebarHeader className="h-[76px] px-3 py-3"><div className="flex items-center gap-2.5 px-2"><button className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#7063ef] to-[#b878ef] text-white shadow-[0_7px_16px_rgba(104,82,225,0.25)]" onClick={()=>setLocation("/app")} aria-label="Go to overview"><Clock3 className="size-4"/></button><span className="font-display text-[18px] font-semibold tracking-[-0.045em] text-[#28203b] group-data-[collapsible=icon]:hidden">timepilot</span></div></SidebarHeader><SidebarContent className="px-3"><div className="mb-5 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#aaa3b3] group-data-[collapsible=icon]:hidden">Workspace</div><SidebarMenu>{menuItems.map(item=><SidebarMenuItem key={item.path}><SidebarMenuButton isActive={item.path===active.path} tooltip={item.label} onClick={()=>setLocation(item.path)} className="h-10 rounded-xl text-[#746c7f] data-[active=true]:bg-[#f0eeff] data-[active=true]:font-semibold data-[active=true]:text-[#5e50d2]"><item.icon className="size-4"/><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><div className="mt-7 rounded-xl bg-[#25203b] p-3 text-white group-data-[collapsible=icon]:hidden"><p className="text-xs font-semibold">Make time work for you.</p><p className="mt-1 text-[10px] leading-4 text-white/55">Local planning, universal delivery.</p><Button onClick={()=>setLocation("/calendar")} size="sm" className="mt-3 h-7 w-full rounded-lg bg-white/12 text-[10px] text-white hover:bg-white/20"><Plus className="mr-1 size-3"/>New post</Button></div></SidebarContent><SidebarFooter className="border-t border-[#eeeaf3] p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-[#f7f5fa]"><Avatar className="size-8"><AvatarFallback className="bg-[#eae7ff] text-[11px] font-bold text-[#6758df]">{user?.name?.slice(0,1).toUpperCase() || "T"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-semibold text-[#504859]">{user?.name || "TimePilot user"}</p><p className="mt-0.5 truncate text-[10px] text-[#908899]">{user?.email || "Personal workspace"}</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" side="top" className="w-48 rounded-xl"><DropdownMenuItem onClick={()=>setLocation("/settings")}><Settings className="mr-2 size-3.5"/>Settings</DropdownMenuItem><DropdownMenuItem onClick={logout} className="text-[#c4526d] focus:text-[#c4526d]"><LogOut className="mr-2 size-3.5"/>Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><SidebarInset className="bg-[#f8f7fb]"><header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-[#e9e6ef] bg-[#f8f7fb]/85 px-5 backdrop-blur-xl lg:px-8"><div className="flex items-center gap-3">{mobile&&<SidebarTrigger className="rounded-lg"/>}<div><p className="text-xs font-semibold text-[#51495e]">{active.label}</p><p className="mt-0.5 hidden text-[10px] text-[#91899a] sm:block">{new Intl.DateTimeFormat("en-US", {weekday:"long", month:"long", day:"numeric"}).format(new Date())}</p></div></div><div className="flex items-center gap-2"><Button onClick={()=>setLocation("/calendar")} className="hidden h-9 rounded-lg bg-[#5c4ee5] px-3 text-xs text-white hover:bg-[#4e40d8] sm:inline-flex"><Plus className="mr-1 size-3.5"/>Compose</Button><Button variant="ghost" size="icon" onClick={()=>setLocation("/app")} className="size-9 rounded-lg text-[#746c7f]"><Bell className="size-4"/></Button></div></header><main className="px-5 py-7 lg:px-8">{children}</main></SidebarInset></>;
}
