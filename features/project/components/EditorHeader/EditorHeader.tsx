import React from "react";
import { CloudSaveStatus, UserRole } from "../../types/project.types";
import { ProjectTitleBar } from "./ProjectTitleBar";
import { AutoSaveStatus } from "./AutoSaveStatus";
import { ActionButtons } from "./ActionButtons";

interface EditorHeaderProps {
  projectTitle?: string;
  currentRole: UserRole;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isAutoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  saveStatus: CloudSaveStatus;
  onOpenShareModal: () => void;
  onOpenExportModal: () => void;
}

export function EditorHeader({
  projectTitle,
  currentRole,
  isSidebarOpen,
  onToggleSidebar,
  isAutoSaveEnabled,
  onToggleAutoSave,
  saveStatus,
  onOpenShareModal,
  onOpenExportModal,
}: EditorHeaderProps) {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
      <ProjectTitleBar
        projectTitle={projectTitle}
        currentRole={currentRole}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
      />

      <div className="flex items-center gap-3">
        <AutoSaveStatus
          isAutoSaveEnabled={isAutoSaveEnabled}
          onToggleAutoSave={onToggleAutoSave}
          saveStatus={saveStatus}
        />

        <ActionButtons
          onOpenShareModal={onOpenShareModal}
          onOpenExportModal={onOpenExportModal}
        />
      </div>
    </header>
  );
}
