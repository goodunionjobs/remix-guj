// app/utils/job-descriptions.server.ts
import { z } from 'zod'
import { cachified, cache } from '#app/utils/cache.server.ts'
import { type Timings } from '#app/utils/timing.server.ts'
import 'dotenv/config'

const jobDescriptionSchema = z.string()

export async function getJobDescription({
	descripUrl,
	timings,
}: {
	descripUrl: string
	timings?: Timings
}) {
	const description = await cachified({
		key: `job-description:${descripUrl}`,
		cache,
		timings,
		getFreshValue: async () => {
			//TODO: Remove R2 Storage domain. Retrieve through S3 api like images!
			const fullUrl = `${process.env.R2_STORAGE_DOMAIN}/${descripUrl}`
			const response = await fetch(fullUrl)
			if (!response.ok) {
				throw new Error(
					`Failed to fetch job description: ${response.statusText}`,
				)
			}
			return response.text()
		},
		checkValue: jobDescriptionSchema,
		ttl: 1000 * 60 * 60 * 24, // 24 hours
		staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7, // 7 days
	})
	return description
}
