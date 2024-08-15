// app/routes/resources+/company-image.tsx
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { getCompanyImage } from '#app/utils/company-images.server'
import { makeTimings } from '#app/utils/timing.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const timings = makeTimings('company image loader')
	const url = new URL(request.url)
	const imageKey = url.searchParams.get('imageKey')

	if (!imageKey) {
		return json({ error: 'Missing imageKey' }, { status: 400 })
	}
	try {
		const { image, contentType } = await getCompanyImage({ imageKey, timings })
		if (!image) {
			return new Response(null, { status: 404 })
		}
		return new Response(image, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable',
				'Server-Timing': timings.toString(),
			},
		})
	} catch (error) {
		console.error('Error fetching company image:', error)
		return json({ error: 'Failed to fetch company image' }, { status: 500 })
	}
}
