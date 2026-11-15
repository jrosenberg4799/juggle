"use client";

import { useState } from "react";
import { Monitor, Tablet, Smartphone, RotateCw, ArrowLeft, ChevronDown } from "lucide-react";
import { version } from "@/package.json";
import "./preview.css";

const devices = [
  { id: "desktop", label: "Desktop", width: 1440, height: 900, Icon: Monitor },
  { id: "ipad", label: "iPad", width: 820, height: 1180, Icon: Tablet },
  { id: "phone", label: "Phone", width: 390, height: 844, Icon: Smartphone },
] as const;

export default function DevicePreview() {
  const [deviceId, setDeviceId] = useState<string>("desktop");
  const [landscape, setLandscape] = useState(false);
  const device = devices.find((item) => item.id === deviceId)!;
  const width = landscape ? device.height : device.width;
  const height = landscape ? device.width : device.height;

  return (
    <div className="device-preview">
      <header className="preview-toolbar">
        <a className="preview-back" href="/"><ArrowLeft size={18} /> App</a>
        <details className="preview-picker" open>
          <summary><Monitor size={18} /> Devices <span>· {device.label}</span><ChevronDown size={16} /></summary>
        <div className="preview-picker-options">
        <div className="preview-devices" role="group" aria-label="Preview device">
          {devices.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-pressed={deviceId === id}
              onClick={() => { setDeviceId(id); setLandscape(false); }}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </div>
        <button className="preview-rotate" type="button" onClick={() => setLandscape(!landscape)}
          aria-label="Rotate preview" title="Rotate preview"><RotateCw size={18} /></button>
        </div>
        </details>
        <small>v{version}</small>
      </header>
      <p className="preview-caption" aria-live="polite">
        {device.label} · {width} × {height} · Live app, real saves. Scroll sideways if needed.
      </p>
      <main className="preview-canvas">
        <iframe className="preview-frame" title="Juggle live device preview" src="/"
          width={width} height={height} allow="camera; clipboard-write" />
      </main>
    </div>
  );
}
