"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
const BUCKET = "maintenance-evidence";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("juggle-media", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(Error("Local media storage unavailable."));
  });
}
async function localPut(path: string, file: Blob) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(file, path);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function uploadFile(file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024)
    throw Error("Choose a file smaller than 8 MB.");
  if (
    !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
      file.type,
    )
  )
    throw Error("Use a JPEG, PNG, WebP image or PDF.");
  const suffix =
    file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const id = crypto.randomUUID() + "." + suffix;
  const auth = supabase ? await supabase.auth.getSession() : null;
  if (auth?.error)
    throw Error(
      "Your sign-in could not be verified. Sign in again before uploading.",
    );
  const session = auth?.data.session || null;
  if (session && supabase) {
    const path = session.user.id + "/" + id;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw Error("Upload failed: " + error.message);
    const check = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
    if (check.error || !check.data?.signedUrl)
      throw Error(
        "Upload accepted but private file read-back could not be verified. Please try again.",
      );
    return "storage://" + path;
  }
  await localPut(id, file);
  return "local://" + id;
}
export async function mediaURL(path: string): Promise<string> {
  if (path.startsWith("storage://")) {
    if (!supabase) throw Error("Sign in to view this private file.");
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path.slice(10), 3600);
    if (error) throw error;
    return data.signedUrl;
  }
  if (path.startsWith("local://")) {
    const db = await database();
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        const r = db
          .transaction("files")
          .objectStore("files")
          .get(path.slice(8));
        r.onsuccess = () =>
          r.result
            ? resolve(r.result)
            : reject(Error("Local file is unavailable on this device."));
        r.onerror = () => reject(r.error);
      });
      return URL.createObjectURL(blob);
    } finally {
      db.close();
    }
  }
  if (path.startsWith("data:")) return path;
  throw Error("Unrecognized file reference");
}
export function useMedia(path?: string) {
  const [url, setURL] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true,
      current = "";
    setURL("");
    setError("");
    async function refresh() {
      if (!path) return;
      try {
        const next = await mediaURL(path);
        if (!active) {
          if (next.startsWith("blob:")) URL.revokeObjectURL(next);
          return;
        }
        if (current.startsWith("blob:")) URL.revokeObjectURL(current);
        current = next;
        setURL(next);
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 50 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(timer);
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
    };
  }, [path]);
  return { url, error };
}
export function MediaImage({ path, alt }: { path: string; alt: string }) {
  const { url, error } = useMedia(path);
  return url ? (
    <img src={url} alt={alt} />
  ) : (
    <span className="muted">{error || "Loading image…"}</span>
  );
}
export function MediaLink({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  const { url, error } = useMedia(path);
  return url ? (
    <a href={url} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <span className="muted">{error || "Loading file…"}</span>
  );
}
export function MediaPDF({ path }: { path: string }) {
  const { url, error } = useMedia(path);
  return url ? (
    <object data={url} type="application/pdf" className="pdf">
      <a href={url} target="_blank" rel="noreferrer">
        Open floor plan PDF
      </a>
    </object>
  ) : (
    <p>{error || "Loading PDF…"}</p>
  );
}
export async function migrateLegacyFiles<T>(state: T): Promise<T> {
  async function visit(value: unknown): Promise<unknown> {
    if (typeof value === "string" && value.startsWith("data:")) {
      const blob = await (await fetch(value)).blob();
      const id = crypto.randomUUID();
      await localPut(id, blob);
      return "local://" + id;
    }
    if (Array.isArray(value)) return Promise.all(value.map(visit));
    if (value && typeof value === "object") {
      const entries = await Promise.all(
        Object.entries(value).map(async ([k, v]) => [k, await visit(v)]),
      );
      return Object.fromEntries(entries);
    }
    return value;
  }
  return (await visit(state)) as T;
}
