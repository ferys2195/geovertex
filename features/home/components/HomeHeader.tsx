"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Layers,
  ArrowRight,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const NAV_ITEMS = [
  { id: "sandbox", label: "Interactive Sandbox" },
  { id: "features", label: "Fitur Unggulan" },
  { id: "comparison", label: "GeoVertex vs QGIS" },
  { id: "pricing", label: "Dukungan & Donasi" },
];

export function HomeHeader() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserData(session?.user ?? null);
    });

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

  // Handle scroll detection for dynamic sticky header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle IntersectionObserver for active section highlighting
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions: IntersectionObserverInit = {
      rootMargin: "-20% 0px -50% 0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setIsOpen(false);
    setIsMobileMenuOpen(false);
    router.refresh();
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-xl shadow-slate-950/50"
          : "bg-slate-950/70 backdrop-blur-md border-b border-slate-800/40"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/30 shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-lg sm:text-xl text-white tracking-tight">GeoVertex</span>
            <span className="hidden xs:inline-flex px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
              BETA V1.0
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`relative px-3 py-1.5 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeHeaderNav"
                    className="absolute inset-0 bg-blue-500/15 border border-blue-500/30 rounded-lg -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Desktop & Mobile Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoading ? (
            <div className="h-8 sm:h-9 w-20 sm:w-28 bg-slate-800/60 rounded-xl animate-pulse" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                onClick={() => setIsOpen(!isOpen)}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/90 text-slate-200 text-xs sm:text-sm h-8 sm:h-10 px-2.5 sm:px-3.5 rounded-xl flex items-center gap-1.5 sm:gap-2 transition-all shadow-sm"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <UserIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="max-w-17.5 xs:max-w-[100px] sm:max-w-30 truncate text-xs font-medium text-slate-200">
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
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-slate-300 hover:text-white hover:bg-slate-900 text-xs sm:text-sm h-8 sm:h-10 px-3"
                  >
                    Masuk
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm h-8 sm:h-10 px-3.5 shadow-lg shadow-blue-600/25">
                    Mulai Gratis <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>

              {/* Mobile-only compact button for logged out users */}
              <div className="flex sm:hidden items-center gap-1.5">
                <Link href="/login">
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-8 px-2.5 shadow-md shadow-blue-600/20">
                    Mulai Gratis
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-slate-300 hover:text-white hover:bg-slate-900 h-8 w-8 sm:h-9 sm:w-9 rounded-lg shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
            ) : (
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-5 py-4 space-y-4 shadow-2xl"
          >
            <nav className="flex flex-col space-y-1 text-xs sm:text-sm font-medium">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleNavClick(e, item.id)}
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      isActive
                        ? "bg-blue-600/20 text-white font-semibold border border-blue-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />
                    )}
                  </a>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              {!user ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full h-9 border-slate-800 bg-slate-900 text-slate-200 hover:text-white text-xs rounded-xl">
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20">
                      Mulai Gratis
                    </Button>
                  </Link>
                </div>
              ) : (
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Buka Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
