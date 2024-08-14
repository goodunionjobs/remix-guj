// app/routes/resources+/job-description.tsx
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { getJobDescription } from '#app/utils/job-descriptions.server'
import { makeTimings } from '#app/utils/timing.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const timings = makeTimings('job description loader')
	const url = new URL(request.url)
	const descripUrl = url.searchParams.get('descripUrl')

	if (!descripUrl) {
		return json({ error: 'Missing descripUrl' }, { status: 400 })
	}

	try {
		const description = await getJobDescription({ descripUrl, timings })
		return json(
			{ description },
			{
				headers: {
					'Server-Timing': timings.toString(),
				},
			},
		)
	} catch (error) {
		console.error('Error fetching job description:', error)
		return json({ error: 'Failed to fetch job description' }, { status: 500 })
	}
}
