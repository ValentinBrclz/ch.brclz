import { parsePath } from 'ufo'
import appRoutePatterns from '#fork-app-routes'

// Fork-only. `1.redirect.ts` already answers every slug-shaped path (redirect or 404), so
// this middleware only sees the rest. Because the app is `ssr: false`, Nuxt would otherwise
// serve the SPA shell with HTTP 200 for any such path (soft 404). A path is served only if it is
// a real page (list generated at build time by `modules/fork-app-routes.ts`) or a server route.
const PAGE_PATTERNS = appRoutePatterns.map(pattern => new RegExp(`^${pattern}$`))
const SERVER_PREFIXES = ['/api', '/_nuxt', '/_docs', '/_assets', '/__nuxt_error']

function normalizePath(pathname: string): string | null {
  try {
    // Decoding first means `/dashboard/%2eenv` cannot slip past the checks below.
    const decoded = decodeURI(pathname)
    return decoded.length > 1 ? decoded.replace(/\/+$/, '') || '/' : decoded
  }
  catch {
    return null
  }
}

function isAppOwnedPath(pathname: string): boolean {
  const path = normalizePath(pathname)
  if (path === null)
    return false

  // `/dashboard` itself is redirected to its first page by routeRules.
  return path === '/dashboard'
    || PAGE_PATTERNS.some(pattern => pattern.test(path))
    || SERVER_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

export default eventHandler((event) => {
  // Every method: link forms (POST) are answered earlier by 1.redirect.ts, and /api is app-owned.
  const { pathname } = parsePath(event.path)
  if (isAppOwnedPath(pathname))
    return

  const { notFoundRedirect } = useRuntimeConfig(event)
  if (notFoundRedirect) {
    // Same loop guard as 1.redirect.ts: the configured target itself must be served.
    if (pathname === parsePath(notFoundRedirect).pathname)
      return
    return sendRedirect(event, notFoundRedirect, 302)
  }

  setResponseStatus(event, 404, 'Not Found')
  setHeader(event, 'Cache-Control', 'no-store')

  if (isHtmlRequest(event)) {
    setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return renderNotFoundPage(event)
  }

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return 'Not Found'
})
