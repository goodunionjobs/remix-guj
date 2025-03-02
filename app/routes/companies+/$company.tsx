import { invariant } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { eq } from 'drizzle-orm'
import { cachified, cache } from '#app/utils/cache.server'
import { type Timings } from '#app/utils/timing.server'
import { db } from '#app/utils/db.server'
import type { InferSelectModel } from 'drizzle-orm'
import { employers, jobs } from '../../../drizzle/schema'
import { Link } from '@remix-run/react'
import { useLoaderData } from '@remix-run/react'
import { GraphQLClient, gql } from 'graphql-request'
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from '#app/components/ui/card'
import { Button } from '#app/components/ui/button.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { PaginationBar } from '#app/components/pagination.tsx'

// Updated query to match your schema
const GetCompanyByName = gql`
	query CompanyPageQuery($name: String!) {
		companies(where: { title: $name }) {
			id
			title
			about {
				text
			}
		}
	}
`

interface CompanyResponse {
	companies: Array<{
		id: string
		title: string
		about: {
			text: string
		}
	}>
}

async function fetchCmsData(companyName: string, timings: Timings) {
	return cachified({
		key: `cms-data:${companyName}`,
		cache,
		timings,
		ttl: 1000 * 60 * 60 * 24, // 24 hours
		staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7, // 7 days
		getFreshValue: async () => {
			console.log('🔍 Starting CMS data fetch for company:', companyName)
			try {
				const endpoint =
					'https://us-west-2.cdn.hygraph.com/content/cm54azrfc020507w3w8k8ofon/master'
				console.log('🌐 Initializing Hygraph client with endpoint:', endpoint)

				const hygraph = new GraphQLClient(endpoint, {
					headers: {
						Authorization: `Bearer ${process.env.HYGRAPH_BEARER_TOKEN}`,
					},
				})

				const variables = { name: companyName }
				console.log('📬 Sending GraphQL request:', {
					query: GetCompanyByName.toString(),
					variables,
				})

				const result = await hygraph.request<CompanyResponse>(
					GetCompanyByName,
					variables,
				)

				console.log('📥 Raw GraphQL response:', JSON.stringify(result, null, 2))

				const company = result.companies[0]

				return company
					? {
							description: company.about.text,
							_debug: {
								source: 'hygraph',
								timestamp: new Date().toISOString(),
								companyFound: true,
							},
						}
					: {
							description: null,
							_debug: {
								source: 'hygraph',
								timestamp: new Date().toISOString(),
								companyFound: false,
							},
						}
			} catch (error) {
				console.error('❌ Error fetching from CMS:', {
					companyName,
					errorMessage:
						error instanceof Error ? error.message : 'Unknown error',
					fullError:
						error instanceof Error
							? {
									name: error.name,
									message: error.message,
									stack: error.stack,
								}
							: error,
				})
				return {
					description: null,
					_debug: {
						source: 'hygraph',
						timestamp: new Date().toISOString(),
						error: error instanceof Error ? error.message : 'Unknown error',
					},
				}
			}
		},
		checkValue: value => value !== null && typeof value === 'object',
	})
}

// async function fetchEmployerData(companyName: string, timings: Timings) {
// 	return cachified({
// 		key: `employer-data:${companyName}`,
// 		cache,
// 		timings,
// 		getFreshValue: async () => {
// 			// const employer = await db.query.employers.findFirst({
// 			// 	where: eq(employers.name, companyName),
// 			// 	with: {
// 			// 		jobs: {
// 			// 			with: {
// 			// 				address: {
// 			// 					with: {
// 			// 						city: true,
// 			// 						state: true,
// 			// 						country: true,
// 			// 					},
// 			// 				},
// 			// 			},
// 			// 			// Order jobs by dateStamp in descending order (newest first)
// 			// 			orderBy: (jobs, { desc }) => [desc(jobs.dateStamp)],
// 			// 		},
// 			// 	},
// 			// })
// 			const employer = await db.query.employers.findFirst({
// 				where: eq(employers.name, companyName),
// 				with: {
// 					jobs: {
// 						with: {
// 							address: {
// 								with: {
// 									city: true,
// 									state: true,
// 									country: true,
// 								},
// 							},
// 						},
// 						orderBy: (jobs, { desc }) => [desc(jobs.dateStamp)],
// 					},
// 				},
// 			})
//
// 			if (!employer) throw new Error('Employer not found')
// 			return employer
// 		},
// 		checkValue: value => value !== null && typeof value === 'object',
// 		ttl: 1000 * 60 * 60, // 1 hour
// 		staleWhileRevalidate: 1000 * 60 * 60 * 24, // 1 day
// 	})
// }

async function fetchEmployerData(companyName: string, timings: Timings) {
	return cachified({
		key: `employer-data:${companyName}`,
		cache,
		timings,
		getFreshValue: async () => {
			const employer = await db.query.employers.findFirst({
				where: eq(employers.name, companyName),
				with: {
					jobs: {
						with: {
							address: {
								with: {
									city: true,
									state: true,
									country: true,
								},
							},
						},
						orderBy: (jobs, { desc }) => [desc(jobs.dateStamp)],
					},
				},
			})

			if (!employer) throw new Error('Employer not found')
			return employer
		},
		checkValue: value => value !== null && typeof value === 'object',
		ttl: 1000 * 60 * 60, // 1 hour
		staleWhileRevalidate: 1000 * 60 * 60 * 24, // 1 day
	})
}

