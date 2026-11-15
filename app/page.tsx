"use client";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  LayoutDashboard,
  MapPin,
  Plus,
  QrCode,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
  Upload,
  ArrowLeft,
  FileText,
  Menu,
} from "lucide-react";
import {
  Asset,
  Event,
  Plan,
  Property,
  Role,
  State,
  Task,
  calendarFile,
  seed,
  uid,
} from "@/lib/model";
import {
  MediaImage,
  MediaLink,
  MediaPDF,
  uploadFile as readFile,
  migrateLegacyFiles,
} from "@/lib/media";
import { supabase } from "@/lib/supabase";
import { INITIAL_HOME, loadWorkspace, saveWorkspace } from "@/lib/prototype";
type View =
  | "Overview"
  | "Properties"
  | "Asset register"
  | "Maintenance"
  | "Inspections"
  | "Work orders";
const nav = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Properties", icon: Building2 },
  { name: "Asset register", icon: QrCode },
  { name: "Maintenance", icon: CalendarDays },
  { name: "Inspections", icon: ClipboardCheck },
  { name: "Work orders", icon: Wrench },
] as const;
export default function Home() {
  const [data, setData] = useState<State>(seed),
    [ready, setReady] = useState(false),
    [view, setView] = useState<View>("Overview"),
    [role, setRole] = useState<Role>("Administrator"),
    [selected, setSelected] = useState<string | null>(null),
    [propertyId, setPropertyId] = useState("mercer"),
    [search, setSearch] = useState(""),
    [modal, setModal] = useState<
      "property" | "asset" | "schedule" | "qr" | "area" | null
    >(null),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [mobile, setMobile] = useState(false),
    [tab, setTab] = useState("Overview"),
    [account, setAccount] = useState(false),
    [userEmail, setUserEmail] = useState(""),
    [cloudReady, setCloudReady] = useState(false),
    [syncStatus, setSyncStatus] = useState("Local demo");
  const fileRef = useRef<HTMLInputElement>(null);
  const revision = useRef(0);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const conflict = useRef(false);
  const initialCloudLoad = useRef(true);
  useEffect(() => {
    let active = true;
    async function boot() {
      try {
        const session = supabase
          ? (await supabase.auth.getSession()).data.session
          : null;
        if (session) {
          const remote = await loadWorkspace();
          if (!active) return;
          setUserEmail(session.user.email || "Signed in");
          setData(remote?.state || INITIAL_HOME);
          revision.current = remote?.revision || 0;
          setPropertyId((remote?.state || INITIAL_HOME).properties[0].id);
          setCloudReady(true);
          setSyncStatus("Connected to Supabase");
        } else {
          const saved = localStorage.getItem("juggle-demo-v1");
          if (saved) {
            const migrated = await migrateLegacyFiles<State>(JSON.parse(saved));
            if (active) setData(migrated);
          }
        }
        const params = new URLSearchParams(location.search);
        if (params.get("asset")) {
          setSelected(params.get("asset"));
          setView("Asset register");
        }
        if (params.get("property")) {
          setPropertyId(params.get("property")!);
          setView("Properties");
        }
      } catch (error) {
        if (active)
          setToast("Could not load workspace: " + (error as Error).message);
      }
      if (active) setReady(true);
    }
    void boot();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (cloudReady) {
      if (initialCloudLoad.current) {
        initialCloudLoad.current = false;
        return;
      }
      setSyncStatus("Saving…");
      const timer = setTimeout(() => {
        saveQueue.current = saveQueue.current.then(async () => {
          if (conflict.current) return;
          try {
            revision.current = await saveWorkspace(data, revision.current);
            setSyncStatus("Saved to Supabase");
          } catch (error) {
            conflict.current = true;
            setSyncStatus("Not saved — reload required");
            setToast("Cloud save failed: " + (error as Error).message);
          }
        });
      }, 500);
      return () => clearTimeout(timer);
    }
    try {
      localStorage.setItem("juggle-demo-v1", JSON.stringify(data));
    } catch {
      setToast("Browser storage is full. This change may not persist.");
    }
  }, [data, ready, cloudReady]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 6000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const actor =
    role === "Administrator"
      ? "Jesse · Administrator"
      : role === "Inspector"
        ? "Alex · Inspector"
        : "Sam · Contractor";
  const admin = role === "Administrator";
  const property =
    data.properties.find((p) => p.id === propertyId) || data.properties[0];
  const asset = data.assets.find((a) => a.id === selected);
  const assetTasks = data.tasks.filter((t) => t.assetId === selected);
  const log = (id: string, text: string): Event => ({
    id: uid(),
    assetId: id,
    text,
    actor,
    time: new Date().toISOString(),
  });
  function go(v: View) {
    setView(v);
    setSelected(null);
    setSearch("");
    setMobile(false);
  }
  function updateTask(
    task: Task,
    status: Task["status"],
    extra: Partial<Task> = {},
  ) {
    setData((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === task.id ? { ...t, ...extra, status } : t,
      ),
      events: [
        {
          ...log(
            task.assetId,
            `${task.title}: ${status}${extra.notes ? " — " + extra.notes : ""}${extra.repair ? " — " + extra.repair : ""}`,
          ),
          evidence: extra.evidence,
          invoice: extra.invoice,
        },
        ...s.events,
      ],
    }));
    setToast("Saved to asset history");
  }
  function download(task: Task) {
    const a = data.assets.find((x) => x.id === task.assetId)!;
    const url = URL.createObjectURL(
      new Blob([calendarFile(task, a)], { type: "text/calendar" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "juggle-maintenance.ics";
    link.click();
    URL.revokeObjectURL(url);
    setToast(
      "Calendar file downloaded. Import into Google Calendar; reminder support depends on calendar settings.",
    );
  }
  async function uploadLayout(file?: File) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setToast("Please choose a PDF floor plan.");
      return;
    }
    try {
      const layout = await readFile(file);
      setData((s) => ({
        ...s,
        properties: s.properties.map((p) =>
          p.id === property.id ? { ...p, layout } : p,
        ),
      }));
      setToast(
        "Floor plan uploaded; only its file reference is stored with the property",
      );
    } catch (e) {
      setToast((e as Error).message);
    }
  }
  const filteredAssets = data.assets.filter((a) =>
    (a.name + " " + a.make + " " + a.area)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const openTasks = data.tasks.filter((t) => t.status !== "Verified");
  if (!ready)
    return (
      <div className="loading-screen">
        <strong>juggle®</strong>
        <p>Opening your workspace…</p>
      </div>
    );
  return (
    <div className="app">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <a className="brand" href="/">
          juggle<span>®</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">C</span>
          <div>
            Cocozza<span>Maintenance workspace</span>
          </div>
          <Settings2 size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.name}
              className={view === n.name ? "active" : ""}
              onClick={() => go(n.name)}
            >
              <n.icon size={19} />
              {n.name}
              {n.name === "Work orders" && (
                <small>
                  {
                    data.tasks.filter((t) =>
                      ["Assigned", "Awaiting verification"].includes(t.status),
                    ).length
                  }
                </small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help">
            <ShieldCheck size={21} />
            <strong>
              A little order.
              <br />A lot of peace of mind.
            </strong>
            <p>
              Every asset. Every action.
              <br />
              One connected history.
            </p>
          </div>
          <div className="profile">
            <span className="avatar">{actor[0]}</span>
            <div>
              <strong>{actor.split(" · ")[0]}</strong>
              <select
                aria-label="Demo role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as Role);
                  setSelected(null);
                  setView(
                    e.target.value === "Inspector"
                      ? "Inspections"
                      : e.target.value === "Contractor"
                        ? "Work orders"
                        : "Overview",
                  );
                }}
              >
                <option>Administrator</option>
                <option>Inspector</option>
                <option>Contractor</option>
              </select>
            </div>
          </div>
        </div>
      </aside>
      <div className="main">
        <header>
          <button
            className="menu icon-button"
            onClick={() => setMobile(!mobile)}
            aria-label="Toggle menu"
          >
            <Menu />
          </button>
          <span>
            Workspace <ChevronRight size={14} /> <strong>{view}</strong>
          </span>
          <div className="header-right">
            <span className="demo-dot" /> DEMO WORKSPACE{" "}
            <span className="avatar small">{actor[0]}</span>
          </div>
        </header>
        <div className="demo-banner">
          <span>
            <strong>
              {cloudReady ? "Connected prototype" : "Interactive demo"}
            </strong>{" "}
            ·{" "}
            {cloudReady
              ? userEmail + " · " + syncStatus
              : "Saved on this device only. Sign in to use your kitchen across devices."}{" "}
            Role switching is simulated.
          </span>
          <button onClick={() => setAccount(true)}>
            {cloudReady ? "Account" : "Sign in / connect"}
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  "Reset all workspace records? Uploaded objects are retained in storage.",
                )
              ) {
                setData(cloudReady ? INITIAL_HOME : seed);
                setSelected(null);
                setToast("Workspace reset");
              }
            }}
          >
            Reset demo
          </button>
        </div>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">COCOZZA · MAINTENANCE OS</div>
              <h1>
                {asset
                  ? asset.name
                  : view === "Overview"
                    ? "Maintenance, in order."
                    : view}
              </h1>
              <p>
                {asset
                  ? `${asset.area} / ${data.properties.find((p) => p.id === asset.propertyId)?.name}`
                  : view === "Overview"
                    ? "A clear picture of your properties. A plan for what’s next."
                    : "Connected records. Clear responsibilities. Nothing lost in the handoff."}
              </p>
            </div>
            {admin && (
              <button
                className="primary"
                onClick={() =>
                  setModal(
                    view === "Properties"
                      ? "property"
                      : view === "Maintenance"
                        ? "schedule"
                        : "asset",
                  )
                }
              >
                <Plus size={17} />
                {view === "Properties"
                  ? "Add property"
                  : view === "Maintenance"
                    ? "Schedule work"
                    : "Register asset"}
              </button>
            )}
          </div>
          {selected && !asset && ready && (
            <div className="notice">
              This QR record is not in the current workspace. Sign in with the
              account that registered the equipment.
            </div>
          )}
          {asset ? (
            <>
              <button className="back" onClick={() => setSelected(null)}>
                <ArrowLeft size={16} /> Back to asset register
              </button>
              <div className="asset-top">
                <div className="asset-image">
                  {asset.photo ? (
                    <MediaImage path={asset.photo} alt={asset.name} />
                  ) : (
                    <Wrench size={52} />
                  )}
                </div>
                <div>
                  <span
                    className={
                      "badge " +
                      (asset.condition === "Good" ? "green" : "amber")
                    }
                  >
                    {asset.condition}
                  </span>
                  <h2>{asset.name}</h2>
                  <p>
                    {asset.make} · {asset.model}
                  </p>
                  <p className="muted">Asset ID · {asset.id.slice(0, 12)}</p>
                  <button className="secondary" onClick={() => setModal("qr")}>
                    <QrCode size={16} /> Asset QR code
                  </button>
                </div>
              </div>
              <div className="tabs">
                {["Overview", "Maintenance plan", "Service history"].map(
                  (t) => (
                    <button
                      className={tab === t ? "chosen" : ""}
                      onClick={() => setTab(t)}
                      key={t}
                    >
                      {t}
                    </button>
                  ),
                )}
              </div>
              {tab === "Overview" ? (
                <div className="two-col">
                  <section className="panel">
                    <div className="panel-title">
                      <h2>Equipment information</h2>
                      <Settings2 size={17} />
                    </div>
                    <dl>
                      <dt>Manufacturer</dt>
                      <dd>{asset.make}</dd>
                      <dt>Model</dt>
                      <dd>{asset.model}</dd>
                      <dt>Area</dt>
                      <dd>{asset.area}</dd>
                      <dt>Condition</dt>
                      <dd>{asset.condition}</dd>
                    </dl>
                    {admin && (
                      <label className="field">
                        Update condition
                        <select
                          value={asset.condition}
                          onChange={(e) => {
                            const condition = e.target.value;
                            setData((s) => ({
                              ...s,
                              assets: s.assets.map((a) =>
                                a.id === asset.id ? { ...a, condition } : a,
                              ),
                              events: [
                                log(
                                  asset.id,
                                  "Condition updated to " + condition,
                                ),
                                ...s.events,
                              ],
                            }));
                          }}
                        >
                          <option>Good</option>
                          <option>Needs attention</option>
                          <option>Out of service</option>
                        </select>
                      </label>
                    )}
                  </section>
                  <section className="panel">
                    <div className="panel-title">
                      <h2>Next steps</h2>
                      <ClipboardCheck size={18} />
                    </div>
                    {assetTasks.length ? (
                      assetTasks.map((t) => (
                        <div className="list-item" key={t.id}>
                          <div>
                            <strong>{t.title}</strong>
                            <p>{t.date}</p>
                          </div>
                          <span className="badge">{t.status}</span>
                        </div>
                      ))
                    ) : (
                      <p className="empty">No scheduled work yet.</p>
                    )}
                    {admin && (
                      <button
                        className="secondary"
                        onClick={() => setModal("schedule")}
                      >
                        <Plus size={16} /> Schedule inspection
                      </button>
                    )}
                  </section>
                </div>
              ) : tab === "Maintenance plan" ? (
                <section className="panel">
                  <div className="panel-title">
                    <div>
                      <h2>Maintenance intelligence</h2>
                      <p>
                        Administrator approval is required before scheduling.
                      </p>
                    </div>
                    <Sparkles size={20} />
                  </div>
                  <div className="notice">
                    <strong>Live research needs configuration</strong>
                    <p>
                      Manufacturer web research and image identification are not
                      connected. Demo suggestions are examples, not verified
                      maintenance instructions.
                    </p>
                  </div>
                  {data.plans
                    .filter((p) => p.assetId === asset.id)
                    .map((p) => (
                      <div className="plan" key={p.id}>
                        <span className="badge amber">
                          {p.simulated
                            ? "Simulated · unverified"
                            : "Manually entered"}
                        </span>
                        <h3>{p.title}</h3>
                        <p>{p.frequency}</p>
                        <p className="muted">
                          {p.sources.length
                            ? "Sources available"
                            : "Confidence: unverified. No manufacturer source attached. Confirm make, model and manual."}
                        </p>
                        {admin && !p.approved ? (
                          <button
                            className="secondary"
                            onClick={() => {
                              setData((s) => ({
                                ...s,
                                plans: s.plans.map((x) =>
                                  x.id === p.id ? { ...x, approved: true } : x,
                                ),
                                events: [
                                  log(
                                    asset.id,
                                    "Administrator approved demo/manual maintenance recommendation: " +
                                      p.title,
                                  ),
                                  ...s.events,
                                ],
                              }));
                              setModal("schedule");
                            }}
                          >
                            <Check size={16} /> Approve and schedule
                          </button>
                        ) : (
                          p.approved && (
                            <span className="badge green">
                              Approved by administrator
                            </span>
                          )
                        )}
                      </div>
                    ))}
                  {admin && (
                    <button
                      className="secondary"
                      onClick={() => {
                        setData((s) => ({
                          ...s,
                          plans: [
                            ...s.plans,
                            {
                              id: uid(),
                              assetId: asset.id,
                              title:
                                "Inspect equipment condition and document findings",
                              frequency:
                                "Frequency must be set manually after manufacturer review",
                              sources: [],
                              simulated: true,
                              approved: false,
                            },
                          ],
                        }));
                        setToast(
                          "Added a clearly labeled demo suggestion; live research is unavailable",
                        );
                      }}
                    >
                      <Sparkles size={16} /> Add demo recommendation
                    </button>
                  )}
                </section>
              ) : (
                <section className="panel">
                  <h2>Complete asset history</h2>
                  {data.events
                    .filter((e) => e.assetId === asset.id)
                    .map((e) => (
                      <div className="timeline" key={e.id}>
                        <span />
                        <div>
                          <strong>{e.text}</strong>
                          <p>
                            {e.actor} · {new Date(e.time).toLocaleString()}
                          </p>
                          {e.evidence && (
                            <MediaLink path={e.evidence}>
                              View attached evidence
                            </MediaLink>
                          )}
                          {e.invoice && (
                            <p>
                              <MediaLink path={e.invoice}>
                                View invoice
                              </MediaLink>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </section>
              )}
            </>
          ) : view === "Overview" ? (
            <>
              <div className="stats">
                {[
                  {
                    label: "Properties managed",
                    value: data.properties.length,
                    icon: Building2,
                    detail: "Connected spaces",
                    v: "Properties",
                  },
                  {
                    label: "Registered assets",
                    value: data.assets.length,
                    icon: QrCode,
                    detail: "Every asset, accounted for",
                    v: "Asset register",
                  },
                  {
                    label: "Upcoming maintenance",
                    value: openTasks.length,
                    icon: CalendarDays,
                    detail: "Scheduled and in progress",
                    v: "Maintenance",
                  },
                  {
                    label: "Awaiting approval",
                    value: data.tasks.filter(
                      (t) => t.status === "Awaiting verification",
                    ).length,
                    icon: ClipboardCheck,
                    detail: "Ready for your review",
                    v: "Work orders",
                  },
                ].map((s) => (
                  <button
                    className="stat"
                    key={s.label}
                    onClick={() => go(s.v as View)}
                  >
                    <div>
                      {s.label}
                      <s.icon size={18} />
                    </div>
                    <strong>{String(s.value).padStart(2, "0")}</strong>
                    <p>
                      {s.detail}
                      <ArrowUpRight size={14} />
                    </p>
                  </button>
                ))}
              </div>
              <div className="section-title">
                <div>
                  <h2>
                    Your properties <span>{data.properties.length}</span>
                  </h2>
                  <p>The places you keep running.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => go("Properties")}
                >
                  View all properties <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="property-grid">
                {data.properties.map((p, i) => (
                  <button
                    className="property-card"
                    key={p.id}
                    onClick={() => {
                      setPropertyId(p.id);
                      go("Properties");
                    }}
                  >
                    <div className={"property-visual visual-" + i}>
                      <div className="architectural-grid" />
                      <span className="visual-label">
                        {p.name.split(" ").slice(0, 2).join(" ")}
                        <small>NEW YORK · RESTAURANT</small>
                      </span>
                      <span className="photo-tag">
                        <span /> Operational
                      </span>
                    </div>
                    <div className="property-details">
                      <div>
                        <h3>{p.name}</h3>
                        <ArrowUpRight size={19} />
                      </div>
                      <p>
                        <MapPin size={13} />
                        {p.address}
                      </p>
                      <footer>
                        <span>
                          {
                            data.assets.filter((a) => a.propertyId === p.id)
                              .length
                          }{" "}
                          assets <b>·</b> {p.areas.length} areas
                        </span>
                        <span className="badge green">Active</span>
                      </footer>
                    </div>
                  </button>
                ))}
                {admin && (
                  <button
                    className="add-property"
                    onClick={() => setModal("property")}
                  >
                    <span>
                      <Plus size={24} />
                    </span>
                    <strong>A new space. A fresh start.</strong>
                    <p>Add a property to your workspace</p>
                  </button>
                )}
              </div>
              <div className="two-col lower">
                <section className="panel">
                  <div className="panel-title">
                    <h2>On the horizon</h2>
                    <button
                      className="text-button"
                      onClick={() => go("Maintenance")}
                    >
                      View schedule <ArrowUpRight size={14} />
                    </button>
                  </div>
                  {openTasks.slice(0, 4).map((t) => (
                    <button
                      className="schedule-item"
                      key={t.id}
                      onClick={() => {
                        go("Maintenance");
                        setSearch(t.title);
                      }}
                    >
                      <div className="date-box">
                        <small>
                          {new Date(t.date + "T12:00").toLocaleString("en-US", {
                            month: "short",
                          })}
                        </small>
                        <strong>{t.date.slice(8)}</strong>
                      </div>
                      <div>
                        <strong>{t.title}</strong>
                        <p>
                          {data.assets.find((a) => a.id === t.assetId)?.name}
                        </p>
                      </div>
                      <span className="badge">{t.status}</span>
                    </button>
                  ))}
                  {!openTasks.length && (
                    <p className="empty">
                      All caught up. Schedule your next inspection.
                    </p>
                  )}
                </section>
                <section className="panel">
                  <div className="panel-title">
                    <h2>Recent activity</h2>
                    <Clock3 size={17} />
                  </div>
                  {data.events.slice(0, 4).map((e) => (
                    <div className="activity" key={e.id}>
                      <span className="activity-icon">
                        <Check size={14} />
                      </span>
                      <div>
                        <strong>{e.text}</strong>
                        <p>
                          {e.actor} · {new Date(e.time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
              <div className="footer-note">
                <ShieldCheck size={14} /> A connected history, from first
                installation to the next repair.
              </div>
            </>
          ) : view === "Properties" ? (
            <>
              <div className="toolbar">
                <select
                  aria-label="Select property"
                  value={property.id}
                  onChange={(e) => setPropertyId(e.target.value)}
                >
                  {data.properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <span>{property.client}</span>
                {admin && (
                  <button
                    className="secondary"
                    onClick={() => setModal("area")}
                  >
                    <Plus size={15} /> Add area
                  </button>
                )}
                <button className="secondary" onClick={() => setModal("qr")}>
                  <QrCode size={16} /> Property QR
                </button>
              </div>
              <div className="two-col">
                <section className="panel">
                  <div className="panel-title">
                    <h2>Floor plan</h2>
                    {admin && (
                      <button
                        className="secondary"
                        onClick={() => fileRef.current?.click()}
                      >
                        <Upload size={15} /> Upload PDF
                      </button>
                    )}
                    <input
                      hidden
                      ref={fileRef}
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => uploadLayout(e.target.files?.[0])}
                    />
                  </div>
                  {property.layout ? (
                    <>
                      <MediaPDF path={property.layout} />
                      <p className="muted">
                        Equipment tags below reference normalized positions on
                        the uploaded plan.
                      </p>
                      <div className="pin-board">
                        {data.assets
                          .filter((a) => a.propertyId === property.id)
                          .map((a, i) => (
                            <button
                              key={a.id}
                              style={{
                                left: `${a.x || 20 + i * 20}%`,
                                top: `${a.y || 50}%`,
                              }}
                              onClick={() => {
                                setSelected(a.id);
                                setTab("Overview");
                                setView("Asset register");
                              }}
                              title={a.name}
                            >
                              {i + 1}
                            </button>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="upload-empty">
                      <FileText size={38} />
                      <h3>Your restaurant, mapped.</h3>
                      <p>
                        Upload a floor-plan PDF to keep the layout
                        <br />
                        connected to your equipment records.
                      </p>
                      {admin && (
                        <button
                          className="secondary"
                          onClick={() => fileRef.current?.click()}
                        >
                          Choose PDF
                        </button>
                      )}
                    </div>
                  )}
                </section>
                <section className="panel">
                  <h2>Areas & equipment</h2>
                  {property.areas.map((area) => (
                    <div key={area} className="area">
                      <h3>{area}</h3>
                      {data.assets
                        .filter(
                          (a) =>
                            a.propertyId === property.id && a.area === area,
                        )
                        .map((a) => (
                          <button
                            className="list-item"
                            key={a.id}
                            onClick={() => {
                              setSelected(a.id);
                              setTab("Overview");
                              setView("Asset register");
                            }}
                          >
                            <span>{a.name}</span>
                            <ChevronRight size={16} />
                          </button>
                        ))}
                      {!data.assets.some(
                        (a) => a.propertyId === property.id && a.area === area,
                      ) && <p className="muted">No equipment registered</p>}
                    </div>
                  ))}
                </section>
              </div>
            </>
          ) : view === "Asset register" ? (
            <>
              <div className="toolbar">
                <label className="search">
                  <Search size={17} />
                  <input
                    placeholder="Search equipment, manufacturer, area…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <span>{filteredAssets.length} assets</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Property / area</th>
                      <th>Make & model</th>
                      <th>Condition</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => {
                          setSelected(a.id);
                          setTab("Overview");
                        }}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSelected(a.id);
                            setTab("Overview");
                          }
                        }}
                      >
                        <td>
                          <div className="equipment-cell">
                            <span className="equipment-icon">
                              {a.photo ? (
                                <MediaImage path={a.photo} alt="" />
                              ) : (
                                <Wrench size={20} />
                              )}
                            </span>
                            <strong>{a.name}</strong>
                          </div>
                        </td>
                        <td>
                          {
                            data.properties.find((p) => p.id === a.propertyId)
                              ?.name
                          }
                          <small>{a.area}</small>
                        </td>
                        <td>
                          {a.make}
                          <small>{a.model}</small>
                        </td>
                        <td>
                          <span
                            className={
                              "badge " +
                              (a.condition === "Good" ? "green" : "amber")
                            }
                          >
                            {a.condition}
                          </span>
                        </td>
                        <td>
                          <ChevronRight size={17} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredAssets.length && (
                  <p className="empty">No matching equipment.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="toolbar">
                <label className="search">
                  <Search size={17} />
                  <input
                    placeholder="Search scheduled work…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <span>
                  {view === "Maintenance"
                    ? "Internal schedule · calendar handoff available"
                    : view === "Inspections"
                      ? "Assigned to Alex · Demo inspector"
                      : "Assignments for Sam · Demo contractor"}
                </span>
              </div>
              {view === "Maintenance" && (
                <div className="notice">
                  <CalendarDays size={20} />
                  <div>
                    <strong>Google Calendar handoff</strong>
                    <p>
                      Download an event and import it into Google Calendar.
                      Includes requested 7-day, 2-day and day-of alarms;
                      calendar support varies. No live synchronization.
                    </p>
                  </div>
                </div>
              )}
              <div className="task-grid">
                {data.tasks
                  .filter((t) =>
                    t.title.toLowerCase().includes(search.toLowerCase()),
                  )
                  .filter((t) =>
                    view === "Work orders"
                      ? [
                          "Issue reported",
                          "Assigned",
                          "Awaiting verification",
                          "Verified",
                        ].includes(t.status)
                      : true,
                  )
                  .map((t) => (
                    <section className="panel task" key={t.id}>
                      <div className="panel-title">
                        <span
                          className={
                            "badge " +
                            (t.status === "Verified"
                              ? "green"
                              : t.status === "Issue reported"
                                ? "amber"
                                : "")
                          }
                        >
                          {t.status}
                        </span>
                        <span className="muted">{t.date}</span>
                      </div>
                      <h3>{t.title}</h3>
                      <button
                        className="text-button"
                        onClick={() => {
                          setSelected(t.assetId);
                          setTab("Overview");
                        }}
                      >
                        {data.assets.find((a) => a.id === t.assetId)?.name}
                        <ArrowUpRight size={14} />
                      </button>
                      {t.notes && (
                        <p className="notice">Inspection finding: {t.notes}</p>
                      )}
                      {t.repair && <p>Repair: {t.repair}</p>}
                      {t.evidence && (
                        <MediaLink path={t.evidence}>
                          View inspection / repair evidence
                        </MediaLink>
                      )}
                      {t.invoice && (
                        <p>
                          <MediaLink path={t.invoice}>View invoice</MediaLink>
                        </p>
                      )}
                      <div className="task-actions">
                        {view === "Maintenance" && (
                          <button
                            className="secondary"
                            onClick={() => download(t)}
                          >
                            <CalendarDays size={15} /> Export calendar event
                          </button>
                        )}
                        {(role === "Inspector" || admin) &&
                          t.status === "Scheduled" && (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                const f = new FormData(e.currentTarget);
                                const notes = String(f.get("notes"));
                                const file = f.get("photo") as File;
                                try {
                                  const evidence = file?.size
                                    ? await readFile(file)
                                    : undefined;
                                  const condition = String(f.get("condition"));
                                  setData((s) => ({
                                    ...s,
                                    assets: s.assets.map((a) =>
                                      a.id === t.assetId
                                        ? { ...a, condition }
                                        : a,
                                    ),
                                    events: [
                                      log(
                                        t.assetId,
                                        "Inspector checked in and completed checklist",
                                      ),
                                      ...s.events,
                                    ],
                                  }));
                                  updateTask(
                                    t,
                                    f.get("issue")
                                      ? "Issue reported"
                                      : "Awaiting verification",
                                    { notes, evidence },
                                  );
                                } catch (error) {
                                  setToast((error as Error).message);
                                }
                              }}
                            >
                              <label className="check">
                                <input type="checkbox" required /> Equipment
                                condition checked
                              </label>
                              <label className="check">
                                <input type="checkbox" required /> Operating
                                observations recorded
                              </label>
                              <label className="field">
                                Condition
                                <select name="condition">
                                  <option>Good</option>
                                  <option>Needs attention</option>
                                  <option>Out of service</option>
                                </select>
                              </label>
                              <label className="field">
                                Inspection findings
                                <textarea
                                  name="notes"
                                  required
                                  placeholder="Record what you observed…"
                                />
                              </label>
                              <label className="field">
                                Inspection photo
                                <input
                                  type="file"
                                  name="photo"
                                  accept="image/*"
                                  capture="environment"
                                />
                              </label>
                              <label className="check">
                                <input type="checkbox" name="issue" /> Report an
                                issue for Jesse to review
                              </label>
                              <button className="primary">
                                Check in & submit inspection
                              </button>
                            </form>
                          )}
                        {admin && t.status === "Issue reported" && (
                          <button
                            className="primary"
                            onClick={() => updateTask(t, "Assigned")}
                          >
                            Assign repair to Sam
                          </button>
                        )}
                        {(role === "Contractor" || admin) &&
                          t.status === "Assigned" && (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                const f = new FormData(e.currentTarget);
                                try {
                                  const photo = f.get("photo") as File,
                                    invoice = f.get("invoice") as File;
                                  updateTask(t, "Awaiting verification", {
                                    repair: String(f.get("repair")),
                                    evidence: photo?.size
                                      ? await readFile(photo)
                                      : t.evidence,
                                    invoice: invoice?.size
                                      ? await readFile(invoice)
                                      : undefined,
                                  });
                                } catch (error) {
                                  setToast((error as Error).message);
                                }
                              }}
                            >
                              <label className="field">
                                Work performed
                                <textarea
                                  name="repair"
                                  required
                                  placeholder="Describe the repair and outcome…"
                                />
                              </label>
                              <label className="field">
                                Repair photograph
                                <input
                                  name="photo"
                                  type="file"
                                  accept="image/*"
                                  required
                                />
                              </label>
                              <label className="field">
                                Invoice (optional)
                                <input
                                  name="invoice"
                                  type="file"
                                  accept="application/pdf,image/*"
                                />
                              </label>
                              <button className="primary">
                                Submit for verification
                              </button>
                            </form>
                          )}
                        {admin && t.status === "Awaiting verification" && (
                          <>
                            <button
                              className="primary"
                              onClick={() => updateTask(t, "Verified")}
                            >
                              Verify completed work
                            </button>
                            <button
                              className="secondary"
                              onClick={() => updateTask(t, "Assigned")}
                            >
                              Return for correction
                            </button>
                          </>
                        )}
                      </div>
                    </section>
                  ))}
              </div>
              {!data.tasks.some(
                (t) =>
                  view !== "Work orders" ||
                  [
                    "Issue reported",
                    "Assigned",
                    "Awaiting verification",
                    "Verified",
                  ].includes(t.status),
              ) && (
                <section className="panel empty">
                  No repair assignments yet. Report an issue from an inspection,
                  then assign it as Jesse.
                </section>
              )}
            </>
          )}
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button aria-label="Dismiss" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {account && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Account"
          >
            <div className="panel-title">
              <h2>
                {cloudReady
                  ? "Your connected kitchen"
                  : "Connect your home kitchen"}
              </h2>
              <button
                className="icon-button"
                onClick={() => setAccount(false)}
                aria-label="Close account"
              >
                <X />
              </button>
            </div>
            {cloudReady ? (
              <>
                <p>{userEmail}</p>
                <p className="muted">
                  Records are private to your account. Sign in with this account
                  on your phone to open printed QR labels. Role switching
                  remains a demonstration.
                </p>
                <button
                  className="secondary"
                  onClick={async () => {
                    if (
                      syncStatus === "Saving…" ||
                      syncStatus.startsWith("Not saved")
                    ) {
                      setToast(
                        "Wait for a successful save before signing out.",
                      );
                      return;
                    }
                    await supabase?.auth.signOut();
                    location.reload();
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <p>
                  Use the same account on your computer and phone. Photos and
                  PDFs go to private object storage; SQL stores references only.
                </p>
                {!supabase ? (
                  <p className="notice">
                    Supabase environment variables are not configured for this
                    deployment.
                  </p>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      const f = new FormData(e.currentTarget);
                      const email = String(f.get("email")),
                        password = String(f.get("password"));
                      const intent = (
                        e.nativeEvent as SubmitEvent
                      ).submitter?.getAttribute("value");
                      try {
                        if (!supabase)
                          throw Error("Supabase is not configured.");
                        if (intent === "signup") {
                          const { data: result, error } =
                            await supabase.auth.signUp({
                              email,
                              password,
                              options: { emailRedirectTo: location.origin },
                            });
                          if (error) throw error;
                          if (!result.session) {
                            setToast(
                              "Check your email to confirm your account, then return here and sign in.",
                            );
                            return;
                          }
                        } else {
                          const { error } =
                            await supabase.auth.signInWithPassword({
                              email,
                              password,
                            });
                          if (error) throw error;
                        }
                        location.reload();
                      } catch (error) {
                        setToast((error as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <label className="field">
                      Email
                      <input
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                      />
                    </label>
                    <label className="field">
                      Password
                      <input
                        type="password"
                        name="password"
                        minLength={8}
                        required
                        autoComplete="current-password"
                      />
                    </label>
                    <div className="form-row">
                      <button
                        className="primary"
                        value="signin"
                        disabled={busy}
                      >
                        Sign in
                      </button>
                      <button
                        className="secondary"
                        value="signup"
                        disabled={busy}
                      >
                        Create account
                      </button>
                    </div>
                    <p className="muted">
                      A new account starts with an empty home kitchen.
                      Browser-local demo records are kept separate.
                    </p>
                  </form>
                )}
              </>
            )}
          </section>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-title">
              <h2>
                {modal === "property"
                  ? "Add a property"
                  : modal === "asset"
                    ? "Register equipment"
                    : modal === "schedule"
                      ? "Schedule an inspection"
                      : modal === "area"
                        ? "Create an area"
                        : "A permanent connection"}
              </h2>
              <button
                className="icon-button"
                aria-label="Close dialog"
                onClick={() => setModal(null)}
              >
                <X />
              </button>
            </div>
            {modal === "qr" ? (
              <div className="qr">
                <QRCodeSVG
                  size={220}
                  value={
                    typeof window !== "undefined"
                      ? `${location.origin}/?${asset ? "asset=" + asset.id : "property=" + property.id}`
                      : ""
                  }
                />
                <h3>{asset?.name || property.name}</h3>
                <p>
                  {cloudReady
                    ? "Open this QR on your phone, then sign in with the same account."
                    : "Demo QR works on this device only. Sign in first for cross-device access."}
                  <br />
                  The QR identifies this record and grants no database access.
                </p>
                <button className="secondary" onClick={() => window.print()}>
                  Print QR label
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  const f = new FormData(e.currentTarget);
                  try {
                    if (modal === "property") {
                      const p: Property = {
                        id: uid(),
                        name: String(f.get("name")),
                        address: String(f.get("address")),
                        client: String(f.get("client")),
                        areas: ["Kitchen"],
                      };
                      setData((s) => ({
                        ...s,
                        properties: [...s.properties, p],
                      }));
                      setPropertyId(p.id);
                      go("Properties");
                    }
                    if (modal === "area") {
                      const name = String(f.get("name")).trim();
                      if (property.areas.includes(name))
                        throw Error("This area already exists.");
                      setData((s) => ({
                        ...s,
                        properties: s.properties.map((p) =>
                          p.id === property.id
                            ? { ...p, areas: [...p.areas, name] }
                            : p,
                        ),
                      }));
                    }
                    if (modal === "asset") {
                      const photo = f.get("photo") as File;
                      const a: Asset = {
                        id: uid(),
                        name: String(f.get("name")),
                        propertyId: String(f.get("property")),
                        area: String(f.get("area")),
                        make: String(f.get("make")) || "Unconfirmed",
                        model: String(f.get("model")) || "Nameplate required",
                        condition: "Good",
                        photo: photo?.size ? await readFile(photo) : undefined,
                        x: Number(f.get("x")),
                        y: Number(f.get("y")),
                      };
                      const p = data.properties.find(
                        (p) => p.id === a.propertyId,
                      );
                      if (!p?.areas.includes(a.area))
                        throw Error(
                          "Choose an area belonging to this property.",
                        );
                      setData((s) => ({
                        ...s,
                        assets: [...s.assets, a],
                        events: [
                          log(a.id, "Asset registered in " + a.area),
                          ...s.events,
                        ],
                      }));
                      setSelected(a.id);
                      setTab("Overview");
                      setView("Asset register");
                    }
                    if (modal === "schedule") {
                      const t: Task = {
                        id: uid(),
                        assetId: String(f.get("asset")),
                        title: String(f.get("title")),
                        date: String(f.get("date")),
                        status: "Scheduled",
                        notes: "",
                      };
                      setData((s) => ({
                        ...s,
                        tasks: [...s.tasks, t],
                        events: [
                          log(
                            t.assetId,
                            "Inspection scheduled for " +
                              t.date +
                              " and assigned to Alex",
                          ),
                          ...s.events,
                        ],
                      }));
                      setSelected(null);
                      setView("Maintenance");
                    }
                    setModal(null);
                    setToast("Saved successfully");
                  } catch (error) {
                    setToast((error as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {(modal === "property" ||
                  modal === "asset" ||
                  modal === "area") && (
                  <label className="field">
                    {modal === "asset"
                      ? "Equipment name"
                      : modal === "property"
                        ? "Restaurant name"
                        : "Area name"}
                    <input
                      autoFocus
                      name="name"
                      required
                      placeholder={
                        modal === "asset"
                          ? "e.g. Walk-in refrigerator"
                          : modal === "property"
                            ? "e.g. The Mercer Kitchen"
                            : "e.g. Kitchen"
                      }
                    />
                  </label>
                )}
                {modal === "property" && (
                  <>
                    <label className="field">
                      Street address
                      <input name="address" required />
                    </label>
                    <label className="field">
                      Client / owner
                      <input name="client" required />
                    </label>
                    <p className="muted">
                      A Kitchen area will be created automatically.
                    </p>
                  </>
                )}
                {modal === "asset" && (
                  <>
                    <label className="field">
                      Property
                      <select
                        name="property"
                        value={propertyId}
                        onChange={(e) => setPropertyId(e.target.value)}
                      >
                        {data.properties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Area
                      <select name="area">
                        {property.areas.map((a) => (
                          <option key={a}>{a}</option>
                        ))}
                      </select>
                    </label>
                    <div className="form-row">
                      <label className="field">
                        Manufacturer
                        <input name="make" placeholder="From equipment label" />
                      </label>
                      <label className="field">
                        Model
                        <input name="model" placeholder="From nameplate" />
                      </label>
                    </div>
                    <label className="field">
                      Equipment / nameplate photograph
                      <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        capture="environment"
                      />
                    </label>
                    <div className="form-row">
                      <label className="field">
                        Plan X position (%)
                        <input
                          type="number"
                          name="x"
                          defaultValue="50"
                          min="0"
                          max="100"
                        />
                      </label>
                      <label className="field">
                        Plan Y position (%)
                        <input
                          type="number"
                          name="y"
                          defaultValue="50"
                          min="0"
                          max="100"
                        />
                      </label>
                    </div>
                  </>
                )}
                {modal === "schedule" && (
                  <>
                    <label className="field">
                      Equipment
                      <select
                        name="asset"
                        defaultValue={selected || data.assets[0]?.id}
                        required
                      >
                        {data.assets.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Inspection title
                      <input
                        name="title"
                        required
                        defaultValue="Equipment condition inspection"
                      />
                    </label>
                    <label className="field">
                      Due date
                      <input
                        type="date"
                        name="date"
                        required
                        defaultValue={new Date().toISOString().slice(0, 10)}
                      />
                    </label>
                    <label className="field">
                      Assigned inspector
                      <input readOnly value="Alex · Demo inspector" />
                    </label>
                    <p className="muted">
                      Creates one occurrence. Automatic recurring scheduling is
                      not enabled in this first pass.
                    </p>
                  </>
                )}
                <button className="primary full" disabled={busy}>
                  {busy
                    ? "Saving…"
                    : modal === "schedule"
                      ? "Create inspection"
                      : "Save " + (modal === "asset" ? "equipment" : modal)}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
