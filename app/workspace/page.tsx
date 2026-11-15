"use client";
import { useEffect, useRef, useState } from "react";
import {
  WorkspaceViewport,
  WorkspaceHeader,
  SaveStatus,
  PageTitle,
  Panel,
  ActionBar,
  PageLoading,
} from "@/components/workspace-ui";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowUpRight,
  ArrowRight,
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
import {
  INITIAL_HOME,
  loadWorkspace,
  saveWorkspace,
  openRealWorkspace,
} from "@/lib/prototype";
import { CloudReceipt, ReadbackError } from "@/lib/cloud-receipt";
import { Operations } from "@/components/operations";
import { taskOwner } from "@/lib/operations";
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
    [role, setRole] = useState<Role>("Director"),
    [selected, setSelected] = useState<string | null>(null),
    [propertyId, setPropertyId] = useState("mercer"),
    [search, setSearch] = useState(""),
    [modal, setModal] = useState<
      "property" | "asset" | "schedule" | "qr" | "area" | null
    >(null),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [returnToRoadmap, setReturnToRoadmap] = useState(false),
    [mobile, setMobile] = useState(false),
    [tab, setTab] = useState("Overview"),
    [account, setAccount] = useState(false),
    [userEmail, setUserEmail] = useState(""),
    [cloudReady, setCloudReady] = useState(false),
    [syncStatus, setSyncStatus] = useState("Local demo");
  const [cloudReceipt, setCloudReceipt] = useState<CloudReceipt | null>(null);
  const [cloudLoadError, setCloudLoadError] = useState("");
  const saveGeneration = useRef(0);
  const [childDialogs, setChildDialogs] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const revision = useRef(0);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const conflict = useRef(false);
  const initialCloudLoad = useRef(true);
  useEffect(() => {
    let active = true;
    async function boot() {
      let openingCloud = false;
      try {
        const auth = supabase ? await supabase.auth.getSession() : null;
        if (auth?.error) {
          openingCloud = true;
          throw auth.error;
        }
        const session = auth?.data.session || null;
        openingCloud = Boolean(session);
        if (session) {
          const remote = await openRealWorkspace();
          if (!active) return;
          setUserEmail(session.user.email || "Signed in");
          setData(remote?.state || INITIAL_HOME);
          revision.current = remote?.revision || 0;
          setPropertyId((remote?.state || INITIAL_HOME).properties[0].id);
          setCloudReady(true);
          setCloudReceipt(remote.receipt);
          setSyncStatus("Saved to Supabase");
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
        if (active) {
          if (openingCloud) setCloudLoadError((error as Error).message);
          setToast("Could not load workspace: " + (error as Error).message);
        }
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
      if (conflict.current) {
        setSyncStatus("Not saved — reload required");
        return;
      }
      if (initialCloudLoad.current) {
        initialCloudLoad.current = false;
        return;
      }
      const generation = ++saveGeneration.current;
      setSyncStatus("Saving…");
      const timer = setTimeout(() => {
        saveQueue.current = saveQueue.current.then(async () => {
          if (conflict.current) return;
          try {
            const receipt = await saveWorkspace(data, revision.current);
            revision.current = receipt.revision;
            setCloudReceipt(receipt);
            if (generation === saveGeneration.current)
              setSyncStatus("Saved to Supabase");
          } catch (error) {
            if (error instanceof ReadbackError)
              revision.current = error.committedRevision;
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
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
        setAccount(false);
        setMobile(false);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view, selected, role]);
  const overlayOpen = Boolean(modal || account || mobile || childDialogs > 0);
  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlayOpen]);
  useEffect(() => {
    const dialog = (event: globalThis.Event) =>
      setChildDialogs((n) =>
        Math.max(0, n + (event as CustomEvent<number>).detail),
      );
    window.addEventListener("juggle:dialog", dialog);
    return () => window.removeEventListener("juggle:dialog", dialog);
  }, []);
  const actor =
    role === "Director"
      ? "Jesse · Director"
      : role === "Manager"
        ? (data.properties.find((p) => p.id === propertyId)?.inspectionSchedule
            ?.managerName || "Alex") + " · Manager"
        : "Sam · Subcontractor";
  const admin = role === "Director";
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
  function showSchedule() {
    const targetProperty = asset?.propertyId || property.id;
    if (asset) setPropertyId(asset.propertyId);
    if (
      !data.assets.some(
        (a) => a.propertyId === targetProperty && !a.pendingApproval,
      )
    ) {
      setToast("Register and approve equipment before scheduling work.");
      setModal("asset");
      return;
    }
    setModal("schedule");
  }
  function go(v: View) {
    setView(v);
    setSelected(null);
    setSearch("");
    setMobile(false);
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
  const filteredAssets = data.assets
    .filter(
      (a) =>
        role !== "Subcontractor" ||
        data.tasks.some(
          (t) =>
            t.assetId === a.id &&
            taskOwner(t) === "Subcontractor" &&
            t.status !== "Issue reported",
        ),
    )
    .filter((a) =>
      (a.name + " " + a.make + " " + a.area)
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  const openTasks = data.tasks.filter((t) => t.status !== "Verified");
  return (
    <div className="app unified-app">
      <WorkspaceViewport />
      {mobile && (
        <button
          className="tools-scrim"
          type="button"
          aria-label="Close workspace tools"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        id="workspace-tools"
        inert={!mobile}
        aria-hidden={!mobile}
        className={mobile ? "sidebar open" : "sidebar"}
      >
        <button type="button" className="brand" onClick={() => go("Overview")} aria-label="Go to workspace home">
          juggle<span>®</span>
        </button>
        <div className="workspace">
          <span className="workspace-icon">C</span>
          <div>
            Cocozza<span>Maintenance workspace</span>
          </div>
          <Settings2 size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav
            .filter((n) =>
              role === "Director"
                ? [
                    "Overview",
                    "Properties",
                    "Asset register",
                    "Maintenance",
                  ].includes(n.name)
                : (role === "Manager"
                    ? ["Inspections", "Maintenance", "Asset register"]
                    : ["Work orders", "Maintenance", "Asset register"]
                  ).includes(n.name),
            )
            .map((n) => (
              <button
                key={n.name}
                className={view === n.name ? "active" : ""}
                onClick={() => go(n.name)}
              >
                <n.icon size={19} />
                {
                  {
                    Overview: "Director board",
                    Properties: "Restaurants & rooms",
                    "Asset register": "Equipment",
                    Maintenance: "Gantt schedule",
                    Inspections: "Weekly walkthrough",
                    "Work orders": "Assigned jobs",
                  }[n.name]
                }
                {n.name === "Work orders" && (
                  <small>
                    {
                      data.tasks.filter((t) =>
                        ["Assigned", "Awaiting verification"].includes(
                          t.status,
                        ),
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
              <span className="profile-role">{role}</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="main" inert={overlayOpen}>
        <WorkspaceHeader
          role={role}
          disabled={!ready}
          toolsOpen={mobile}
          onTools={() => setMobile(!mobile)}
          onHome={() =>
            go(
              role === "Director"
                ? "Overview"
                : role === "Manager"
                  ? "Inspections"
                  : "Work orders",
            )
          }
          onRole={(next) => {
            setRole(next);
            setSelected(null);
            setModal(null);
            setMobile(false);
            setView(
              next === "Director"
                ? "Overview"
                : next === "Manager"
                  ? "Inspections"
                  : "Work orders",
            );
          }}
        />
        <SaveStatus
          ready={ready}
          cloud={cloudReady}
          status={syncStatus}
          receipt={cloudReceipt}
          onAccount={() => setAccount(true)}
          onReset={() => {
            if (
              confirm(
                "Reset all workspace records? Uploaded files are retained in storage.",
              )
            ) {
              setData(cloudReady ? INITIAL_HOME : seed);
              setSelected(null);
              setAccount(false);
              setToast("Workspace reset");
            }
          }}
        />
        <main>
          <PageTitle
            eyebrow={
              role +
              " · " +
              (asset
                ? "Equipment record"
                : view === "Overview"
                  ? "Restaurant setup"
                  : view === "Inspections"
                    ? "Inspection"
                    : view === "Work orders"
                      ? "Assigned work"
                      : "Workspace")
            }
            title={
              asset?.name ||
              (
                {
                  Overview: "Restaurant setup",
                  Properties: "Restaurants & rooms",
                  "Asset register": "Equipment",
                  Maintenance: "Work schedule",
                  Inspections: "Weekly walkthrough",
                  "Work orders": "Assigned jobs",
                } as Record<string, string>
              )[view]
            }
            subtitle={
              asset
                ? `${asset.area} · ${data.properties.find((p) => p.id === asset.propertyId)?.name}`
                : role === "Director"
                  ? "Set up, plan and review."
                  : role === "Manager"
                    ? "Check one appliance at a time."
                    : "Complete the assigned work and record the result."
            }
            action={
              admin &&
              view !== "Overview" && (
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
              )
            }
          />
          {!ready ? (
            <PageLoading />
          ) : cloudLoadError ? (
            <Panel className="page-failure">
              <h2>We couldn’t open your cloud kitchen.</h2>
              <p>{cloudLoadError}</p>
              <p>
                No local demo has replaced your cloud workspace. Retry before
                entering records.
              </p>
              <ActionBar
                backLabel="Sign out"
                onBack={async () => {
                  await supabase?.auth.signOut();
                  location.reload();
                }}
              >
                <button className="primary" onClick={() => location.reload()}>
                  Retry cloud connection
                </button>
              </ActionBar>
            </Panel>
          ) : (
            <>
              {selected && !asset && ready && (
                <div className="notice">
                  This QR record is not in the current workspace. Sign in with
                  the account that registered the equipment.
                </div>
              )}
              {asset ? (
                <>
                  <button
                    className="back"
                    onClick={() => {
                      setSelected(null);
                      setView(
                        role === "Director"
                          ? "Overview"
                          : role === "Manager"
                            ? "Inspections"
                            : "Work orders",
                      );
                    }}
                  >
                    <ArrowLeft size={16} /> Back to{" "}
                    {role === "Director"
                      ? "restaurant roadmap"
                      : role === "Manager"
                        ? "walkthrough"
                        : "assigned jobs"}
                  </button>
                  {asset.pendingApproval && (
                    <div className="notice">
                      New equipment submitted by the Manager. The Director must
                      approve it before it joins the weekly walkthrough.
                    </div>
                  )}
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
                      <p className="muted">
                        Asset ID · {asset.id.slice(0, 12)}
                      </p>
                      {admin && (
                        <label className="secondary">
                          Update equipment photo
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            capture="environment"
                            hidden
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              try {
                                const photo = await readFile(f);
                                setData((s) => ({
                                  ...s,
                                  assets: s.assets.map((a) =>
                                    a.id === asset.id ? { ...a, photo } : a,
                                  ),
                                  events: [
                                    log(asset.id, "Equipment photo updated"),
                                    ...s.events,
                                  ],
                                }));
                                setToast("Equipment photo updated");
                              } catch (error) {
                                setToast((error as Error).message);
                              }
                            }}
                          />
                        </label>
                      )}
                      <button
                        className="secondary"
                        onClick={() => setModal("qr")}
                      >
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
                            Administrator approval is required before
                            scheduling.
                          </p>
                        </div>
                        <Sparkles size={20} />
                      </div>
                      <div className="notice">
                        <strong>Live research needs configuration</strong>
                        <p>
                          Manufacturer web research and image identification are
                          not connected. Demo suggestions are examples, not
                          verified maintenance instructions.
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
                                      x.id === p.id
                                        ? { ...x, approved: true }
                                        : x,
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
              ) : [
                  "Overview",
                  "Inspections",
                  "Work orders",
                  "Maintenance",
                ].includes(view) ? (
                <Operations
                  key={role + view}
                  data={data}
                  setData={setData}
                  role={role}
                  propertyId={propertyId}
                  setPropertyId={setPropertyId}
                  mode={view === "Maintenance" ? "schedule" : "home"}
                  onAsset={(id) => {
                    setSelected(id);
                    setTab("Overview");
                  }}
                  onRegister={() => {
                    setReturnToRoadmap(role === "Director");
                    setModal("asset");
                  }}
                  onSchedule={showSchedule}
                  onSetup={() => go("Properties")}
                  onNewRestaurant={() => {
                    setSelected(null);
                    setModal("property");
                  }}
                  onRestaurantQR={() => {
                    setSelected(null);
                    setModal("qr");
                  }}
                  onAddRoom={() => setModal("area")}
                  onRole={(next) => {
                    setRole(next);
                    setSelected(null);
                    setView(
                      next === "Manager"
                        ? "Inspections"
                        : next === "Subcontractor"
                          ? "Work orders"
                          : "Overview",
                    );
                  }}
                  notify={setToast}
                />
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
                    <button
                      className="secondary"
                      onClick={() => setModal("qr")}
                    >
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
                            Equipment tags below reference normalized positions
                            on the uploaded plan.
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
                            (a) =>
                              a.propertyId === property.id && a.area === area,
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
                                data.properties.find(
                                  (p) => p.id === a.propertyId,
                                )?.name
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
              ) : null}
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
            className="modal shared-panel"
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
                <div className="cloud-proof">
                  <strong>Real Supabase storage</strong>
                  <p>
                    Database: prototype_workspaces (private to your account).
                    Photos/PDFs: private maintenance-evidence bucket.
                  </p>
                  {cloudReceipt && (
                    <p>
                      Last read-back: revision {cloudReceipt.revision},{" "}
                      {cloudReceipt.restaurants} restaurant records,{" "}
                      {cloudReceipt.equipment} appliances, {cloudReceipt.files}{" "}
                      file references.
                    </p>
                  )}
                  <a
                    href="https://docs.google.com/spreadsheets/d/1HEAdhmE8GHEaUbTc3Gyn3b713qUthZKBx0pYfIpFJoY/edit"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open the simple three-table plan
                  </a>
                  <button
                    className="secondary full"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      const generation = ++saveGeneration.current;
                      setSyncStatus("Saving…");
                      saveQueue.current = saveQueue.current.then(async () => {
                        try {
                          const remote = await loadWorkspace();
                          if (remote && remote.revision !== revision.current)
                            throw Error(
                              "Another device changed this workspace. Reload before saving.",
                            );
                          const receipt = await saveWorkspace(
                            data,
                            revision.current,
                          );
                          revision.current = receipt.revision;
                          conflict.current = false;
                          setCloudReceipt(receipt);
                          if (generation === saveGeneration.current)
                            setSyncStatus("Saved to Supabase");
                          setToast(
                            "Save verified: Supabase returned the exact records just saved.",
                          );
                        } catch (error) {
                          if (error instanceof ReadbackError)
                            revision.current = error.committedRevision;
                          conflict.current = true;
                          setSyncStatus("Not saved — reload required");
                          setToast((error as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      });
                      await saveQueue.current;
                    }}
                  >
                    Save now & verify in Supabase
                  </button>
                </div>
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
                    <button
                      className="secondary"
                      value="signup"
                      disabled={busy}
                    >
                      Create account
                    </button>
                    <ActionBar
                      backLabel="Cancel"
                      onBack={() => setAccount(false)}
                      backDisabled={busy}
                    >
                      <button
                        className="primary"
                        value="signin"
                        disabled={busy}
                      >
                        Sign in
                      </button>
                    </ActionBar>
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
            className="modal shared-panel"
            role="dialog"
            aria-modal="true"
            aria-label={modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-title">
              <h2>
                {modal === "property"
                  ? "Step 1 · Register restaurant"
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
                {!asset && (
                  <button className="secondary" onClick={() => window.print()}>
                    Print QR label
                  </button>
                )}
                <ActionBar backLabel="Close" onBack={() => setModal(null)}>
                  {!asset && role === "Director" ? (
                    <button
                      className="primary"
                      onClick={() => {
                        setModal(null);
                        setView("Overview");
                      }}
                    >
                      Next: capture equipment <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button className="primary" onClick={() => window.print()}>
                      Print QR label
                    </button>
                  )}
                </ActionBar>
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
                        ownerName: String(f.get("client")),
                        contactName: String(f.get("contactName")),
                        contactEmail: String(f.get("contactEmail")),
                        contactPhone: String(f.get("contactPhone")),
                        registeredAt: new Date().toISOString(),
                        areas: ["Kitchen"],
                      };
                      setData((s) => ({
                        ...s,
                        properties: [...s.properties, p],
                      }));
                      setPropertyId(p.id);
                      go("Overview");
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
                        pendingApproval: role === "Manager",
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
                      setSelected(
                        returnToRoadmap && role === "Director" ? null : a.id,
                      );
                      setTab("Overview");
                      setView(
                        returnToRoadmap && role === "Director"
                          ? "Overview"
                          : "Asset register",
                      );
                      setReturnToRoadmap(false);
                    }
                    if (modal === "schedule") {
                      if (String(f.get("startDate")) > String(f.get("date")))
                        throw Error(
                          "The finish date must be on or after the start date.",
                        );
                      const t: Task = {
                        id: uid(),
                        assetId: String(f.get("asset")),
                        title: String(f.get("title")),
                        date: String(f.get("date")),
                        startDate: String(f.get("startDate")),
                        kind: String(f.get("kind")) as Task["kind"],
                        owner: String(f.get("owner")) as Task["owner"],
                        status:
                          f.get("owner") === "Subcontractor"
                            ? "Assigned"
                            : "Scheduled",
                        notes: String(f.get("instructions") || ""),
                      };
                      setData((s) => ({
                        ...s,
                        tasks: [...s.tasks, t],
                        events: [
                          log(
                            t.assetId,
                            t.title +
                              " scheduled for " +
                              t.date +
                              " · Assigned to " +
                              t.owner,
                          ),
                          ...s.events,
                        ],
                      }));
                      setSelected(null);
                      setView("Maintenance");
                    }
                    setModal(modal === "property" ? "qr" : null);
                    setToast(
                      modal === "property"
                        ? "Restaurant registered. Print its QR, then start the documentation sweep."
                        : "Saved successfully",
                    );
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
                    <label className="field">
                      Main contact name
                      <input name="contactName" required />
                    </label>
                    <div className="form-row">
                      <label className="field">
                        Contact email
                        <input name="contactEmail" type="email" required />
                      </label>
                      <label className="field">
                        Contact phone
                        <input name="contactPhone" type="tel" />
                      </label>
                    </div>
                    <p className="muted">
                      A restaurant QR code and Kitchen area will be created
                      automatically.
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
                        {data.assets
                          .filter(
                            (a) =>
                              a.propertyId === property.id &&
                              !a.pendingApproval,
                          )
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="field">
                      Work to do
                      <input
                        name="title"
                        required
                        defaultValue="Equipment condition inspection"
                      />
                    </label>
                    <div className="form-row">
                      <label className="field">
                        Type of work
                        <select name="kind">
                          <option>Inspection</option>
                          <option>Preventive care</option>
                          <option>Repair</option>
                        </select>
                      </label>
                      <label className="field">
                        Who does it?
                        <select name="owner">
                          <option>Manager</option>
                          <option>Subcontractor</option>
                        </select>
                      </label>
                    </div>
                    <label className="field">
                      Start date
                      <input
                        type="date"
                        name="startDate"
                        required
                        defaultValue={new Date().toISOString().slice(0, 10)}
                      />
                    </label>
                    <label className="field">
                      Finish / due date
                      <input
                        type="date"
                        name="date"
                        required
                        defaultValue={new Date().toISOString().slice(0, 10)}
                      />
                    </label>

                    <label className="field">
                      Instructions / scope of work
                      <textarea
                        name="instructions"
                        placeholder="What should this person do? Reference the approved care plan."
                      />
                    </label>
                    <p className="muted">
                      Creates one occurrence. Automatic recurring scheduling is
                      not enabled in this first pass.
                    </p>
                  </>
                )}
                <ActionBar backLabel="Cancel" onBack={() => setModal(null)}>
                  <button className="primary full" disabled={busy}>
                    {busy
                      ? "Saving…"
                      : modal === "schedule"
                        ? "Schedule work"
                        : "Save " + (modal === "asset" ? "equipment" : modal)}
                  </button>
                </ActionBar>
              </form>
            )}
          </section>
        </div>
      )}
      <div id="workspace-overlays" />
    </div>
  );
}
