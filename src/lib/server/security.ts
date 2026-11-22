/**
 * Cabeçalhos de segurança aplicados a toda resposta do servidor (ver src/server.ts).
 *
 * CSP: o navegador só carrega scripts, dados, imagens e iframes das origens que o app realmente usa.
 * Observação: 'unsafe-inline' em script-src é necessário por causa dos scripts inline do TanStack Start
 * (hidratação) e do script de tema/acessibilidade no <head>; mesmo assim nenhum script externo é aceito.
 */
const SUPABASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";

const CONNECT = [
  "'self'",
  "https://openlibrary.org",
  "https://archive.org",
  "https://*.wikisource.org",
  "https://*.wikipedia.org",
  "https://commons.wikimedia.org",
  "https://nominatim.openstreetmap.org",
  "https://overpass-api.de",
  "https://overpass.kumi.systems",
  "https://maps.mail.ru",
  "https://overpass.private.coffee",
  SUPABASE,
].filter(Boolean);

const IMG = [
  "'self'",
  "data:",
  "blob:",
  "https://covers.openlibrary.org",
  "https://*.archive.org",
  "https://archive.org",
  "https://upload.wikimedia.org",
  "https://tile.openstreetmap.org",
  "https://*.tile.openstreetmap.org",
];

export function contentSecurityPolicy(dev = false) {
  const devExtra = dev ? " ws: http://localhost:* ws://localhost:*" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${IMG.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${CONNECT.join(" ")}${devExtra}`,
    "frame-src https://archive.org", // leitor de livros digitalizados (Internet Archive)
    "worker-src 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'", // ninguém embute o site (clickjacking)
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function securityHeaders(dev = false): Record<string, string> {
  return {
    "Content-Security-Policy": contentSecurityPolicy(dev),
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // localização só no próprio site e a pedido; câmera, microfone etc. desligados
    "Permissions-Policy": "geolocation=(self), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
}

export function withSecurityHeaders(res: Response, dev = false): Response {
  const out = new Response(res.body, res); // cópia: os headers originais podem ser imutáveis
  for (const [k, v] of Object.entries(securityHeaders(dev))) {
    if (!out.headers.has(k)) out.headers.set(k, v);
  }
  return out;
}
