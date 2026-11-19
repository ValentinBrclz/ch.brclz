import type { H3Event } from 'h3'
import { escape } from 'es-toolkit/string'

// Fork-only: self-contained 404 page, kept outside upstream files to avoid merge conflicts.
// French strings use U+00A0 before ":", ";", "?" and "!".

interface NotFoundTranslation {
  title: string
  description: string
  home: string
}

const NOT_FOUND_TRANSLATIONS: Record<'de' | 'en' | 'fr', NotFoundTranslation> = {
  de: {
    title: 'Seite nicht gefunden',
    description: 'Dieser Link existiert nicht oder ist nicht mehr verfügbar.',
    home: 'Zur Startseite',
  },
  en: {
    title: 'Page not found',
    description: 'This link does not exist or is no longer available.',
    home: 'Back to home',
  },
  fr: {
    title: 'Page introuvable',
    description: 'Ce lien n’existe pas ou n’est plus disponible.',
    home: 'Retour à l’accueil',
  },
}

function resolveLanguage(event: H3Event): keyof typeof NOT_FOUND_TRANSLATIONS {
  // Reuses the upstream locale resolver (cookie, then Accept-Language); unsupported locales fall back to English.
  const language = resolveRedirectLocale(event).split('-')[0]
  return language === 'fr' || language === 'de' ? language : 'en'
}

export function isHtmlRequest(event: H3Event): boolean {
  return (getHeader(event, 'accept') || '').includes('text/html')
}

export function renderNotFoundPage(event: H3Event): string {
  const language = resolveLanguage(event)
  const t = NOT_FOUND_TRANSLATIONS[language]

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex">
    <meta name="color-scheme" content="light dark">
    <title>404 · ${escape(t.title)}</title>
    <style>
      :root{--background:oklch(1 0 0);--foreground:oklch(0.141 0.005 285.823);--muted-foreground:oklch(0.552 0.016 285.938);--border:oklch(0.92 0.004 286.32);--primary:oklch(0.21 0.006 285.885);--primary-foreground:oklch(0.985 0 0);--radius:0.625rem}
      @media (prefers-color-scheme:dark){:root{--background:oklch(0.141 0.005 285.823);--foreground:oklch(0.985 0 0);--muted-foreground:oklch(0.705 0.015 286.067);--border:oklch(1 0 0 / 10%);--primary:oklch(0.92 0.004 286.32);--primary-foreground:oklch(0.21 0.006 285.885)}}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:1rem;background:var(--background);color:var(--foreground)}
      main{width:100%;max-width:28rem;text-align:center}
      .code{font-size:clamp(5rem,28vw,8rem);font-weight:700;line-height:1;letter-spacing:-.06em;font-variant-numeric:tabular-nums}
      .rule{width:3rem;height:1px;margin:1.5rem auto;background:var(--border)}
      h1{font-size:1.125rem;font-weight:600;letter-spacing:-.025em;margin-bottom:.5rem}
      p{font-size:.875rem;line-height:1.5;color:var(--muted-foreground);margin-bottom:1.5rem}
      a{display:inline-block;padding:.5rem 1rem;border-radius:calc(var(--radius) - 2px);background:var(--primary);color:var(--primary-foreground);font-size:.875rem;font-weight:500;text-decoration:none}
      a:hover{opacity:.9}
      a:focus-visible{outline:2px solid var(--muted-foreground);outline-offset:2px}
    </style>
</head>
<body>
    <main>
        <div class="code" aria-hidden="true">404</div>
        <div class="rule" aria-hidden="true"></div>
        <h1>${escape(t.title)}</h1>
        <p>${escape(t.description)}</p>
        <a href="/">${escape(t.home)}</a>
    </main>
</body>
</html>`
}
