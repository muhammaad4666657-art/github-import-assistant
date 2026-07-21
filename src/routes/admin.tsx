import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, ArrowLeft, Users, Settings, Tag, MessageSquare, Bell, BellOff, Star, Share2, Inbox } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationSound, ensureNotificationPermission, showBrowserNotification } from "@/lib/notify";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — ALM International" }] }),
  component: AdminLayout,
});

const items = [
  { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders" as const, label: "Orders", icon: ShoppingCart },
  { to: "/admin/chats" as const, label: "Chats", icon: MessageSquare },
  { to: "/admin/leads" as const, label: "Leads", icon: Inbox },
  { to: "/admin/products" as const, label: "Products", icon: Package },
  { to: "/admin/categories" as const, label: "Categories", icon: Tag },
  { to: "/admin/reviews" as const, label: "Reviews", icon: Star },
  { to: "/admin/affiliate" as const, label: "Affiliate System", icon: Share2 },
  { to: "/admin/customers" as const, label: "Customers", icon: Users },
  { to: "/admin/settings" as const, label: "Settings", icon: Settings },
];


function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [notifOn, setNotifOn] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/admin" } });
  }, [user, isAdmin, loading, navigate]);

  // Realtime: new orders + new chat messages
  useEffect(() => {
    if (!isAdmin) return;
    mounted.current = true;

    const orderChannel = supabase.channel("admin_orders_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const o: any = payload.new;
          playNotificationSound();
          showBrowserNotification("🛒 New order!", `${o.customer_name} — Rs. ${Number(o.total).toLocaleString()}`);
          toast.success(`New order from ${o.customer_name} · Rs. ${Number(o.total).toLocaleString()}`, {
            action: { label: "View", onClick: () => navigate({ to: "/admin/orders" }) },
            duration: 10000,
          });
        }).subscribe();

    const chatChannel = supabase.channel("admin_chat_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const m: any = payload.new;
          if (m.sender !== "user") return;
          playNotificationSound();
          showBrowserNotification("💬 New customer message", m.body?.slice(0, 80) || "");
          toast(`💬 ${m.body?.slice(0, 60) || "New message"}`, {
            action: { label: "Reply", onClick: () => navigate({ to: "/admin/chats" }) },
            duration: 8000,
          });
        }).subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifOn(Notification.permission === "granted");
    }
  }, []);

  const enableNotifs = async () => {
    const ok = await ensureNotificationPermission();
    setNotifOn(ok);
    if (ok) {
      playNotificationSound();
      toast.success("Notifications enabled — aap ko new orders ka alert milega");
    } else {
      toast.error("Notification permission denied");
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading admin...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          <div className="font-serif text-2xl">Admin access required</div>
          <p className="mt-2 text-sm text-muted-foreground">Please login with your admin email: ahmadarfi918@gmail.com</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/login" search={{ redirect: "/admin" }} className="h-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm hover:bg-primary/90">Login as Admin</Link>
            <Link to="/" className="h-11 rounded-lg border border-border flex items-center justify-center text-sm hover:bg-secondary">Back to Store</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="font-serif text-xl">ALM <span className="text-gold">Admin</span></div>
          <div className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mt-0.5">Control Panel</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to}
                className={`flex items-center gap-3 px-3 h-10 rounded-lg text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <button onClick={enableNotifs}
            className={`w-full flex items-center gap-2 px-3 h-9 rounded-lg text-xs ${notifOn ? "bg-green-500/10 text-green-700" : "bg-secondary hover:bg-secondary/80"}`}>
            {notifOn ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            {notifOn ? "Alerts ON" : "Enable alerts"}
          </button>
          <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back to store
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
