// File: app/routes/_seo+/sitemap[.]xml.ts
import { type LoaderFunction } from '@remix-run/node'
import { cachified, cache } from '#app/utils/cache.server.ts'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { db } from '#app/utils/db.server'
import { jobs } from '../../../drizzle/schema'
import { count } from 'drizzle-orm'
import {
	generateSitemapIndex,
	createSitemapResponse,
} from '#app/utils/sitemap.server'

// This is the main sitemap index file that references all other sitemaps
export const loader: LoaderFunction = async ({ request }) => {
	console.log('Sitemap index loader triggered')
	const baseUrl = getDomainUrl(request)

	const sitemapIndex = await cachified({
		key: 'sitemap',
		cache,
		ttl: 600_000, // 10 minutes
		async getFreshValue() {
			try {
				// Get the job count to determine how many job sitemap files we need
				const jobCount = await db
					.select({ count: count() })
					.from(jobs)
					.then(result => Number(result[0]?.count || 0))

				console.log(`Total job count: ${jobCount}`)

				// Calculate how many job sitemap files we need (50,000 URLs per file)
				const jobSitemapCount = Math.max(1, Math.ceil(jobCount / 50000))
				console.log(`Will generate ${jobSitemapCount} job sitemap files`)

				// Build the array of sitemaps for the index
				const sitemaps = [
					// Static routes sitemap
					{
						loc: `${baseUrl}/sitemap-static.xml`,
						lastmod: new Date(),
					},

					// Job sitemaps with dynamic parameters
					...Array.from({ length: jobSitemapCount }, (_, i) => ({
						loc: `${baseUrl}/sitemap-jobs/${i + 1}.xml`,
						lastmod: new Date(),
					})),

					// Union sitemap
					{
						loc: `${baseUrl}/sitemap-unions.xml`,
						lastmod: new Date(),
					},

					// Company sitemap
					{
						loc: `${baseUrl}/sitemap-companies.xml`,
						lastmod: new Date(),
					},
				]

				// Generate the sitemap index XML
				return generateSitemapIndex(sitemaps)
			} catch (error) {
				console.error('Error generating sitemap index:', error)
				throw error
			}
		},
	})

	return createSitemapResponse(sitemapIndex)
}
