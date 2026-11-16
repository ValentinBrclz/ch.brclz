import { describe, expect, it } from 'vitest'
import { applyDefaultUtm } from '../../app/utils/default-utm'

const defaults = { source: 'brclz.ch', medium: 'referral' }

describe('applyDefaultUtm', () => {
  it('adds both parameters when absent', () => {
    expect(applyDefaultUtm('https://example.com/page', defaults))
      .toBe('https://example.com/page?utm_source=brclz.ch&utm_medium=referral')
  })

  it('keeps existing query parameters and fragments order-safe', () => {
    const result = new URL(applyDefaultUtm('https://example.com/?a=1#top', defaults))
    expect(result.searchParams.get('a')).toBe('1')
    expect(result.searchParams.get('utm_source')).toBe('brclz.ch')
    expect(result.hash).toBe('#top')
  })

  it('never overwrites existing UTM values', () => {
    const url = 'https://example.com/?utm_source=newsletter'
    const result = new URL(applyDefaultUtm(url, defaults))
    expect(result.searchParams.get('utm_source')).toBe('newsletter')
    expect(result.searchParams.get('utm_medium')).toBe('referral')
  })

  it('only adds the configured parameter', () => {
    expect(applyDefaultUtm('https://example.com/', { source: 'brclz.ch', medium: '' }))
      .toBe('https://example.com/?utm_source=brclz.ch')
  })

  it('is a no-op when defaults are empty or the URL is not HTTP(S)', () => {
    expect(applyDefaultUtm('https://example.com/', { source: '', medium: '' })).toBe('https://example.com/')
    expect(applyDefaultUtm('not a url', defaults)).toBe('not a url')
    expect(applyDefaultUtm('', defaults)).toBe('')
  })
})
