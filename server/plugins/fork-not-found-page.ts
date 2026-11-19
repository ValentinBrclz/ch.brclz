// Fork-only: show the custom 404 page for HTML requests that end in a 404, including the
// "Link not found" error thrown by `1.redirect.ts` for unknown slugs. API clients keep their JSON errors.
// Nitro writes error responses inside h3's `onError`, so that is the hook that is wrapped here.
export default defineNitroPlugin((nitroApp) => {
  const { options } = nitroApp.h3App
  const upstreamOnError = options.onError

  options.onError = (error, event) => {
    const isPageRequest = (event.method === 'GET' || event.method === 'HEAD')
      && !event.path.startsWith('/api/')
      && isHtmlRequest(event)

    if (error.statusCode === 404 && isPageRequest) {
      setResponseStatus(event, 404, 'Not Found')
      setHeader(event, 'Cache-Control', 'no-store')
      return send(event, renderNotFoundPage(event), 'text/html; charset=utf-8')
    }

    return upstreamOnError?.(error, event)
  }
})
