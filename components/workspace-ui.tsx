"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { ArrowLeft, Menu } from "lucide-react";
import { version } from "@/package.json";
import type { Role } from "@/lib/model";
import type { CloudReceipt } from "@/lib/cloud-receipt";
export function WorkspaceViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    function sync() {
      const height = viewport?.height || window.innerHeight;
      root.style.setProperty("--workspace-viewport", height + "px");
      root.dataset.keyboardOpen = String(window.innerHeight - height > 150);
    }
    sync();
    viewport?.addEventListener("resize", sync);
    window.addEventListener("resize", sync);
    return () => {
      viewport?.removeEventListener("resize", sync);
      window.removeEventListener("resize", sync);
      delete root.dataset.keyboardOpen;
      root.style.removeProperty("--workspace-viewport");
    };
  }, []);
  return null;
}
export function WorkspaceHeader({
  role,
  onRole,
  onTools,
  onHome,
  toolsOpen,
  disabled = false,
}: {
  role: Role;
  onRole: (role: Role) => void;
  onTools: () => void;
  onHome: () => void;
  toolsOpen: boolean;
  disabled?: boolean;
}) {
  return (
    <header className="shared-app-header">
      <div className="header-content">
        <div className="brand-lockup">
        <button
          className="shared-brand"
          onClick={onHome}
          disabled={disabled}
          aria-label="Go to workspace home"
        >
          juggle<span>®</span>
        </button>
        <a className="app-version" href="/preview" target="_top" title="Open desktop, iPad and phone preview">v{version}<span> · Preview</span></a>
        </div>
        <button
          type="button"
          className="shared-tools"
          aria-label="Open workspace tools"
          aria-expanded={toolsOpen}
          aria-controls="workspace-tools"
          onClick={onTools}
          disabled={disabled}
        >
          <Menu size={20} />
          <span>Tools</span>
        </button>
        <label className="shared-role">
          <span>Interface</span>
          <select
            aria-label="Change interface"
            value={role}
            disabled={disabled}
            onChange={(e) => onRole(e.target.value as Role)}
          >
            <option>Director</option>
            <option>Manager</option>
            <option>Subcontractor</option>
          </select>
        </label>
      </div>
    </header>
  );
}
export function SaveStatus({
  ready,
  cloud,
  status,
  receipt,
  onAccount,
  onReset,
}: {
  ready: boolean;
  cloud: boolean;
  status: string;
  receipt: CloudReceipt | null;
  onAccount: () => void;
  onReset: () => void;
}) {
  const state = !ready
    ? "loading"
    : !cloud
      ? "local"
      : status.startsWith("Not saved")
        ? "failed"
        : status === "Saved to Supabase"
          ? "saved"
          : "pending";
  const label = {
    loading: "Opening workspace",
    local: "Local demo · not synced",
    failed: "Save failed",
    saved: "Cloud saved",
    pending: "Saving to cloud",
  }[state];
  const detail = !ready
    ? "Checking your account and saved records…"
    : !cloud
      ? "Records and photos stay on this device until you sign in."
      : state === "failed"
        ? "Your latest changes are not confirmed. Open Account to retry."
        : receipt
          ? `Verified revision ${receipt.revision} · ${receipt.equipment} appliances · ${receipt.files} file references · ${new Date(receipt.savedAt).toLocaleTimeString()}`
          : "Waiting for Supabase to confirm this save.";
  return (
    <section
      className={"shared-save-status " + state}
      aria-label="Workspace save status"
    >
      <div className="save-status-content">
        <div className="save-status-copy" role="status" aria-live="polite">
          <strong>{label}</strong>
          <span>{detail}</span>
        </div>
        <button
          type="button"
          className="secondary shared-account"
          disabled={!ready}
          onClick={onAccount}
        >
          {cloud ? "Account" : "Sign in"}
        </button>
        <details className="storage-options">
          <summary aria-label="Workspace storage options">•••</summary>
          <div>
            <p>Role switching is a prototype within one account.</p>
            <button type="button" onClick={onReset}>
              {cloud ? "Reset workspace" : "Reload sample kitchen"}
            </button>
          </div>
        </details>
      </div>
    </section>
  );
}
export function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="shared-page-title">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="page-title-action">{action}</div>
    </div>
  );
}
export function Panel({
  children,
  className = "",
  as = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
}) {
  const Tag = as;
  return <Tag className={"shared-panel " + className}>{children}</Tag>;
}
export function ActionBar({
  children,
  onBack,
  backDisabled = false,
  backLabel = "Back",
}: {
  children: ReactNode;
  onBack?: () => void;
  backDisabled?: boolean;
  backLabel?: string;
}) {
  return (
    <div className="action-anchor">
      <div className="shared-action-bar">
        <div className="action-bar-content">
          <button
            type="button"
            className="secondary shared-back"
            disabled={backDisabled || !onBack}
            onClick={onBack}
          >
            <ArrowLeft size={18} />
            <span>{backLabel}</span>
          </button>
          <div className="shared-next">{children}</div>
        </div>
      </div>
    </div>
  );
}
export function PageLoading() {
  return (
    <Panel className="page-loading">
      <div role="status" aria-live="polite">
        <h2>Opening your workspace…</h2>
        <p>Checking the account and reading saved kitchen records.</p>
      </div>
      <div className="skeleton-row" />
      <div className="skeleton-row" />
      <div className="skeleton-row short" />
    </Panel>
  );
}

export function DialogLayer({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const node = document.getElementById("workspace-overlays");
    setTarget(node);
    window.dispatchEvent(new CustomEvent("juggle:dialog", { detail: 1 }));
    return () => {
      window.dispatchEvent(new CustomEvent("juggle:dialog", { detail: -1 }));
    };
  }, []);
  useEffect(() => {
    if (!target) return;
    const previous = document.activeElement as HTMLElement | null;
    const input = target.querySelector<HTMLElement>(
      "input:not([type=file]):not([hidden]),textarea,button",
    );
    input?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      requestAnimationFrame(() => {
        if (previous?.isConnected) previous.focus({ preventScroll: true });
      });
    };
  }, [target]);
  return target ? createPortal(children, target) : null;
}
