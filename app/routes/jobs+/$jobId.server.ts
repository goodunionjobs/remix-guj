import type { SEOHandle } from '@nasa-gcn/remix-seo'
import { type SitemapEntry } from '@nasa-gcn/remix-seo/build/types'
import { db } from '#app/utils/db.server'
import { jobs } from '../../../drizzle/schema'

export const getJobSitemapEntries = async (
	_request: Request,
): Promise<Array<SitemapEntry | null>> => {
	const jobsquery = await db.select().from(jobs)
	return jobsquery.map(job => ({
		route: `/jobs/${job.id}-${job.title}`,
		priority: 0.7,
		lastmod: job.timeStamp.toISOString(),
	}))
}

export const handle: SEOHandle = {
	getSitemapEntries: getJobSitemapEntries,
}
