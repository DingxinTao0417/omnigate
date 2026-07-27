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
/**
 * Application-wide constants
 */

// System Configuration Defaults
export const DEFAULT_SYSTEM_NAME = 'Omnigate'
export const DEFAULT_LOGO = '/logo.png'

// Built-in documentation route.
export const DEFAULT_DOCS_LINK = '/docs'

/**
 * Public API base URL shown in docs and marketing copy.
 *
 * Deliberately a fixed production URL rather than `window.location.origin`:
 * readers copy these snippets into their own clients, so the value must stay
 * correct even when the page is being viewed over localhost, a LAN IP, or a
 * preview deployment.
 */
export const PUBLIC_API_BASE_URL = 'https://omnigate.cc'

// The upstream backend still seeds `docs_link` with its own hosted docs. Treat
// that value as "unset" so fresh installs land on the built-in /docs pages.
export const LEGACY_UPSTREAM_DOCS_LINK = 'https://docs.newapi.pro'

// LocalStorage Keys
export const STORAGE_KEYS = {
  SYSTEM_NAME: 'system_name',
  LOGO: 'logo',
  FOOTER_HTML: 'footer_html',
} as const
