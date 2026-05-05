import { fileURLToPath } from 'node:url'
import { relative } from 'node:path'

import type { RemixNode } from 'remix/ui'
import { renderToStream } from 'remix/ui/server'

import { router } from '../router.ts'
import { routes } from '../routes.ts'

export function render(node: RemixNode, request: Request, init?: ResponseInit) {
  let stream = renderToStream(node, {
    frameSrc: request.url,
    async resolveFrame(src, target) {
      let headers = new Headers({ accept: 'text/html' })
      let cookie = request.headers.get('cookie')
      if (cookie) headers.set('cookie', cookie)
      if (target) headers.set('x-remix-target', target)

      let response = await router.fetch(new Request(new URL(src, request.url), { headers }))
      return response.body ?? response.text()
    },
    resolveClientEntry(entryId, component) {
      // clientEntry components pass `import.meta.url` (file://) as their id;
      // map that to a path the asset server can serve to the browser.
      const filePath = entryId.startsWith('file://') ? fileURLToPath(entryId) : entryId
      const rel = relative(process.cwd(), filePath)
      return {
        href: routes.assets.href({ path: rel }),
        exportName: component.name,
      }
    },
  })

  let headers = new Headers(init?.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'text/html; charset=utf-8')
  }

  return new Response(stream, { ...init, headers })
}
