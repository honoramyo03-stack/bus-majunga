// Couche HTTP basée sur la Web API standard (Request / Response).
// Les route handlers n'importent plus `next/server` : ils utilisent ces
// helpers, ce qui les rend portables vers n'importe quel runtime Node.js
// (Express, Fastify, Hono, Bun, Deno, etc.) qui suit la spec Fetch.

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  return (await req.json()) as T;
}

export function text(body: string, init?: ResponseInit): Response {
  return new Response(body, init);
}
