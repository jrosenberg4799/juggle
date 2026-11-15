"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Laptop, PanelTop, RotateCw, Smartphone, Tablet } from "lucide-react";
import { version } from "@/package.json";
import { deviceDimensions, fitDevice, type DeviceView } from "@/lib/device-preview";

const views = [
  { id: "desktop", label: "Desktop", Icon: Laptop },
  { id: "ipad", label: "iPad", Icon: Tablet },
  { id: "phone", label: "Phone", Icon: Smartphone },
] as const;

export function WorkspaceShell() {
  const [view, setView] = useState<DeviceView>("desktop");
  const [rotated, setRotated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const forwarded = useRef(false);
  const selected = views.find((item) => item.id === view)!;
  const SelectedIcon = selected.Icon;
  const dimensions = deviceDimensions(view, rotated, bounds);
  const scale = fitDevice(dimensions, bounds);

  useEffect(() => {
    // One canvas owns auth, data and in-progress forms. Never reload it to resize.
    if (!forwarded.current) {
      forwarded.current = true;
      setSource("/workspace" + window.location.search + window.location.hash);
      // The embedded app consumes auth callbacks; don't leave tokens in the outer URL.
      const clean = new URL(window.location.href);
      const authHash = /(?:access_token|refresh_token|error_description)=/.test(clean.hash);
      const authCode = clean.searchParams.has("code");
      if (authHash || authCode) {
        if (authHash) clean.hash = "";
        clean.searchParams.delete("code");
        window.history.replaceState(window.history.state, "", clean.pathname + clean.search + clean.hash);
      }
    }
    const node = stage.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setBounds({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!controls.current?.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [expanded]);

  function selectView(next: DeviceView) {
    setView(next);
    setRotated(false);
    if (window.matchMedia("(max-width: 720px)").matches) setExpanded(false);
  }

  return (
    <div className="workspace-shell" data-device={view}>
      <header className="workspace-chrome">
        <div className="chrome-context">
          <span className="chrome-mark"><PanelTop size={16} strokeWidth={1.8} /></span>
          <span>Workspace</span>
          <span className="chrome-version">v{version}</span>
        </div>
        <div className="chrome-views" ref={controls}>
          <button ref={toggle} className="chrome-view-toggle" type="button"
            aria-expanded={expanded} aria-controls="workspace-view-options"
            onClick={() => setExpanded(!expanded)}>
            <SelectedIcon size={16} /><span>Views</span>
            <span className="chrome-current">{selected.label}</span>
            <ChevronDown size={14} className={expanded ? "is-open" : ""} />
          </button>
          <div id="workspace-view-options" className="chrome-view-options" hidden={!expanded}>
            <span className="chrome-options-label">Screen size</span>
            <div className="chrome-segments" role="group" aria-label="Screen size">
              {views.map(({ id, label, Icon }) => (
                <button key={id} type="button" aria-pressed={view === id}
                  onClick={() => selectView(id)}>
                  <Icon size={17} /><span>{label}</span>
                </button>
              ))}
            </div>
            <button className="chrome-rotate" type="button" disabled={view === "desktop"}
              onClick={() => setRotated(!rotated)} aria-label="Rotate device preview"
              title="Rotate device preview"><RotateCw size={16} /></button>
          </div>
        </div>
      </header>
      <main className="workspace-canvas" aria-label="Maintenance workspace">
        <div className="workspace-device-stage" ref={stage}>
          <div className="workspace-device" style={{ width: dimensions.width * scale,
            height: dimensions.height * scale }}>
            {source ? <iframe className="workspace-live-frame" title="Juggle maintenance application"
              src={source} allow="camera; clipboard-write"
              style={{ width: dimensions.width, height: dimensions.height, transform: `scale(${scale})` }} />
              : <div className="workspace-shell-loading" role="status">Opening workspace…</div>}
          </div>
        </div>
        {view !== "desktop" ? <div className="workspace-device-caption" aria-live="polite">
          <SelectedIcon size={12} /> {selected.label}
          <span>·</span> {dimensions.width} × {dimensions.height}
          <span>·</span> {Math.round(scale * 100)}%
        </div> : null}
      </main>
    </div>
  );
}
