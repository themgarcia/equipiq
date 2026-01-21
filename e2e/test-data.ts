import { createClient } from "@supabase/supabase-js";
import {
  sessionToStorageState,
  getTestUserFromStorageState,
} from "lovable-agent-playwright-config/supabase-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF!;

/** Creates a test user with confirmed email and returns their ID, email, and session. */
export async function createTestUser(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw new Error(`Failed to create test user: ${error.message}`);

  const { data: signInData, error: signInError } =
    await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (signInError || !signInData.session) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    throw new Error(`Failed to sign in test user: ${signInError?.message}`);
  }

  return { id: data.user.id, email, session: signInData.session };
}

/** Deletes a test user by ID. */
export async function deleteTestUser(userId: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) console.warn(`Warning: Failed to delete test user ${userId}: ${error.message}`);
}

/** Converts a test user's session to Playwright storage state. */
export function testUserToStorageState(user: Awaited<ReturnType<typeof createTestUser>>, baseUrl: string) {
  return sessionToStorageState(user.session, baseUrl, PROJECT_REF);
}

/** Gets the test user metadata from a storage state file. */
export function getTestUserFromFile(filePath: string, baseUrl: string) {
  return getTestUserFromStorageState(filePath, baseUrl);
}
