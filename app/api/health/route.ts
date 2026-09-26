export function GET() {
  return Response.json({ data: { ok: true, service: "sanitquote" } });
}
