import { useLocation } from "react-router-dom";
import { Church, LayoutDashboard, UserPlus, ClipboardList, AlertTriangle, Users, LogOut, Fingerprint } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Registrar Asistencia", url: "/registrar", icon: ClipboardList },
  { title: "Miembros", url: "/miembros", icon: Users },
  { title: "Reportes", url: "/reportes", icon: UserPlus },
  { title: "Alertas", url: "/alertas", icon: AlertTriangle },
  { title: "Registro Huellas", url: "/huellas", icon: Fingerprint },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <Sidebar>
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <Church className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <p className="font-serif font-bold text-sm text-sidebar-foreground">Asistencia</p>
          <p className="text-xs text-sidebar-foreground/60">Iglesia</p>
        </div>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
