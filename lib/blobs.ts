import { supabase } from "@/lib/supabase";

const bucket = "prism";

async function pathFor(id: string) {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error("Connectez-vous avant de déposer un fichier.");
  return `${userId}/${id}`;
}

export async function putFile(id: string, blob: Blob) {
  const path = await pathFor(id);
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType: blob.type || "application/octet-stream",
  });
  if (error) throw new Error(error.message);
}

export async function getFile(id: string) {
  const path = await pathFor(id);
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) return null;
  return data;
}

export async function deleteFile(id: string) {
  const path = await pathFor(id);
  await supabase.storage.from(bucket).remove([path]);
}
