import { parsePath } from 'ufo'

// Fork-only. `1.redirect.ts` already answers every slug-shaped path (redirect or 404), so
// this middleware only sees the rest. Because the app is `ssr: false`, Nuxt would otherwise
// serve the SPA shell with HTTP 200 for any such path (soft 404).
const APP_OWNED_PREFIXES = ['/api', '/dashboard', '/_nuxt', '/_docs', '/_assets', '/__nuxt_error']

function isAppOwnedPath(pathname: string): boolean {
  return pathname === '/' || APP_OWNED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export default eventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD')
    return

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
