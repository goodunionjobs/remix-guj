// app/routes/assets.company.image.$imagekey.tsx
import path from 'path'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { invariant, invariantResponse } from '@epic-web/invariant'
import { type LoaderFunction } from '@remix-run/node'

// Allowed image extensions
const allowedExtensions = ['.avif', '.webp', '.jpeg']

// Initialize the S3 client
const s3Client = new S3Client({
	region: 'auto',
	endpoint: process.env.GUJ_S3_ENDPOINT,
	credentials: {
		accessKeyId: process.env.GUJ_S3_ACCESS_KEY as string,
		secretAccessKey: process.env.GUJ_S3_SECRET_KEY as string,
	},
})

export const loader: LoaderFunction = async ({ params, request }) => {
	const { imagekey } = params

	invariantResponse(imagekey, 'Image key is required', { status: 400 })

	// Get the extension from the imagekey
	const extension = path.extname(imagekey)
	const baseImageKey = path.basename(imagekey, extension)

	// If no extension in imagekey, get it from the request URL
	const url = new URL(request.url)
	const urlExtension = path.extname(url.pathname)

	// Use the extension from the imagekey if present, otherwise use the one from URL
	const finalExtension = extension || urlExtension

	invariantResponse(
		allowedExtensions.includes(finalExtension),
		`Invalid file extension: ${finalExtension}`,
		{ status: 404 },
	)

	// Construct the S3 key
	const s3Key = `assets/company/image/${baseImageKey}${finalExtension}`

	try {
		// Fetch the image from S3
		const command = new GetObjectCommand({
			Bucket: process.env.GUJ_S3_BUCKET_NAME,
			Key: s3Key,
		})

		const response = await s3Client.send(command)

		invariant(response.Body, 'No image data received')

		// Get the image data as a Buffer
		const imageData = await response.Body.transformToByteArray()

		// Determine the content type
		const contentType =
			response.ContentType || `image/${finalExtension.slice(1)}`

		// Return the image data with appropriate headers
		return new Response(imageData, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		})
	} catch (error) {
		console.error('Error fetching image:', error)
		return new Response('Error fetching image', { status: 500 })
	}
}
