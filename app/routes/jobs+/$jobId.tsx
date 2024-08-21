import { invariant } from '@epic-web/invariant'
import {
	type LoaderFunctionArgs,
	type MetaFunction,
	json,
} from '@remix-run/node'
import { useLoaderData, Link } from '@remix-run/react'
import { eq } from 'drizzle-orm'
import sanitizeHtml from 'sanitize-html'
import { type JobPosting, type WithContext } from 'schema-dts'
import {
	JobDescription,
	formatJobSlug,
	calculateFinalTime,
	JobHeaderDrizzle,
} from '#app/components/algolia/jobpost-parts'
import { db } from '#app/utils/db.server'
import { FindTextColor } from '#app/utils/find-text-color'
import { jobs } from '../../../drizzle/schema'
import { useTheme } from '../resources+/theme-switch'

type JobDescriptionResponse = {
	description: string
	error?: string
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	invariant(params.jobId, 'params.jobId is not defined')

	// Get the base URL from the request
	const url = new URL(request.url)
	const baseUrl = `${url.protocol}//${url.host}`
	console.log('baseurl: ', baseUrl)

	const jobIdString = params.jobId.split('-')[0]
	const jobId = parseInt(jobIdString, 10)

	if (isNaN(jobId)) {
		throw json({ error: 'Post not found' }, { status: 404 })
	}

	const job = await db.query.jobs.findFirst({
		where: eq(jobs.id, jobId),
		with: {
			address: {
				with: {
					city: true,
					state: true,
					country: true,
				},
			},
			employer: true,
		},
	})

	if (!job) {
		throw json({ error: 'Job not found' }, { status: 404 })
	}

	// Fetch job description
	const descriptionResponse = await fetch(
		`${new URL(request.url).origin}/resources/job-description?descripUrl=${encodeURIComponent(job.descripUrl)}`,
	)
	const descriptionData =
		(await descriptionResponse.json()) as JobDescriptionResponse

	if (descriptionData.error) {
		console.error('Error fetching job description:', descriptionData.error)
		throw json({ error: 'Failed to fetch job description' }, { status: 500 })
	}

	return json({ ...job, fullDescription: descriptionData.description, baseUrl })
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return [{ title: 'Oh no, there was an error!' }]
	}

	const {
		employer,
		address,
		title,
		employmentType,
		minSalary,
		maxSalary,
		payType,
		dateStamp,
		fullDescription,
	} = data

	const imageBaseUrl = `${data.baseUrl}/${employer.s3Link}`
	const imageUrls = {
		jpeg: `${imageBaseUrl}.jpeg`,
		avif: `${imageBaseUrl}.avif`,
		webp: `${imageBaseUrl}.webp`,
	}

	const jobSlug = formatJobSlug(title)

	const cleanDescription =
		sanitizeHtml(fullDescription, {
			allowedTags: [],
			allowedAttributes: {},
		}).substring(0, 300) + '...'

	const jobPostingSchema: WithContext<JobPosting> = {
		'@context': 'https://schema.org',
		'@type': 'JobPosting',
		title: title,
		description: fullDescription,
		datePosted: new Date(dateStamp).toISOString(),
		validThrough: new Date(
			new Date(dateStamp).getTime() + 30 * 24 * 60 * 60 * 1000,
		).toISOString(),
		employmentType: employmentType,
		hiringOrganization: {
			'@type': 'Organization',
			name: employer.name,
			logo: imageUrls.jpeg,
		},
		jobLocation: {
			'@type': 'Place',
			address: {
				'@type': 'PostalAddress',
				addressLocality: address.city.name,
				addressRegion: address.state.name,
				addressCountry: 'US',
			},
		},
		baseSalary: {
			'@type': 'MonetaryAmount',
			currency: 'USD',
			value: {
				'@type': 'QuantitativeValue',
				minValue: minSalary === null ? undefined : minSalary,
				maxValue: maxSalary === null ? undefined : maxSalary,
				unitText: payType === 'hr' ? 'HOUR' : 'YEAR',
			},
		},
	}

	return [
		{ title: `${title} | ${employer.name}` },
		{ name: 'description', content: cleanDescription },
		{ property: 'og:title', content: `${title} at ${employer.name}` },
		{
			property: 'og:url',
			content: `${data.baseUrl}/jobs/${data.id}-${jobSlug}`,
		},
		{ property: 'og:description', content: cleanDescription },
		{ property: 'og:image', content: imageUrls.jpeg },
		{ property: 'og:image:alt', content: `${employer.name} Logo` },
		{ property: 'og:image:type', content: 'image/jpeg' },
		{ 'script:ld+json': jobPostingSchema },
	]
}

export default function JobRoute() {
	const data = useLoaderData<typeof loader>()

	const theme = useTheme()
	const lightColor = '#FFFFFF'
	const darkColor = '#000000'
	const color = data.color
		? '#' + ('000000' + data.color.toString(16)).slice(-6)
		: theme === 'light'
			? lightColor
			: '#0f172a'

	const textColor = FindTextColor(color, lightColor, darkColor)
	const unixTimestamp = Math.floor(new Date(data.dateStamp).getTime() / 1000)
	const finalTime = calculateFinalTime(unixTimestamp)

	return (
		<div className="md:px-42 lg:px- mt-4 flex justify-center bg-white px-4 py-4 dark:bg-slate-950 sm:px-8">
			<div className="min-h-screen [width:1115px]">
				<Link
					to="/"
					className="rounded-md border-[3px] border-black px-1.5 py-1 text-sm sm:text-lg"
					style={{ background: `orangered`, color: `white` }}
				>
					← Back to Search
				</Link>
				<div className="group pt-2">
					<JobHeaderDrizzle
						color={color}
						textColor={textColor}
						employerImage={data.employer.s3Link}
						employer={data.employer.name}
						hit={data}
						finalTime={finalTime}
						url={data.url}
					/>
					<JobDescription
						url={data.url}
						baseUrl={data.baseUrl}
						description={data.fullDescription}
						objectID={data.id.toString()}
						job={formatJobSlug(data.title)}
					/>
				</div>
			</div>
		</div>
	)
}
