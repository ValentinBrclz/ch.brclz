import { parseQuery, parseURL, withQuery } from 'ufo'

export interface DefaultUtm {
  source?: string
  medium?: string
}

/**
 * Add default `utm_source` / `utm_medium` to a destination URL.
 * Existing values are never overwritten; empty defaults and non-HTTP(S) URLs are left untouched.
 */
export function applyDefaultUtm(url: string, defaults: DefaultUtm): string {
  const source = defaults.source?.trim()
  const medium = defaults.medium?.trim()
  if (!source && !medium)
    return url

  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed))
    return url

  const query = parseQuery(parseURL(trimmed).search)
  const additions: Record<string, string> = {}
  if (source && !query.utm_source)
    additions.utm_source = source
  if (medium && !query.utm_medium)
    additions.utm_medium = medium

  return Object.keys(additions).length ? withQuery(trimmed, additions) : url
}
