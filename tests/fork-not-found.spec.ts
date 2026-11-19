import { describe, expect, it } from 'vitest'
import { fetch } from './utils'

const HTML = { Accept: 'text/html,application/xhtml+xml' }

describe('fork 404 handling', () => {
  it.each(['/credentials.json', '/a/b', '/_nuxt/missing.js', '/wp-login.php'])('answers %s with a plain 404', async (path) => {
    const response = await fetch(path)
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('text/plain')
    expect(await response.text()).toBe('Not Found')
  })

  it('serves the custom page for HTML requests on non-slug paths', async () => {
    const response = await fetch('/credentials.json', { headers: HTML })
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('text/html')
    const body = await response.text()
    expect(body).toContain('<meta name="robots" content="noindex">')
    expect(body).toContain('Page not found')
  })

  it('serves the custom page for an unknown slug', async () => {
    const response = await fetch(`/missing-${crypto.randomUUID()}`, { headers: HTML })
    expect(response.status).toBe(404)
    expect(await response.text()).toContain('Page not found')
  })

  it('keeps the JSON error for unknown slugs when HTML is not requested', async () => {
    const response = await fetch(`/missing-${crypto.randomUUID()}`, { headers: { Accept: 'application/json' } })
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('localises the page from Accept-Language', async () => {
    const response = await fetch('/credentials.json', { headers: { ...HTML, 'Accept-Language': 'fr-CH,fr;q=0.9' } })
    expect(response.status).toBe(404)
    const body = await response.text()
    expect(body).toContain('<html lang="fr">')
    expect(body).toContain('Page introuvable')
  })

  it('does not alter API errors', async () => {
    const response = await fetch('/api/does-not-exist', { headers: HTML })
    expect(response.status).toBe(401)
  })

  it('does not hijack app-owned paths', async () => {
    expect((await fetch('/api/verify')).status).toBe(401)
    expect((await fetch('/dashboard/links', { headers: HTML })).status).not.toBe(404)
  })
})
