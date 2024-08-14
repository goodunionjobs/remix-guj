// app/routes/_assets+/images.$key.ts
import { S3 } from '@aws-sdk/client-s3'
import type { LoaderFunctionArgs } from '@remix-run/node'

const bucketName = process.env.GUJ_S3_BUCKET_NAME as string
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

export const loader = async ({ params }: LoaderFunctionArgs) => {
	let key = params.key
	if (!key) {
		throw new Response('Not Found', { status: 404 })
	}

	// Decode the key
	key = decodeURIComponent(key)

	// Determine the format from the file extension
	const format = key.split('.').pop()?.toLowerCase() || 'jpeg'

	// Remove the file extension from the key if it exists
	const keyWithoutExtension = key.replace(/\.(avif|webp|jpeg)$/, '')

	const imagePath = `assets/company/image/${keyWithoutExtension}.${format}`

	try {
		const { Body } = await s3.getObject({
			Bucket: bucketName,
			Key: imagePath,
		})

		if (!Body) {
			throw new Response('Not Found', { status: 404 })
		}

		let buffer = await Body.transformToByteArray()

		const headers = new Headers()
		headers.set('Content-Type', `image/${format}`)
		headers.set('Cache-Control', 'public, max-age=31536000, immutable')

		return new Response(buffer, { headers })
	} catch (error) {
		console.error('Error fetching image from S3:', error)
		throw new Response('Internal Server Error', { status: 500 })
	}
}
