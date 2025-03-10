import { invariant, invariantResponse } from '@epic-web/invariant'
import {
	type LoaderFunctionArgs,
	type MetaFunction,
	json,
} from '@remix-run/node'
import { useLoaderData, Link } from '@remix-run/react'
import slugify from '@sindresorhus/slugify'
import DOMPurify from 'isomorphic-dompurify'
import { eq } from 'drizzle-orm'
import { type JobPosting, type WithContext } from 'schema-dts'
import {
	JobDescription,
	calculateFinalTime,
	JobHeaderDrizzle,
} from '#app/components/algolia/jobpost-parts'
import { db } from '#app/utils/db.server'
import { FindTextColor } from '#app/utils/find-text-color'
import { jobs } from '../../../drizzle/schema'
import { useTheme } from '../resources+/theme-switch'
import { cachified, cache } from '#app/utils/cache.server.ts'
import { type Timings } from '#app/utils/timing.server.ts'
import { GeneralErrorBoundary } from '#app/components/error-boundary'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

type JobDescriptionResponse = {
	description: string
	error?: string
}

async function fetchJobData(jobId: number, timings: Timings) {
	return cachified({
		key: `job-data:${jobId}`,
		cache,
		timings,
		getFreshValue: async () => {
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
					industries: {
						with: {
							industry: true,
						},
					},
					jobFunctions: {
						with: {
							jobFunction: true,
						},
					},
				},
			})
			if (!job) throw new Error('Job post not found')
			return job
		},
		checkValue: value => value !== null && typeof value === 'object',
		ttl: 1000 * 60 * 60, // 1 hour
		staleWhileRevalidate: 1000 * 60 * 60 * 24, // 1 day
	})
}

