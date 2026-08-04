"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Coffee, ExternalLink, Sparkles, ShieldCheck, Gift } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const trakteerUrl = process.env.NEXT_PUBLIC_TRAKTEER_URL || "https://trakteer.id";
  const saweriaUrl = process.env.NEXT_PUBLIC_SAWERIA_URL || "https://saweria.co";
  const bmacUrl = process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL || "https://buymeacoffee.com";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900/95 border-slate-800 text-slate-100 backdrop-blur-xl shadow-2xl overflow-hidden p-0 rounded-2xl">
        {/* Header Hero Banner with Gradient */}
        <div className="relative bg-linear-to-br from-amber-500/20 via-orange-500/10 to-rose-500/20 p-6 pt-8 pb-6 border-b border-slate-800 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-linear-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-4 ring-orange-500/10 mb-3">
            <Coffee className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-50 flex items-center justify-center gap-2">
            Dukung Pengembangan GeoVertex <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
            GeoVertex 100% bebas digunakan tanpa batasan fitur atau watermark. Dukungan Anda sangat berarti untuk menjaga server tetap hidup & mempercepat fitur baru!
          </DialogDescription>
        </div>

        {/* Support Options List */}
        <div className="p-6 space-y-3.5 bg-slate-950/40">
          <a
            href={trakteerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-rose-950/40 to-slate-900/80 border border-rose-800/30 hover:border-rose-500/60 transition-all duration-200 hover:shadow-lg hover:shadow-rose-950/30"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 fill-rose-500/20" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                  Trakteer.id
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium">
                    QRIS & E-Wallet
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Dukung dengan Cendol via GoPay, OVO, Dana, QRIS</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </a>

          <a
            href={saweriaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-amber-950/40 to-slate-900/80 border border-amber-800/30 hover:border-amber-500/60 transition-all duration-200 hover:shadow-lg hover:shadow-amber-950/30"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                  Saweria.co
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                    QRIS Instant
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Dukungan langsung via All Payment QRIS</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </a>

          {process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL && (
            <a
              href={bmacUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-amber-950/20 to-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-200"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover:scale-105 transition-transform">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                    Buy Me a Coffee
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                      Global / Card
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Dukungan via Credit Card / PayPal</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-yellow-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </a>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>GeoVertex tetap 100% Gratis selamanya</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-slate-400 hover:text-slate-200">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
