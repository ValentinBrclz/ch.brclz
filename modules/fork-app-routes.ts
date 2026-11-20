import type { NuxtPage } from 'nuxt/schema'
import { defineNuxtModule } from 'nuxt/kit'

// Fork-only. The app is `ssr: false`, so the Worker serves the SPA shell for pages and for unknown
// paths alike, and only the client router knows which routes exist. This module hands the real page
// list (collected at build time, so pages added upstream are picked up automatically) to the server
// as the virtual module `#fork-app-routes`, used by `server/middleware/9.fork-not-found.ts`.
export default defineNuxtModule({
  meta: { name: 'fork-app-routes' },
  setup(_options, nuxt) {
    let patterns: string[] = []

    nuxt.hook('pages:resolved', (pages) => {
      const found = new Set<string>()

      const walk = (list: NuxtPage[], parent: string) => {
        for (const page of list) {
          const joined = page.path.startsWith('/') ? page.path : `${parent}/${page.path}`
          const path = (joined.replace(/\/+$/, '') || '/')
          found.add(path)
          if (page.children?.length)
            walk(page.children, path === '/' ? '' : path)
        }
      }
      walk(pages, '')

      // Dynamic segments (`:id`, `:slug(.*)*`) become regular expressions; static paths are escaped.
      patterns = [...found].map(path => path
        .split('/')
        .map(segment => segment.startsWith(':')
          ? (segment.includes('(.*)') ? '.*' : '[^/]+')
          : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('/'))
    })

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.virtual ||= {}
      // A function, so the list is read when Nitro builds, after pages have been resolved.
      nitroConfig.virtual['#fork-app-routes'] = () => `export default ${JSON.stringify(patterns)}`
    })
  },
})
