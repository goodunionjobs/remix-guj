// File: app/routes/_seo+/sitemap.static[.]xml.ts
import { type LoaderFunction } from '@remix-run/node'
import { cachified, cache } from '#app/utils/cache.server.ts'
import { getDomainUrl } from '#app/utils/misc.tsx'
import {
	generateSitemap,
	createSitemapResponse,
	type SitemapURL,
} from '#app/utils/sitemap.server'

export const loader: LoaderFunction = async ({ request }) => {
	const baseUrl = getDomainUrl(request)

	const sitemap = await cachified({
		key: 'sitemap-static',
		cache,
		ttl: 600_000, // 10 minutes
		async getFreshValue() {
			const staticRoutes: SitemapURL[] = [
				{ loc: `${baseUrl}/`, priority: 0.8, lastmod: new Date() },
				{ loc: `${baseUrl}/abuse`, priority: 0.6, lastmod: new Date() },
				{ loc: `${baseUrl}/blog`, priority: 0.7, lastmod: new Date() },
				{
					loc: `${baseUrl}/blog/legitimate-work-from-home-union-jobs`,
					priority: 0.7,
					lastmod: new Date('2026-05-26'),
				},
				{ loc: `${baseUrl}/ccpa`, priority: 0.6, lastmod: new Date() },
				{ loc: `${baseUrl}/copyright`, priority: 0.6, lastmod: new Date() },
				{ loc: `${baseUrl}/privacy`, priority: 0.6, lastmod: new Date() },
				{ loc: `${baseUrl}/support`, priority: 0.6, lastmod: new Date() },
				{ loc: `${baseUrl}/tos`, priority: 0.6, lastmod: new Date() },
				// Add any other static routes here
			]

			return generateSitemap(staticRoutes)
		},
	})

	return createSitemapResponse(sitemap)
}
