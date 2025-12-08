import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // -----------------------------
    // 1) API ROUTES
    // -----------------------------
    if (url.pathname.startsWith("/api")) {
      return await handleAPI(request, env);
    }

    // -----------------------------
    // 2) Serve Static Frontend (public/)
    // -----------------------------
    try {
      return await env.ASSETS.fetch(request);
    } catch (err) {
      return new Response("Asset not found", { status: 404 });
    }
  },
};

// -------------------------------------------
// API HANDLER
// -------------------------------------------
async function handleAPI(request, env) {
  const url = new URL(request.url);

  // GET /api/comments
  if (url.pathname === "/api/comments") {
    const stmt = env.DB.prepare("SELECT * FROM comments LIMIT 20");
    const { results } = await stmt.all();
    return json(results);
  }

  // GET /api/kv/:key
  if (url.pathname.startsWith("/api/kv/")) {
    const key = url.pathname.replace("/api/kv/", "");
    const value = await env.PROJECTS_KV.get(key);
    return json({ key, value });
  }

  // POST /api/kv
  if (url.pathname === "/api/kv" && request.method === "POST") {
    const body = await request.json();
    await env.PROJECTS_KV.put(body.key, body.value);
    return json({ success: true });
  }

  return json({ error: "Not Found" }, 404);
}

// Helper JSON response
function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

