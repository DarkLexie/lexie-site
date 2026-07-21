// Logs one visit per browser session (not per page view) to Supabase.
// Private - there's no public read path for this data (see supabase-setup.sql);
// check the site_visits table in the Supabase dashboard to see the count.
(function () {
  const client = window.LexieSupabase;
  if (!client) return;
  const FLAG = "lexie-visit-logged";
  if (window.sessionStorage.getItem(FLAG)) return;
  window.sessionStorage.setItem(FLAG, "1");
  client.rpc("log_visit").then(({ error }) => {
    if (error) console.error("log_visit failed", error);
  });
})();
