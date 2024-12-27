import { invariant, invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { eq } from 'drizzle-orm'
import { cachified, cache } from '#app/utils/cache.server'
import { type Timings } from '#app/utils/timing.server'
import { db } from '#app/utils/db.server'
import type { InferSelectModel } from 'drizzle-orm'
import { employers, jobs } from '../../../drizzle/schema'
import { useSearchParams } from '@remix-run/react'
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
	console.log('🔍 Starting CMS data fetch for company:', companyName)

	try {
		const endpoint =
			'https://us-west-2.cdn.hygraph.com/content/cm54azrfc020507w3w8k8ofon/master'
		console.log('🌐 Initializing Hygraph client with endpoint:', endpoint)

		const hygraph = new GraphQLClient(endpoint, {
			headers: {
				Authorization:
					'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImdjbXMtbWFpbi1wcm9kdWN0aW9uIn0.eyJ2ZXJzaW9uIjozLCJpYXQiOjE3MzUxODE5NjMsImF1ZCI6WyJodHRwczovL2FwaS11cy13ZXN0LTIuaHlncmFwaC5jb20vdjIvY201NGF6cmZjMDIwNTA3dzN3OGs4b2Zvbi9tYXN0ZXIiLCJtYW5hZ2VtZW50LW5leHQuZ3JhcGhjbXMuY29tIl0sImlzcyI6Imh0dHBzOi8vbWFuYWdlbWVudC11cy13ZXN0LTIuaHlncmFwaC5jb20vIiwic3ViIjoiNzBhZWUxMWMtODlkNi00NTMwLTgwMWQtYzNkMjdhMTRkOTE5IiwianRpIjoiY201NHFqZnNhMGlvODA3bG8wdGxjYnR5MiJ9.UdMZrtZ6P2-3xQd-7ErIwYkauzse0Pvf3rsCQ-6U00Ztuv3FFX1vn7hkA-vf72KQEpnVU2P9BqPm6LTmWS9i-FR3fsMtIbTohmUIlu8OEtx2_n3OUr7eZBdsrodQqr7_risoykuT3byBP2c1fe7sVamp43a3gJhv8MyCskKFRZAMOqDWTX-o5AtgljslHEks4Ao3xMT9UT9W78GLacM-hKRre6IfVEgUAnPxtBI_5KuXdrQeo64pZSFQPqRPKlNGoTqxpRqgdsMBURop5O3ETh4UUgxeAI-PmUJpYnY9WmOCD8PPlmEZFCeriPizToS2V3KcLONSTnzTu_wJ1SPVH5WQRYoISIYRo39raZ8fSv0bASPhwnU6v2SWbtkmeNbvGTmLSGHrfIxY77aeKIHjBB6OxfDTCWsc7s7rzvAJiLRsVwAdXTcZTkRKOu8CTP6E1DK35jfpFRgNRHgpBv-lgMlrudXlUiYkG4b1Wc_C8_TQ7lkmUYuOGpNI3L29ERNnnkasl9yNq18gKTQz5kOqEd7FPx70nLx_eWJf1kKL_7djYGkYJOiJWnkKUOH3cOF-Z1Y-5NmpM2_rHfscTOGOsnGlBwMmv6nO4lQ8AapLHQw0iPebfJtF2X-gdhJclaZE3p-8w7WcrepAuBEziirprQBRYhlP2EdxaQu2S1_23Lc',
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
			errorMessage: error instanceof Error ? error.message : 'Unknown error',
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
}

// Helper function to set search params while preserving existing ones
function setSearchParamsString(
	searchParams: URLSearchParams,
	changes: Record<string, string | number | undefined>,
) {
	const newSearchParams = new URLSearchParams(searchParams)
	for (const [key, value] of Object.entries(changes)) {
		if (value === undefined) {
			newSearchParams.delete(key)
			continue
		}
		newSearchParams.set(key, String(value))
	}
	return Array.from(newSearchParams.entries())
		.map(([key, value]) =>
			value ? `${key}=${encodeURIComponent(value)}` : key,
		)
		.join('&')
}

async function fetchEmployerData(companyName: string, timings: Timings) {
	return cachified({
		key: `employer-data:${companyName}`,
		cache,
		timings,
		getFreshValue: async () => {
			// const employer = await db.query.employers.findFirst({
			// 	where: eq(employers.name, companyName),
			// 	with: {
			// 		jobs: {
			// 			with: {
			// 				address: {
			// 					with: {
			// 						city: true,
			// 						state: true,
			// 						country: true,
			// 					},
			// 				},
			// 			},
			// 			// Order jobs by dateStamp in descending order (newest first)
			// 			orderBy: (jobs, { desc }) => [desc(jobs.dateStamp)],
			// 		},
			// 	},
			// })
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

// Updated PaginationBar to handle dynamic maxPages
export function PaginationBar({
	total,
	$top,
	$skip,
}: {
	total: number
	$top: number
	$skip: number
}) {
	const [searchParams] = useSearchParams()
	const totalPages = Math.ceil(total / $top)
	const currentPage = Math.floor($skip / $top) + 1

	// Calculate maxPages based on total pages
	const pageNumbers = [] as Array<number>

	// Show all page numbers if there are fewer than 7 pages
	if (totalPages <= 7) {
		for (let i = 1; i <= totalPages; i++) {
			pageNumbers.push(i)
		}
	} else {
		// Always show first page
		pageNumbers.push(1)

		// Calculate range around current page
		let rangeStart = currentPage - 2
		let rangeEnd = currentPage + 2

		// Adjust range if it's too close to the beginning
		if (rangeStart <= 2) {
			rangeStart = 2
			rangeEnd = 6
		}

		// Adjust range if it's too close to the end
		if (rangeEnd >= totalPages - 1) {
			rangeStart = totalPages - 5
			rangeEnd = totalPages - 1
		}

		// Add ellipsis if there's a gap after 1
		if (rangeStart > 2) {
			pageNumbers.push(-1) // -1 represents ellipsis
		}

		// Add range numbers
		for (let i = rangeStart; i <= rangeEnd; i++) {
			pageNumbers.push(i)
		}

		// Add ellipsis if there's a gap before last page
		if (rangeEnd < totalPages - 1) {
			pageNumbers.push(-2) // -2 represents ellipsis
		}

		// Always show last page
		pageNumbers.push(totalPages)
	}

	const canPageBackwards = $skip > 0
	const canPageForwards = $skip + $top < total

	return (
		<div className="flex items-center gap-1">
			<Button size="sm" variant="outline" asChild disabled={!canPageBackwards}>
				<Link
					to={{
						search: setSearchParamsString(searchParams, {
							$skip: 0,
						}),
					}}
					preventScrollReset
					prefetch="intent"
					className="text-neutral-600"
				>
					{/* <Icon name="double-arrow-left" /> */}
					{'<<'}
					<span className="sr-only">First page</span>
				</Link>
			</Button>

			{pageNumbers.map((pageNumber, index) => {
				// Handle ellipsis
				if (pageNumber < 0) {
					return (
						<span key={`ellipsis-${index}`} className="px-2 text-neutral-600">
							...
						</span>
					)
				}

				const pageSkip = (pageNumber - 1) * $top
				const isCurrentPage = pageNumber === currentPage

				if (isCurrentPage) {
					return (
						<Button
							key={`${pageNumber}-active`}
							size="sm"
							variant="ghost"
							className="grid min-w-[2rem] place-items-center bg-neutral-200 text-sm text-black"
						>
							<div>
								<span className="sr-only">Page {pageNumber}</span>
								<span>{pageNumber}</span>
							</div>
						</Button>
					)
				}

				return (
					<Button key={pageNumber} size="sm" variant="ghost" asChild>
						<Link
							to={{
								search: setSearchParamsString(searchParams, {
									$skip: pageSkip,
								}),
							}}
							preventScrollReset
							prefetch="intent"
							className="min-w-[2rem] font-normal text-neutral-600"
						>
							{pageNumber}
						</Link>
					</Button>
				)
			})}

			<Button size="sm" variant="outline" asChild disabled={!canPageForwards}>
				<Link
					to={{
						search: setSearchParamsString(searchParams, {
							$skip: $skip + $top,
						}),
					}}
					preventScrollReset
					prefetch="intent"
					className="text-neutral-600"
				>
					{/* <Icon name="arrow-right" /> */}
					{'>>'}
					<span className="sr-only">Next page</span>
				</Link>
			</Button>
		</div>
	)
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

	const formatDate = (dateString: Date) => {
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
					<Card key={job.id} className="w-full">
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
									<span>Posted {job.timeStamp}</span>
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
