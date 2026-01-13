import { serve } from "https://deno.land/std@0.196.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.196.0/http/file_server.ts";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    // default to index.html for root
    let pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
    // Serve files out of ./dist
    return await serveFile(req, `./dist${pathname}`);
  } catch (err) {
    // You can return index.html for SPA routing instead of 404 if desired:
    try {
      return await serveFile(req, "./dist/index.html");
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }
});
