import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

/**
 * CeriumOS Deno Server
 * This script serves the static files for CeriumOS.
 * Entry point for Deno Deploy.
 */

// Fix: Explicitly declare Deno global for environments that do not automatically include Deno types.
declare const Deno: any;

Deno.serve((req) => {
  return serveDir(req, {
    fsRoot: ".",
    showIndex: true,
    quiet: true,
  });
});
