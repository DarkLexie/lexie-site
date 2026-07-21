// Shared Supabase client for like counts + visit logging.
// The anon/public key is meant to be exposed client-side - it has zero
// direct table access (see docs/supabase-setup.sql); every read/write goes
// through SECURITY DEFINER RPC functions.
window.LexieSupabase = (function () {
  const SUPABASE_URL = "https://ryisvyyoxsorxvjaptgn.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5aXN2eXlveHNvcnh2amFwdGduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1OTYwNzEsImV4cCI6MjEwMDE3MjA3MX0.h5DeETsjMUNflYQZFwJTm7FajpOjgr7eyHtx3OeRPg4";

  if (!window.supabase) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
