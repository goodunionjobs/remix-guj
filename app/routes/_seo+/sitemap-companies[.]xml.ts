// File: app/routes/_seo+/sitemap.companies[.]xml.ts
import { type LoaderFunction } from '@remix-run/node'
import { cachified, cache } from '#app/utils/cache.server.ts'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { db } from '#app/utils/db.server'
import { employers } from '../../../drizzle/schema' // Adjust the import path based on your schema structure
import {
	generateSitemap,
	createSitemapResponse,
	type SitemapURL,
} from '#app/utils/sitemap.server'
import slugify from '@sindresorhus/slugify'

export const loader: LoaderFunction = async ({ request }) => {
	const baseUrl = getDomainUrl(request)

	const sitemap = await cachified({
		key: 'sitemap-employers',
		cache,
		ttl: 600_000, // 10 minutes
		async getFreshValue() {
			// Get all employers
			const employersQuery = await db.select().from(employers)
			// If you have a lot of employers, consider implementing pagination like in the jobs example
			// For now, assuming employers won't reach the 50,000 limit

			// Map employer data to sitemap URLs
			const employerUrls: SitemapURL[] = employersQuery.map(employer => {
				return {
					loc: `${baseUrl}/companies/${employer.id}-${slugify(employer.name)}`,
					priority: 0.7,
					// lastmod: employer.updatedAt || new Date(),
					changefreq: 'weekly', // Companies don't change very often
				}
			})

			return generateSitemap(employerUrls)
		},
	})

	return createSitemapResponse(sitemap)
}
