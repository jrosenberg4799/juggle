import type { State } from "./model";
import { supabase } from "./supabase";
import {
  CloudReceipt,
  ReadbackError,
  receiptFor,
  verifySavedWorkspace,
} from "./cloud-receipt";
export const INITIAL_HOME: State = {
  properties: [
    {
      id: "home-kitchen",
      name: "My home kitchen",
      address: "Home kitchen · proof of concept",
      client: "Personal proof of concept",
      areas: ["Kitchen"],
    },
  ],
  assets: [],
  tasks: [],
  events: [],
  plans: [],
};
export async function loadWorkspace(): Promise<{
  state: State;
  revision: number;
  receipt: CloudReceipt;
} | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("prototype_workspaces")
    .select("data,revision,updated_at")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data
    ? {
        state: data.data as State,
        revision: data.revision as number,
        receipt: receiptFor(data.data as State, data.revision, data.updated_at),
      }
    : null;
}
export async function saveWorkspace(state: State, revision: number) {
  if (!supabase) throw Error("Supabase is not configured.");
  const json = JSON.stringify(state);
  if (json.includes("local://") || json.includes("data:"))
    throw Error(
      "Local-only files cannot be synced. Upload them again while signed in.",
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw Error("Please sign in.");
  const { data, error } = await supabase.rpc("save_prototype_workspace", {
    p_data: state,
    p_revision: revision,
  });
  if (error) throw error;
  const savedRevision = data as number;
  const { data: row, error: readError } = await supabase
    .from("prototype_workspaces")
    .select("data,revision,updated_at")
    .eq("owner_id", user.id)
    .single();
  if (readError)
    throw new ReadbackError(
      "Save was accepted, but read-back failed: " + readError.message,
      savedRevision,
    );
  try {
    return verifySavedWorkspace(state, savedRevision, row);
  } catch (error) {
    throw new ReadbackError((error as Error).message, savedRevision);
  }
}
export async function openRealWorkspace() {
  const existing = await loadWorkspace();
  if (existing) return existing;
  try {
    const receipt = await saveWorkspace(INITIAL_HOME, 0);
    return { state: INITIAL_HOME, revision: receipt.revision, receipt };
  } catch (error) {
    const raced = await loadWorkspace();
    if (raced) return raced;
    throw error;
  }
}
