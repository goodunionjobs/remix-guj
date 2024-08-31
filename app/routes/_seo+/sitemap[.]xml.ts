import { type LoaderFunction } from '@remix-run/node'
import { cachified, cache } from '#app/utils/cache.server.ts'
import { db } from '#app/utils/db.server'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { jobs } from '../../../drizzle/schema'
import slugify from '@sindresorhus/slugify'

export const loader: LoaderFunction = async ({ request }) => {
	const baseUrl = getDomainUrl(request)

	const sitemap = await cachified({
		key: 'sitemap',
		cache,
		ttl: 600_000, // 10 minutes in milliseconds
		async getFreshValue() {
			const staticRoutes = [
				{ loc: `${baseUrl}/*`, priority: 0.8 },
				{ loc: `${baseUrl}/abuse`, priority: 0.6 },
				{ loc: `${baseUrl}/ccpa`, priority: 0.6 },
				{ loc: `${baseUrl}/copyright`, priority: 0.6 },
				{ loc: `${baseUrl}`, priority: 0.8 },
				{ loc: `${baseUrl}/privacy`, priority: 0.6 },
				{ loc: `${baseUrl}/support`, priority: 0.6 },
				{ loc: `${baseUrl}/tos`, priority: 0.6 },
			]

			const jobsquery = await db.select().from(jobs)

			const dynamicRoutes = jobsquery.map(job => ({
				loc: `${baseUrl}/jobs/${job.id}-${slugify(job.title)}`,
				priority: 0.7,
				lastmod: job.timeStamp.toISOString(),
			}))

			const allRoutes = [...staticRoutes, ...dynamicRoutes]

			const sitemapEntries = allRoutes
				.map(route => {
					return `
          <url>
            <loc>${route.loc}</loc>
            <priority>${route.priority}</priority>
          </url>
        `
				})
				.join('')

			return `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          ${sitemapEntries}
        </urlset>
      `.trim()
		},
	})

	const headers = {
		'Content-Type': 'application/xml',
		'Cache-Control': 'public, max-age=600, immutable', // Cache for 10 minutes
	}

	return new Response(sitemap, {
		headers,
	})
}