async function fetchDescription(url: string, timings: Timings) {
	return cachified({
		key: `job-description:${url}`,
		cache,
		timings,
		getFreshValue: async () => {
			const response = await fetch(url)
			if (!response.ok) throw new Error('Failed to fetch job description')
			const data = (await response.json()) as JobDescriptionResponse
			if (data.error) throw new Error(data.error)
			return data.description
		},
		checkValue: value => typeof value === 'string',
		ttl: 1000 * 60 * 60 * 24, // 1 day
		staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7, // 1 week
	})
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	invariant(params.jobId, 'params.jobId is not defined')

	// Get the base URL from the request
	const url = new URL(request.url)
	const baseUrl = `${url.protocol}//${url.host}`

	const jobIdString = params.jobId.split('-')[0]
	const jobId = parseInt(jobIdString, 10)

	invariantResponse(!isNaN(jobId), 'Bad Request')

	const timings: Timings = {}

	try {
		const job = await fetchJobData(jobId, timings)
		const fullDescription = await fetchDescription(
			`${url.origin}/resources/job-description?descripUrl=${encodeURIComponent(job.descripUrl)}`,
			timings,
		)

		return json({ ...job, fullDescription, baseUrl })
	} catch (error) {
		console.error('Error in loader:', error)
		//TODO: Fixup. Don't make it just 404... Could sometimes be due to something else
		if (error instanceof Error) {
			throw json({ message: 'Job post not found' }, { status: 404 })
		}
		throw json({ message: 'An unexpected error occurred' }, { status: 500 })
	}
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return [{ title: 'Oh no, there was an error!' }]
	}

	const {
		id,
		industries,
		jobFunctions,
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

	const jobSlug = slugify(title)

	function cleanAndTruncateDescription(
		fullDescription: string,
		maxLength: number = 250,
	): string {
		// Sanitize the HTML
		const sanitizedHtml = DOMPurify.sanitize(fullDescription, {
			ALLOWED_TAGS: [], // Remove all HTML tags
			ALLOWED_ATTR: [], // Remove all attributes
		})

		// Truncate the text and add ellipsis if necessary
		if (sanitizedHtml.length <= maxLength) {
			return sanitizedHtml
		} else {
			return sanitizedHtml.substring(0, maxLength).trim() + '...'
		}
	}

	//TODO: Put this with other same one in utils later and export
	function formatSalaryInThousands(
		salary: number,
		withYearSuffix: boolean = false,
	): string {
		// Round to the nearest thousand
		const roundedSalary = Math.round(salary / 1000)

		// Format with dollar sign and add 'K' or '/y' suffix based on the flag
		if (withYearSuffix) {
			return `$${roundedSalary}K/y`
		}

		return `$${roundedSalary}K`
	}

	// Adds company and salary to beginning for description
	let finalDescrip = `${employer.name} is hiring in ${address.state.name}, ${address.city.name}.`

	let twitterSalary: undefined | string
	if (minSalary !== null) {
		const salaryDescrip = formatSalaryInThousands(minSalary)
		twitterSalary = formatSalaryInThousands(minSalary, true) // Remove 'K' and add '/y'
		//TODO: Fix that we add dot for both finaldscript and salary
		finalDescrip = `${finalDescrip}(💰~${salaryDescrip}).`
	}

	finalDescrip = `${finalDescrip}${fullDescription.trimStart()}`

	const cleanDescription = cleanAndTruncateDescription(finalDescrip)

	const ogImageUrl = new URL(
		`${data.baseUrl}/jobs/ogimage/${data.id}-${jobSlug}`,
	)

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
			logo: ogImageUrl.toString(), // Use the new OG image URL
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
		identifier: {
			'@type': 'PropertyValue',
			name: 'Good Union Jobs',
			value: id.toString(),
		},
		industry: industries.map(ind => ind.industry.label).join(', '),
		occupationalCategory: jobFunctions
			.map(jobfn => jobfn.jobFunction.description)
			.join(', '),
		applicantLocationRequirements: {
			'@type': 'Country',
			name: 'United States',
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
		{
			tagName: 'link',
			rel: 'canonical',
			href: `${data.baseUrl}/jobs/${data.id}-${jobSlug}`,
		},
		{ title: `${title} | ${employer.name}` },
		{ name: 'description', content: cleanDescription },
		{ property: 'robots', content: 'index,follow' },
		{ property: 'og:title', content: `${title} at ${employer.name}` },
		{
			property: 'og:url',
			content: `${data.baseUrl}/jobs/${data.id}-${jobSlug}`,
		},
		{ property: 'og:description', content: cleanDescription },
		{ property: 'og:image', content: ogImageUrl.toString() },
		{
			property: 'og:image:alt',
			content: `Job posting for ${title} at ${employer.name}`,
		},
		{ property: 'og:image:type', content: 'image/png' },
		{ property: 'og:image:width', content: '1200' },
		{ property: 'og:image:height', content: '630' },
		{ property: 'twitter:card', content: 'summary_large_image' },
		{ property: 'twitter:site', content: '@goodunionjobs' },
		{ property: 'twitter:title', content: `${title} at ${employer.name}` },
		{ property: 'twitter:description', content: cleanDescription },
		{ property: 'twitter:image', content: ogImageUrl.toString() },
		{ property: 'twitter:label2', value: 'Salary' },
		{
			property: 'twitter:data2',
			content: twitterSalary === undefined ? '' : twitterSalary,
		},
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
						job={slugify(data.title)}
					/>
				</div>
			</div>
		</div>
	)
}

//TODO: Redirect jobs/ without anything after as 301 back to home page

//TODO: Add job application disclaimer. Look at writeup and put it in searches when pulling data
export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				400: () => (
					<div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
						<div className="w-full max-w-md space-y-8">
							<div className="text-center">
								<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
									Invalid Job ID
								</h2>
								<p className="mt-2 text-2xl text-gray-600">
									The job ID you've entered is not in the correct format.
								</p>
							</div>
							<div className="mt-8 space-y-6">
								<div className="flex justify-center">
									<Button asChild>
										<Link to="/" reloadDocument>
											<Icon className="mr-2 h-4 w-4" name="home" />
											Go back home
										</Link>
									</Button>
								</div>
							</div>
						</div>
					</div>
				),
				404: () => (
					<div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
						<div className="w-full max-w-md space-y-8">
							<div className="text-center">
								<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
									Job Post Not Found
								</h2>
								<p className="mt-2 text-2xl text-gray-600">
									The job post you're looking for doesn't exist or has been
									removed.
								</p>
							</div>
							<div className="mt-8 space-y-6">
								<div className="flex justify-center">
									<Button asChild>
										<Link to="/" reloadDocument>
											<Icon className="mr-2 h-4 w-4" name="home" />
											Go back home
										</Link>
									</Button>
								</div>
							</div>
						</div>
					</div>
				),
			}}
		/>
	)
}
