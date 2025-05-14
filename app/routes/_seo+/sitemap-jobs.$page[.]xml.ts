// File: app/routes/_seo+/sitemap-jobs.$page[.]xml.ts
import { type LoaderFunction } from '@remix-run/node'
import { cachified, cache } from '#app/utils/cache.server.ts'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { db } from '#app/utils/db.server'
import { jobs } from '../../../drizzle/schema'
import slugify from '@sindresorhus/slugify'
import {
	generateSitemap,
	createSitemapResponse,
	type SitemapURL,
} from '#app/utils/sitemap.server'

export const loader: LoaderFunction = async ({ request, params }) => {
	console.log('Jobs sitemap loader triggered with params:', params)

	const baseUrl = getDomainUrl(request)
	const pageParam = params.page || '1'
	const page = parseInt(pageParam, 10)

	console.log(`Processing page parameter: ${pageParam}, parsed as: ${page}`)

	if (isNaN(page) || page < 1) {
		console.log(`Invalid page number: ${pageParam}`)
		return new Response('Invalid page number', { status: 400 })
	}

	// Define the limit of URLs per sitemap file (Google's limit is 50,000)
	const LIMIT = 10_000
	const offset = (page - 1) * LIMIT

	const sitemapKey = `sitemap-jobs-${page}`

	console.log(`Generating sitemap for jobs page ${page} with offset ${offset}`)

	const sitemap = await cachified({
		key: sitemapKey,
		cache,
		ttl: 600_000, // 10 minutes
		async getFreshValue() {
			try {
				// Get jobs for this specific page with pagination
				// Inside getFreshValue in sitemap-jobs.$page[.]xml.ts
				const jobsForPage = await db
					.select({
						id: jobs.id,
						title: jobs.title,
						timeStamp: jobs.timeStamp,
					})
					.from(jobs)
					.limit(LIMIT)
					.offset(offset)
					.orderBy(jobs.id)

				console.log(`Found ${jobsForPage.length} jobs for page ${page}`)

				// If no jobs found for this page and it's not the first page, return a 404 response
				if (jobsForPage.length === 0 && page > 1) {
					console.log(`No jobs found for page ${page}, returning 404`)
					throw new Response('No jobs found for this page', { status: 404 })
				}

				// If it's the first page and no jobs found, return an empty sitemap
				if (jobsForPage.length === 0) {
					console.log('First page with no jobs, returning empty sitemap')
					return generateSitemap([])
				}

				// Map job data to sitemap URLs
				const jobUrls: SitemapURL[] = jobsForPage.map(job => ({
					loc: `${baseUrl}/jobs/${job.id}-${slugify(job.title)}`,
					priority: 0.7,
					lastmod: job.timeStamp,
					changefreq: 'weekly', // Jobs change relatively frequently
				}))

				return generateSitemap(jobUrls)
			} catch (error) {
				console.error('Error generating jobs sitemap:', error)
				throw error
			}
		},
	})

	return createSitemapResponse(sitemap)
}
