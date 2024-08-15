// app/utils/company-images.server.ts
import { S3, GetObjectCommand } from '@aws-sdk/client-s3'
import { cachified, cache } from '#app/utils/cache.server.ts'
import { type Timings } from '#app/utils/timing.server.ts'
import 'dotenv/config'

const accessKeyId = process.env.GUJ_S3_ACCESS_KEY as string
const secretAccessKey = process.env.GUJ_S3_SECRET_KEY as string
const endpoint = process.env.GUJ_S3_ENDPOINT as string

const s3 = new S3({
	region: 'auto',
	endpoint: endpoint,
	credentials: {
		accessKeyId,
		secretAccessKey,
	},
})

export async function getCompanyImage({
	imageKey,
	timings,
}: {
	imageKey: string
	timings?: Timings
}) {
	const fullPath = `assets/company/image/${imageKey}`
	console.log('Attempting to access:', fullPath)

	const result = await cachified({
		key: `company-image:${imageKey}`,
		cache,
		timings,
		getFreshValue: async () => {
			try {
				const command = new GetObjectCommand({
					Bucket: process.env.GUJ_S3_BUCKET_NAME,
					Key: `assets/company/image/${imageKey}`,
				})

				const response = await s3.send(command)
				if (!response.Body) {
					throw new Error('Failed to fetch company image: No body in response')
				}

				const contentType = response.ContentType || 'image/jpeg' // default to JPEG if not specified

				return {
					image: await response.Body.transformToByteArray(),
					contentType,
				}
			} catch (error) {
				console.error('Error details:', JSON.stringify(error, null, 2))
				if (error.Code === 'NoSuchKey') {
					console.log(`Image not found: ${imageKey}`)
					return { image: null, contentType: 'image/jpeg' }
				}
				throw error
			}

			// const command = new GetObjectCommand({
			// 	Bucket: process.env.GUJ_S3_BUCKET_NAME,
			// 	Key: `assets/company/image/${imageKey}`,
			// })
			//
			// const response = await s3.send(command)
			// if (!response.Body) {
			// 	throw new Error('Failed to fetch company image: No body in response')
			// }
			//
			// const contentType = response.ContentType || 'image/jpeg' // default to JPEG if not specified
			//
			// return {
			// 	image: await response.Body.transformToByteArray(),
			// 	contentType,
			// }
		},
		ttl: 1000 * 60 * 60 * 24, // 24 hours
		staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7, // 7 days
	})

	return result
}
