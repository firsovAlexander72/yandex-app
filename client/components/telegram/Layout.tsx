import { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeft, X, Home, UserRound, CreditCard } from "lucide-react";

function TopBar() {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 px-4 pt-[env(safe-area-inset-top)] h-14 bg-gradient-to-b from-background/80 to-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <button
        aria-label="Назад"
        className="p-2 rounded-lg bg-muted/60 text-foreground/80"
      >
        <ArrowLeft className="size-5" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-muted-foreground leading-none">
          Telegram Mini‑App
        </div>
        <div className="font-semibold truncate">Мой магазин</div>
      </div>
      <button
        aria-label="Закрыть"
        className="p-2 rounded-lg bg-muted/60 text-foreground/80"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

function TabBar() {
  const location = useLocation();
  const isActive = (to: string) =>
    location.pathname === to ? "text-primary" : "text-foreground/70";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2">
      <div className="mx-auto max-w-md rounded-2xl bg-foreground/5 backdrop-blur border border-border shadow-lg">
        <ul className="grid grid-cols-3">
          <li>
            <Link
              to="/"
              className={cn(
                "flex flex-col items-center gap-1 py-3",
                isActive("/"),
              )}
            >
              <Home className="size-5" />
              <span className="text-[11px] leading-none">Главная</span>
            </Link>
          </li>
          <li>
            <Link
              to="/payments"
              className={cn(
                "flex flex-col items-center gap-1 py-3",
                isActive("/payments"),
              )}
            >
              <CreditCard className="size-5" />
              <span className="text-[11px] leading-none">Работы</span>
            </Link>
          </li>
          <li>
            <Link
              to="/profile"
              className={cn(
                "flex flex-col items-center gap-1 py-3",
                isActive("/profile"),
              )}
            >
              <UserRound className="size-5" />
              <span className="text-[11px] leading-none">Профиль</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-center bg-cover opacity-30"
        style={{
          backgroundImage:
            "url('https://cdn.builder.io/api/v1/image/assets%2F041983e17e2947ed8fedcf8ed526ef52%2F8d61cf25a62b4f429f7882ae0f930a9a?format=webp&width=1600')",
        }}
      />
      <TopBar />
      <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>
      <TabBar />
    </div>
  );
}
