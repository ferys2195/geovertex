"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Layers,
  ArrowRight,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function HomeHeader() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadUserData = async (currentUser: User | null) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserName(null);
        setIsLoading(false);
        return;
      }

      // Check metadata full_name or name
      const metaName =
        currentUser.user_metadata?.full_name || currentUser.user_metadata?.name;

      let displayName: string | null = metaName || currentUser.email?.split("@")[0] || null;

      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (prof?.full_name) {
          displayName = prof.full_name;
        }
      } catch (err) {
        console.error("Failed to fetch profile name:", err);
      }

      setUserName(displayName);
      setIsLoading(false);
    };

    // Check initial auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserData(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUserData(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-xl text-white tracking-tight">GeoVertex</span>
            <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
              BETA V1.0
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#sandbox" className="hover:text-white transition-colors">
            Interactive Sandbox
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Fitur Unggulan
          </a>
          <a href="#comparison" className="hover:text-white transition-colors">
            GeoVertex vs QGIS
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Harga & Paket
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-28 bg-slate-800/60 rounded-xl animate-pulse" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                onClick={() => setIsOpen(!isOpen)}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/90 text-slate-200 text-sm h-10 px-3.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="max-w-30 truncate text-xs font-medium text-slate-200">
                  {userName || user.email?.split("@")[0] || "Akun Saya"}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </Button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                      Terautentikasi Sebagai
                    </p>
                    <p className="text-xs font-semibold text-white truncate mt-0.5">
                      {userName || "User"}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-blue-600/10 transition-colors mx-1 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-400" />
                    <span>Dashboard</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors mx-1 rounded-lg text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Logout / Keluar</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-slate-900 text-sm"
                >
                  Masuk
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25">
                  Mulai Gratis <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

