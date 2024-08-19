import { type LoaderFunction } from '@remix-run/node'
import { db } from '#app/utils/db.server'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { jobs } from '../../../drizzle/schema'

export const loader: LoaderFunction = async ({ request }) => {
	const baseUrl = getDomainUrl(request)

	const staticRoutes = [
		{ loc: `${baseUrl}/*`, priority: 0.7 },
		{ loc: `${baseUrl}/abuse`, priority: 0.7 },
		{ loc: `${baseUrl}/ccpa`, priority: 0.7 },
		{ loc: `${baseUrl}/copyright`, priority: 0.7 },
		{ loc: `${baseUrl}`, priority: 0.7 },
		{ loc: `${baseUrl}/privacy`, priority: 0.7 },
		{ loc: `${baseUrl}/support`, priority: 0.7 },
		{ loc: `${baseUrl}/tos`, priority: 0.7 },
	]

	const jobsquery = await db.select().from(jobs)

	const dynamicRoutes = jobsquery.map(job => ({
		loc: `${baseUrl}/jobs/${job.id}-${encodeURIComponent(job.title)}`,
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

	const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemapEntries}
    </urlset>
  `.trim()

	const headers = {
		'Content-Type': 'application/xml',
		'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
	}

	return new Response(sitemap, {
		headers,
	})
}
