/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

/**
 * Makes root-relative links inside rendered markdown behave like in-app
 * navigation. The shared Markdown renderer marks every link as
 * `target="_blank"`, which is right for external URLs but would open our own
 * console pages in a new tab.
 *
 * Returns a ref callback for the element wrapping the markdown, plus a click
 * handler. State (not a plain ref) holds the node so the effect also runs when
 * the wrapper mounts later — e.g. after a loading state resolves.
 */
export function useInAppMarkdownLinks(content: string) {
  const navigate = useNavigate()
  const [host, setHost] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!host) return

    const unmarkInternalLinks = () => {
      host.querySelectorAll('a[href]').forEach((node) => {
        if ((node.getAttribute('href') ?? '').startsWith('/')) {
          node.removeAttribute('target')
          node.removeAttribute('rel')
        }
      })
    }

    unmarkInternalLinks()

    const observer = new MutationObserver(() => {
      observer.disconnect()
      unmarkInternalLinks()
      observer.observe(host, { childList: true, subtree: true })
    })
    observer.observe(host, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [content, host])

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const anchor = (event.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href') ?? ''
      if (!href.startsWith('/')) return
      if (event.metaKey || event.ctrlKey || event.shiftKey) return

      event.preventDefault()
      void navigate({ to: href })
    },
    [navigate]
  )

  return { hostRef: setHost, handleClick }
}
