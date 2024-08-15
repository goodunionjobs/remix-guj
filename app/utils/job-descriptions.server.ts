// app/utils/job-descriptions.server.ts
import { S3, GetObjectCommand } from '@aws-sdk/client-s3'
import { z } from 'zod'
import { cachified, cache } from '#app/utils/cache.server.ts'
import { type Timings } from '#app/utils/timing.server.ts'
import 'dotenv/config'

const jobDescriptionSchema = z.string()

const accessKeyId = process!.env.GUJ_S3_ACCESS_KEY as string
const secretAccessKey = process!.env.GUJ_S3_SECRET_KEY as string
const endpoint = process!.env.GUJ_S3_ENDPOINT as string

const s3 = new S3({
	region: 'auto',
	endpoint: endpoint,
	credentials: {
		accessKeyId,
		secretAccessKey,
	},
})

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
			const command = new GetObjectCommand({
				Bucket: process.env.GUJ_S3_BUCKET_NAME,
				Key: descripUrl,
			})

			const response = await s3.send(command)
			if (!response.Body) {
				throw new Error('Failed to fetch job description: No body in response')
			}

			return await response.Body.transformToString()
		},
		checkValue: jobDescriptionSchema,
		ttl: 1000 * 60 * 60 * 24, // 24 hours
		staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7, // 7 days
	})

	return description
}

// const jobDescriptionSchema = z.string()
//
// export async function getJobDescription({
// 	descripUrl,
// 	timings,
// }: {
// 	descripUrl: string
// 	timings?: Timings
// }) {
// 	const description = await cachified({
// 		key: `job-description:${descripUrl}`,
// 		cache,
// 		timings,
// 		getFreshValue: async () => {
// 			//TODO: Remove R2 Storage domain. Retrieve through S3 api like images!
// 			const fullUrl = `${process.env.R2_STORAGE_DOMAIN}/${descripUrl}`
// 			const response = await fetch(fullUrl)
// 			if (!response.ok) {
// 				throw new Error(
// 					`Failed to fetch job description: ${response.statusText}`,
// 				)
// 			}
// 			return response.text()
// 		},
// 		checkValue: jobDescriptionSchema,
// 		ttl: 1000 * 60 * 60 * 24, // 24 hours
// 		staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7, // 7 days
// 	})
// 	return description
// }
