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
import { LogoImage } from '#app/components/logo-image.tsx'
import { useMemo, useState, useEffect } from 'react'

// ... GraphQL query and interfaces remain the same ...
const GetCompanyByName = gql`
	query CompanyPageQuery($name: String!) {
		companies(where: { title: $name }) {
			id
			title
			about {
				text
			}
			whyWorkHereIntro {
				text
			}
			whyWorkHereTitleDetails {
				title
				description {
					text
				}
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
		whyWorkHereIntro: {
			text: string
		} | null
		whyWorkHereTitleDetails: Array<{
			title: string
			description: {
				text: string
			}
		}> | null
	}>
}

// ... fetchCmsData and fetchEmployerData remain the same ...
async function fetchCmsData(companyName: string, timings: Timings) {
	// Implementation unchanged
	const normalizedCompanyName = companyName.toLowerCase().trim()

	return cachified({
		key: `cms-data:${normalizedCompanyName}`,
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

				const variables = { name: normalizedCompanyName }
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

				// Prepare default data for when CMS data is not available
				const defaultData = {
					description: null,
					whyWorkHereIntro: `Working for ${companyName} provides rewarding opportunities with room for career growth.`,
					whyWorkHereTitleDetails: [
						{
							title: 'Diverse Career Paths',
							description:
								'Opportunities range from entry-level to leadership roles, with room for career growth.',
						},
						{
							title: 'Strong Job Security & Benefits',
							description:
								'Enjoy competitive pay with flexible schedules, good benefits, and long-term job security.',
						},
					],
					_debug: {
						source: 'hygraph',
						timestamp: new Date().toISOString(),
						companyFound: false,
					},
				}

				if (!company || !result.companies.length) {
					console.log('No company found in response', { companyName })
					return defaultData
				}

				return {
					description: company.about?.text || null,
					whyWorkHereIntro:
						company.whyWorkHereIntro?.text || defaultData.whyWorkHereIntro,
					whyWorkHereTitleDetails: company.whyWorkHereTitleDetails?.length
						? company.whyWorkHereTitleDetails.map(benefit => ({
								title: benefit.title,
								description: benefit.description.text,
							}))
						: defaultData.whyWorkHereTitleDetails,
					_debug: {
						source: 'hygraph',
						timestamp: new Date().toISOString(),
						companyFound: true,
						rawData: company, // Add this to help debug
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

				// Return default fallback data in case of error
				return {
					description: null,
					whyWorkHereIntro: `Working for ${companyName} provides rewarding opportunities with room for career growth.`,
					whyWorkHereTitleDetails: [
						{
							title: 'Diverse Career Paths',
							description:
								'Opportunities range from entry-level to leadership roles, with room for career growth.',
						},
						{
							title: 'Strong Job Security & Benefits',
							description:
								'Enjoy competitive pay with flexible schedules, good benefits, and long-term job security.',
						},
					],
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
		jobs: Array<
			Job & {
				address: {
					city?: { name: string } | null
					state?: { name: string } | null
					country?: { name: string } | null
				}
			}
		>
	}
	cmsData: {
		description: string | null
		whyWorkHereIntro: string
		whyWorkHereTitleDetails: Array<{
			title: string
			description: string
		}>
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

// Type definition for location filter component
type LocationGroup = {
	state: string
	cities: string[]
}

// Location filters component
function LocationFilters({
	jobs,
	onFilterChange,
}: {
	jobs: LoaderData['employer']['jobs']
	onFilterChange: (selectedCities: string[]) => void
}) {
	const [locationGroups, setLocationGroups] = useState<LocationGroup[]>([])
	const [selectedCities, setSelectedCities] = useState<string[]>([])
	const [expandedStates, setExpandedStates] = useState<string[]>([])

	// Group jobs by state and city
	useEffect(() => {
		const stateMap = new Map<string, Set<string>>()

		jobs.forEach(job => {
			if (job.address?.state?.name && job.address?.city?.name) {
				const state = job.address.state.name
				const city = job.address.city.name

				if (!stateMap.has(state)) {
					stateMap.set(state, new Set())
				}

				stateMap.get(state)?.add(city)
			}
		})

		const groups: LocationGroup[] = []
		stateMap.forEach((cities, state) => {
			groups.push({
				state,
				cities: Array.from(cities).sort(),
			})
		})

		// Sort states alphabetically
		groups.sort((a, b) => a.state.localeCompare(b.state))

		setLocationGroups(groups)

		// Auto-expand if there are only a few states
		if (groups.length <= 3) {
			setExpandedStates(groups.map(g => g.state))
		}
	}, [jobs])

	// Toggle city selection
	const toggleCity = (city: string) => {
		let newSelected: string[]

		if (selectedCities.includes(city)) {
			newSelected = selectedCities.filter(c => c !== city)
		} else {
			newSelected = [...selectedCities, city]
		}

		setSelectedCities(newSelected)
		onFilterChange(newSelected)
	}

	// Toggle state expansion
	const toggleStateExpansion = (state: string) => {
		if (expandedStates.includes(state)) {
			setExpandedStates(expandedStates.filter(s => s !== state))
		} else {
			setExpandedStates([...expandedStates, state])
		}
	}

	// Clear all filters
	const clearFilters = () => {
		setSelectedCities([])
		onFilterChange([])
	}

	return (
		<div className="mb-6">
			<div className="mb-2 flex items-center justify-between">
				<h3 className="text-lg font-semibold">Filter by Location</h3>
				{selectedCities.length > 0 && (
					<Button
						variant="outline"
						size="sm"
						onClick={clearFilters}
						className="text-xs"
					>
						Clear Filters
					</Button>
				)}
			</div>

			{selectedCities.length > 0 && (
				<div className="mb-4">
					<p className="mb-2 text-sm text-gray-500">Selected locations:</p>
					<div className="flex flex-wrap gap-2">
						{selectedCities.map(city => (
							<Button
								key={city}
								variant="secondary"
								size="sm"
								className="rounded-full text-xs"
								onClick={() => toggleCity(city)}
							>
								{city} ✕
							</Button>
						))}
					</div>
				</div>
			)}

			<div className="max-h-64 overflow-y-auto rounded-md border p-2">
				{locationGroups.length === 0 ? (
					<p className="text-center text-gray-500">
						No location data available
					</p>
				) : (
					<div className="space-y-3">
						{locationGroups.map(group => (
							<div key={group.state} className="space-y-2">
								<button
									className="flex w-full items-center justify-between text-left font-medium hover:text-blue-600"
									onClick={() => toggleStateExpansion(group.state)}
								>
									<span>{group.state}</span>
									<span>
										{expandedStates.includes(group.state) ? '−' : '+'}
									</span>
								</button>

								{expandedStates.includes(group.state) && (
									<div className="ml-4 flex flex-wrap gap-2">
										{group.cities.map(city => (
											<Button
												key={city}
												variant={
													selectedCities.includes(city) ? 'default' : 'outline'
												}
												size="sm"
												className="rounded-full px-3 py-1 text-xs"
												onClick={() => toggleCity(city)}
											>
												{city}
											</Button>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default function EmployerRoute() {
	const { employer, cmsData, pagination } = useLoaderData<LoaderData>()
	const [selectedCities, setSelectedCities] = useState<string[]>([])
	const [filteredJobs, setFilteredJobs] = useState(employer.jobs)

	// Filter jobs based on selected cities
	useEffect(() => {
		if (selectedCities.length === 0) {
			setFilteredJobs(employer.jobs)
		} else {
			const filtered = employer.jobs.filter(
				job =>
					job.address?.city?.name &&
					selectedCities.includes(job.address.city.name),
			)
			setFilteredJobs(filtered)
		}
	}, [selectedCities, employer.jobs])

	// Collect all locations for the jobs
	const jobLocations = useMemo(() => {
		const locations = new Map<string, Set<string>>()

		employer.jobs.forEach(job => {
			if (job.address?.state?.name && job.address?.city?.name) {
				const state = job.address.state.name
				if (!locations.has(state)) {
					locations.set(state, new Set())
				}
				locations.get(state)?.add(job.address.city.name)
			}
		})

		return locations
	}, [employer.jobs])

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

	// Handle email submission for job alerts
	const handleEmailSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		// Implement email subscription logic here
		// For now, we'll just show an alert
		alert('Thank you for signing up for job alerts!')
	}

	// Handle location filter changes
	const handleLocationFilterChange = (cities: string[]) => {
		setSelectedCities(cities)
	}

	// Format locationSummary for display
	const locationSummary = useMemo(() => {
		const totalStates = jobLocations.size
		const totalCities = [...jobLocations.values()].reduce(
			(sum, cities) => sum + cities.size,
			0,
		)

		if (totalStates === 0) return 'Multiple locations'

		return `${totalStates} ${totalStates === 1 ? 'state' : 'states'}, ${totalCities} ${totalCities === 1 ? 'city' : 'cities'}`
	}, [jobLocations])

	// Get company logo from s3Link
	const companyLogo = employer.s3Link || null

	return (
		<div className="flex flex-col">
			{/* Hero Section with Company Name and Logo */}
			<div className="bg-gradient-to-r from-blue-700/70 to-blue-500/70 py-10 text-white">
				<div className="container mx-auto px-4">
					<div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 md:flex-row">
            {/* TODO: On all parts using image emit an error if not found or also have backup. Not just here but everywhere */}
						{companyLogo && (
							<div className="flex-shrink-0 rounded-lg bg-white p-3">
								<LogoImage
									employerImage={employer.s3Link}
									employer={employer.name}
									size={80}
									layout="grid"
								/>
							</div>
						)}
						<div className="flex-grow">
							<h1 className="mb-3 text-3xl font-bold md:text-4xl">
								Good Union Jobs at {employer.name}
							</h1>
							<div className="flex items-center">
								<Icon name="map-pin" className="mr-2 h-4 w-4" />
								<span className="text-base">Locations: {locationSummary}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Section 1 - Why Work Here */}
			<section className="bg-white py-10 dark:bg-gray-800">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-3xl">
						<h2 className="mb-4 text-2xl font-bold">
							Why Work for {employer.name}?
						</h2>

						{cmsData.whyWorkHereIntro && (
							<div className="mb-6">
								<p className="text-base">{cmsData.whyWorkHereIntro}</p>
							</div>
						)}

						<div className="mt-6">
							<ul className="space-y-4">
								{cmsData.whyWorkHereTitleDetails?.map((benefit, index) => (
									<li key={index}>
										<h3 className="text-lg font-semibold">{benefit.title}</h3>
										<p className="text-sm text-gray-600 dark:text-gray-300">
											{benefit.description}
										</p>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* Section 2 - About the Department */}
			<section className="bg-white py-10 dark:bg-gray-800">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-3xl">
						<h2 className="mb-4 text-2xl font-bold">About {employer.name}</h2>

						<div className="prose prose-sm dark:prose-invert max-w-none">
							{cmsData.description ? (
								<div
									dangerouslySetInnerHTML={{ __html: cmsData.description }}
								/>
							) : (
								<>
									<p>
										{employer.name} is dedicated to providing quality job
										opportunities with strong union benefits. We are committed
										to fair labor practices and supporting workers' rights.
									</p>
									<p>
										Employees enjoy competitive pay, comprehensive benefits, and
										flexible work options, such as part-time, freelance, and
										hybrid remote roles, while contributing to important work in
										their field.
									</p>
									<p>
										{employer.name} offers diverse career paths with room for
										professional growth and development. Join our team to become
										part of an organization that values its employees and their
										contributions.
									</p>
								</>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Section 3 - Open Positions */}
			<section className="bg-gray-50 py-10 dark:bg-gray-900">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<h2 className="mb-4 text-2xl font-bold">
							{employer.name} Open Positions
						</h2>

						<div className="mb-6 grid gap-6 lg:grid-cols-4">
							{/* Location filters sidebar */}
							<div className="lg:col-span-1">
								<LocationFilters
									jobs={employer.jobs}
									onFilterChange={handleLocationFilterChange}
								/>
							</div>

							{/* Jobs list */}
							<div className="lg:col-span-3">
								<p className="mb-3 text-sm">
									Showing {filteredJobs.length} of {employer.jobs.length}{' '}
									positions
									{selectedCities.length > 0 &&
										` in ${selectedCities.length} selected ${selectedCities.length === 1 ? 'location' : 'locations'}`}
								</p>

								{filteredJobs.length === 0 ? (
									<div className="rounded-lg border bg-card p-6 text-center">
										<h3 className="mb-2 text-lg font-semibold">
											No jobs match your filter
										</h3>
										<p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
											Try selecting different locations or clearing your
											filters.
										</p>
									</div>
								) : (
									<div className="grid gap-3">
										{filteredJobs.map(job => (
											<Card
												key={job.id}
												className="w-full transition-shadow hover:shadow-sm"
											>
												<CardHeader className="p-4 pb-2">
													<CardTitle className="flex flex-col items-start justify-between space-y-1 text-base sm:flex-row sm:items-center sm:space-y-0">
														<span>{job.title}</span>
														<span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-normal text-blue-800 dark:bg-blue-900 dark:text-blue-200">
															{job.employmentType}
														</span>
													</CardTitle>
												</CardHeader>
												<CardContent className="p-4 pt-0 text-sm">
													<div className="grid gap-2">
														{job.address && (
															<div className="flex items-center gap-2">
																<Icon
																	name="map-pin"
																	className="h-3.5 w-3.5 text-gray-500"
																/>
																<span>
																	{job.address.city?.name || ''}
																	{job.address.city?.name ? ', ' : ''}
																	{job.address.state?.name || ''}
																	{job.address.state?.name ? ', ' : ''}
																	{job.address.country?.name || ''}
																</span>
															</div>
														)}

														{job.minSalary && job.maxSalary && job.payType && (
															<div className="flex items-center gap-2">
																<Icon
																	name="dollar-sign"
																	className="h-3.5 w-3.5 text-gray-500"
																/>
																<span>
																	{formatSalary(
																		job.minSalary,
																		job.maxSalary,
																		job.payType,
																	)}
																</span>
															</div>
														)}

														<div className="flex flex-wrap items-center gap-2">
															<Icon
																name="clock"
																className="h-3.5 w-3.5 text-gray-500"
															/>
															<span>Posted {formatDate(job.timeStamp)}</span>
															<Button
																asChild
																variant="link"
																className="justify-start p-0 text-sm"
															>
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
								)}
							</div>
						</div>

						{/* Pagination */}
						<div className="mx-auto max-w-3xl">
							<PaginationBar
								total={pagination.total}
								$top={pagination.$top}
								$skip={pagination.$skip}
							/>
						</div>

						{/* Browse All Button */}
						<div className="mt-6 flex justify-center">
							<Link to="/" prefetch="intent">
								<Button
									size="sm"
									className="bg-blue-600 px-6 text-sm hover:bg-blue-700"
								>
									Browse All Positions
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Section 4 - Sign Up for Job Alerts */}
			<section className="bg-blue-50 py-8 dark:bg-blue-900">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
						<h2 className="mb-3 text-xl font-bold">
							Sign Up for {employer.name} Job Alerts
						</h2>
						<p className="mb-4 text-sm">
							Register now and get personalized {employer.name} job postings
							delivered straight to your inbox.
						</p>

						<div className="flex flex-col space-y-3 md:flex-row md:space-x-3 md:space-y-0">
							<Link to="/kinde-auth/register">
								<Button type="submit" className="text-sm md:w-auto">
									Sign Up for Job Alerts Now
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>
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
