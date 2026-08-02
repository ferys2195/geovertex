"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { UserRole } from "@/lib/supabase/types";
import { TeamMemberItem } from "../../types/project.types";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  members: TeamMemberItem[];
  currentRole: UserRole;
  isProTier?: boolean;
  onInviteMember: (email: string, role: UserRole) => Promise<boolean>;
  onRemoveMember: (memberId: string) => Promise<void>;
}

export function ShareModal({
  isOpen,
  onClose,
  projectTitle,
  members,
  currentRole,
  isProTier = false,
  onInviteMember,
  onRemoveMember,
}: ShareModalProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const maxMembers = isProTier ? 999 : 2;
  const isQuotaReached = !isProTier && members.length >= maxMembers;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    if (isQuotaReached) {
      setErrorMessage("Batas kuota Free Tier tercapai (Maksimal 2 anggota tim per proyek). Upgrade ke Pro Tier untuk anggota tanpa batas!");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const success = await onInviteMember(inviteEmail.trim(), inviteRole);
      if (success) {
        setSuccessMessage(`Berhasil mengundang ${inviteEmail} sebagai ${inviteRole}`);
        setInviteEmail("");
      } else {
        setErrorMessage("Gagal mengundang anggota. Pastikan email valid.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengundang anggota tim.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-125 bg-background border-border text-foreground shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Users className="w-5 h-5 text-primary" />
            Kolaborasi & Akses Tim
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Kelola anggota tim yang dapat mengakses proyek <span className="font-semibold text-foreground">"{projectTitle}"</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Invite Form */}
        {currentRole === "owner" ? (
          <form onSubmit={handleInvite} className="space-y-3 p-3.5 bg-muted/50 rounded-lg border border-border mt-1">
            <label className="block text-xs font-semibold text-muted-foreground">Undang Anggota Baru via Email</label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="nama@perusahaan.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-1"
                disabled={isQuotaReached || isSubmitting}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="bg-background border border-input rounded-md px-3 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
                disabled={isQuotaReached || isSubmitting}
              >
                <option value="editor">Editor (Bisa Edit)</option>
                <option value="viewer">Viewer (Read-Only)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                Kuota Tim: <span className="font-bold text-foreground">{members.length}</span> / {isProTier ? "∞" : "2 (Free Tier)"}
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={isQuotaReached || isSubmitting || !inviteEmail.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Undang
              </Button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-destructive mt-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </form>
        ) : (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs flex items-start gap-2.5 mt-1">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold uppercase tracking-wider text-[10px]">Akses Terbatas ({currentRole})</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Hanya Pemilik Proyek (Owner) yang memiliki wewenang untuk mengundang atau mengelola anggota tim.
              </p>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2 mt-2">
          <label className="block text-xs font-semibold text-muted-foreground">Daftar Anggota Proyek ({members.length})</label>
          <div className="max-h-55 overflow-y-auto space-y-2 pr-1">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 bg-card hover:bg-accent/40 rounded-lg border border-border transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                    {member.full_name?.charAt(0) || member.email.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{member.full_name || member.email}</p>
                    <p className="text-[11px] text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      member.role === "owner"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : member.role === "editor"
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                    }`}
                  >
                    {member.role}
                  </span>

                  {currentRole === "owner" && member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveMember(member.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
