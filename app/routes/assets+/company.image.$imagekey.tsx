import type { LoaderFunction } from '@remix-run/node'

export const loader: LoaderFunction = async ({ request, params }) => {
	const { imagekey } = params
	const url = new URL(request.url)

	if (!imagekey) {
		throw new Response('Image key not provided', { status: 400 })
	}

	// Use the correct Cloudflare Workers URL based on the environment
	const workerUrl =
		process.env.NODE_ENV === 'development'
			? `http://localhost:8787/assets/company/image/${imagekey}`
			: `https://r2-images-cache${url.hostname === 'goodunionjobs' ? '' : '-staging'}.goodunionjobs.workers.dev/assets/company/image/${imagekey}`

	try {
		const response = await fetch(workerUrl)

		if (!response.ok) {
			console.log('here')
			return new Response(
				`Image not found, here is workerUrl ${workerUrl} and here is request: ${url.hostname}`,
				{
					status: 404,
				},
			)
		}

		// Forward the body and headers from the worker response
		const body = await response.arrayBuffer() // Buffer the image to send as binary
		const headers = new Headers(response.headers) // Forward all headers

		return new Response(body, {
			headers, // Use the headers set by the Cloudflare Worker
		})
	} catch (error) {
		console.error('Error fetching image:', error)
		return new Response('Error fetching image', { status: 500 })
	}
}