type Employer = InferSelectModel<typeof employers>
type Job = InferSelectModel<typeof jobs>

type LoaderData = {
	employer: Employer & {
		jobs: Array<Job>
	}
	cmsData: {
		description: string | null
	}
	pagination: {
		total: number
		currentPage: number
		totalPages: number
		$top: number
		$skip: number
	}
	baseUrl: string
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	invariant(params.company, 'Company name is required')

	const url = new URL(request.url)
	const baseUrl = `${url.protocol}//${url.host}`

	// Changed to 10 jobs per page
	const $top = Number(url.searchParams.get('$top')) || 10
	const $skip = Number(url.searchParams.get('$skip')) || 0

	const timings: Timings = {}

	try {
		const [employer, cmsData] = await Promise.all([
			fetchEmployerData(params.company, timings),
			fetchCmsData(params.company, timings),
		])

		// Calculate pagination details
		const total = employer.jobs.length
		const totalPages = Math.ceil(total / $top)
		const currentPage = Math.floor($skip / $top) + 1

		// Slice the jobs array for the current page
		const paginatedJobs = employer.jobs.slice($skip, $skip + $top)

		// Create the final employer object with paginated jobs
		const paginatedEmployer = {
			...employer,
			jobs: paginatedJobs,
		}

		const data: LoaderData = {
			employer: paginatedEmployer,
			cmsData,
			pagination: {
				total,
				currentPage,
				totalPages,
				$top,
				$skip,
			},
			baseUrl,
		}

		return json(data)
	} catch (error) {
		console.error('Error in employer loader:', error)

		if (error instanceof Error && error.message === 'Employer not found') {
			throw json({ message: 'Employer not found' }, { status: 404 })
		}

		throw json({ message: 'An unexpected error occurred' }, { status: 500 })
	}
}

export default function EmployerRoute() {
	const { employer, cmsData, pagination } = useLoaderData<LoaderData>()

	const formatSalary = (
		min: number | null,
		max: number | null,
		type: 'hr' | 'yr' | 'mo' | null,
	) => {
		if (!min || !max || !type) return null

		const format = (num: number) =>
			new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
				maximumFractionDigits: 0,
			}).format(num)

		const period = type === 'yr' ? '/year' : type === 'hr' ? '/hour' : '/month'
		return `${format(min)} - ${format(max)}${period}`
	}

	const formatDate = (dateString: Date | string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	}

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Employer Header */}
			<div className="mb-8">
				<div className="mb-4 flex items-center gap-4">
					{/* <Building2 className="h-8 w-8" /> */}
					<h1 className="text-3xl font-bold">{employer.name}</h1>
				</div>
				{employer.originalLink && (
					<a
						href={employer.originalLink}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 hover:underline"
					>
						Visit Company Website
					</a>
				)}
			</div>
			{/* Company Description from CMS or Default */}
			<div className="mb-6 text-gray-700">
				{cmsData.description ? (
					<p className="prose max-w-none">{cmsData.description}</p>
				) : (
					<p className="prose max-w-none">
						{employer.name} is actively hiring for various positions. Browse
						through their current job openings below to find opportunities that
						match your skills and experience.
					</p>
				)}
			</div>

			{/* Jobs List */}
			<div className="mb-8 grid gap-4">
				{employer.jobs.map(job => (
					<Card
						key={job.id}
						className="w-full transition-shadow hover:shadow-md"
					>
						<CardHeader>
							<CardTitle className="flex items-start justify-between">
								<span>{job.title}</span>
								<span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-normal text-blue-800">
									{job.employmentType}
								</span>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4">
								{job && (
									<div className="flex items-center gap-2">
										{/* <MapPin className="h-4 w-4 text-gray-500" /> */}
										<span>
											{/* {job.address.city?.name}, {job.address.state?.name},{' '} */}
											{/* {job.address.country?.name} */}
										</span>
									</div>
								)}

								{job.minSalary && job.maxSalary && job.payType && (
									<div className="flex items-center gap-2">
										{/* <BriefcaseIcon className="h-4 w-4 text-gray-500" /> */}
										<span>
											{formatSalary(job.minSalary, job.maxSalary, job.payType)}
										</span>
									</div>
								)}

								<div className="flex items-center gap-2">
									{/* <CalendarIcon className="h-4 w-4 text-gray-500" /> */}
									{/* <span>Posted {formatDate(job.timeStamp)}</span> */}
									<span>Posted {formatDate(job.timeStamp)}</span>
									<Button asChild variant="link" className="justify-start p-0">
										<Link to={`/jobs/${job.id}`} prefetch="intent">
											View Job Details
										</Link>
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Pagination */}
			<PaginationBar
				total={pagination.total}
				$top={pagination.$top}
				$skip={pagination.$skip}
			/>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				400: () => (
					<div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
						<div className="w-full max-w-md space-y-8">
							<div className="text-center">
								<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
									Invalid Company ID
								</h2>
								<p className="mt-2 text-2xl text-gray-600">
									The company ID you've entered is not in the correct format.
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
									Company Page Not Found
								</h2>
								<p className="mt-2 text-2xl text-gray-600">
									The company post you're looking for doesn't exist or has been
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
