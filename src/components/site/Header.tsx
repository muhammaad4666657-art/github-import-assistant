import { Link } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, LogOut, LayoutDashboard, Package, Gem, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { SearchBar } from "./SearchBar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { label: "Home", to: "/" as const },
  { label: "Shop", to: "/products" as const },
  { label: "About", to: "/about" as const },
  { label: "Contact", to: "/contact" as const },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const wishlist = useWishlist();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 header-shrink ${
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-border shadow-soft"
          : "bg-background/60 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div className={`max-w-7xl mx-auto px-4 flex items-center gap-5 header-shrink ${scrolled ? "h-16" : "h-20"}`}>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center shrink-0 group">
          <img
            src="/logo.png"
            alt="ALM International"
            className="h-9 sm:h-10 md:h-11 w-auto object-contain group-hover:scale-[1.03] transition-transform duration-300 drop-shadow-sm"
          />

        </Link>

        <nav className="hidden md:flex items-center gap-7 ml-4 text-sm">
          {nav.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              className="relative font-medium text-foreground/75 hover:text-primary transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all after:duration-300"
              activeProps={{ className: "text-primary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <SearchBar className="hidden lg:block flex-1 max-w-md ml-auto" />
        <div className="flex items-center gap-3 ml-auto lg:ml-2">
          <Link
            to="/distributor/login"
            className="hidden md:inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] px-3.5 py-2 rounded-full bg-gradient-royal text-primary-foreground shadow-soft hover:opacity-95 transition"
          >
            <Gem className="h-3.5 w-3.5" /> Distributor
          </Link>
          <Link to="/account" className="hidden sm:flex relative items-center" aria-label="Wishlist">
            <Heart className="h-5 w-5 text-foreground/80 hover:text-primary transition-colors" />
            {wishlist.count > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-semibold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                {wishlist.count}
              </span>
            )}
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 text-sm">
                <div className="h-9 w-9 rounded-full bg-gradient-royal text-primary-foreground flex items-center justify-center shadow-soft">
                  <User className="h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/account"><Package className="h-4 w-4 mr-2" />My Orders</Link></DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild><Link to="/admin"><LayoutDashboard className="h-4 w-4 mr-2" />Admin Panel</Link></DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="hidden sm:flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
              <User className="h-4 w-4" /> Sign in
            </Link>
          )}
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-semibold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-soft">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      <div className="lg:hidden px-4 pb-3">
        <SearchBar onNavigate={() => setOpen(false)} />
      </div>
      {open && (
        <nav className="md:hidden border-t border-border px-4 py-3 flex flex-col gap-3 text-sm bg-background/95 backdrop-blur">
          {nav.map((n) => <Link key={n.label} to={n.to} onClick={() => setOpen(false)}>{n.label}</Link>)}
          {!user && <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>}
          <Link to="/distributor/login" onClick={() => setOpen(false)} className="text-primary font-medium">Distributor Portal</Link>
        </nav>
      )}
    </header>
  );
}
