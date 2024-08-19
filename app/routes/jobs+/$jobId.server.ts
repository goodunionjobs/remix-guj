// TODO: Doesn't work exporting handle from here
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { type SitemapEntry } from '@nasa-gcn/remix-seo/build/types'
import { serverOnly$ } from 'vite-env-only/macros'
import { db } from '#app/utils/db.server'
import { jobs } from '../../../drizzle/schema'

function escapeXml(unsafe: string): string {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

export const handle: SEOHandle = {
	getSitemapEntries: serverOnly$(
		async (_request: Request): Promise<Array<SitemapEntry | null>> => {
			const jobsquery = await db.select().from(jobs)
			return jobsquery.map(job => ({
				route: `/jobs/${job.id}-${escapeXml(job.title)}`,
				priority: 0.7,
				lastmod: job.timeStamp.toISOString(),
			}))
		},
	),
}
