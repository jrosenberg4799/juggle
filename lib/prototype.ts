import type { State } from "./model";
import { supabase } from "./supabase";
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
} | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("prototype_workspaces")
    .select("data,revision")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data
    ? { state: data.data as State, revision: data.revision as number }
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
  return data as number;
}
