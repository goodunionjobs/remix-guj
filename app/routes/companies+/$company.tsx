import { invariant } from '@epic-web/invariant'
import {
	type LoaderFunctionArgs,
	type MetaFunction,
	json,
} from '@remix-run/node'
import { sql } from 'drizzle-orm'
import { cachified, cache } from '#app/utils/cache.server'
import { type Timings } from '#app/utils/timing.server'
import { db } from '#app/utils/db.server'
import type { InferSelectModel } from 'drizzle-orm'
import { employers, jobs } from '../../../drizzle/schema'
import { Link } from '@remix-run/react'
import { useLoaderData } from '@remix-run/react'
import { GraphQLClient, gql } from 'graphql-request'
import { Button } from '#app/components/ui/button.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { PaginationBar } from '#app/components/pagination'
import { LogoImage } from '#app/components/logo-image.tsx'
import { useMemo, useState, useEffect } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import slugify from '@sindresorhus/slugify'
import {
	JobHeaderDrizzle,
	calculateFinalTime,
} from '#app/components/algolia/jobpost-parts.tsx'
import { useTheme } from '../resources+/theme-switch'
import { FindTextColor } from '#app/utils/find-text-color'

// Meta function (unchanged)
export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{
			title: `Good Union Jobs - Find ${data?.employer.name} Opportunities`,
		},
		{
			name: 'description',
			content: `Explore union job opportunities at ${data?.employer.name}. GoodUnionJobs offers daily updated job postings with union benefits across various industries nationwide.`,
		},
		{
			name: 'keywords',
			content: `${data?.employer.name}, union jobs, job opportunities, career, employment, benefits`,
		},
	]
}

// GraphQL query using html fields
const GetCompanyByName = gql`
	query CompanyPageQuery($name: String!) {
		companies(where: { title: $name }) {
			id
			title
			about {
				html
			}
			whyWorkHereIntro {
				html
			}
			whyWorkHereTitleDetails {
				title
				description {
					html
				}
			}
			updatedAt
		}
	}
`

interface CompanyResponse {
	companies: Array<{
		id: string
		title: string
		about: { html: string }
		whyWorkHereIntro: { html: string } | null
		whyWorkHereTitleDetails: Array<{
			title: string
			description: { html: string }
		}> | null
		updatedAt: string
	}>
}

async function fetchCmsData(companyName: string, timings: Timings) {
	const normalizedCompanyName = companyName
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ')
	console.log('🔍 CMS: Starting fetch for:', normalizedCompanyName)

	return cachified({
		key: `cms-data:${normalizedCompanyName}`,
		cache,
		timings,
		ttl: 1000 * 60 * 60 * 24,
		staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7,
		getFreshValue: async context => {
			try {
				const endpoint =
					'https://us-west-2.cdn.hygraph.com/content/cm54azrfc020507w3w8k8ofon/master'
				const hygraph = new GraphQLClient(endpoint, {
					headers: {
						Authorization: `Bearer ${process.env.HYGRAPH_BEARER_TOKEN}`,
					},
				})

				const variables = { name: normalizedCompanyName }
				const result = await hygraph.request<CompanyResponse>(
					GetCompanyByName,
					variables,
				)

				const company = result.companies[0]
				if (!company || !result.companies.length) {
					return {
						description: null,
						whyWorkHereIntro: `<p>Working for ${companyName} provides rewarding opportunities with room for career growth.</p>`,
						whyWorkHereTitleDetails: [
							{
								title: 'Diverse Career Paths',
								description:
									'<p>Opportunities range from entry-level to leadership roles, with room for career growth.</p>',
							},
							{
								title: 'Strong Job Security & Benefits',
								description:
									'<p>Enjoy competitive pay with flexible schedules, good benefits, and long-term job security.</p>',
							},
						],
						_debug: {
							source: 'hygraph',
							timestamp: new Date().toISOString(),
							companyFound: false,
							cacheStatus: 'fresh',
							rawResponse: result,
						},
					}
				}

				const updatedAt = new Date(company.updatedAt)
				const now = new Date()
				const timeSinceUpdate = now.getTime() - updatedAt.getTime()
				const baseTtl = 1000 * 60 * 60 * 24
				const ttl = Math.max(baseTtl - timeSinceUpdate, 1000 * 60)
				const swr =
					timeSinceUpdate < 1000 * 60 * 60
						? 1000 * 60 * 60
						: 1000 * 60 * 60 * 24 * 7

				context.metadata = { ttl, swr, createdTime: now.getTime() }

				return {
					description: company.about?.html || null,
					whyWorkHereIntro:
						company.whyWorkHereIntro?.html ||
						`<p>Working for ${companyName} provides rewarding opportunities with room for career growth.</p>`,
					whyWorkHereTitleDetails: company.whyWorkHereTitleDetails?.length
						? company.whyWorkHereTitleDetails.map(benefit => ({
								title: benefit.title,
								description: benefit.description.html,
							}))
						: [
								{
									title: 'Diverse Career Paths',
									description:
										'<p>Opportunities range from entry-level to leadership roles, with room for career growth.</p>',
								},
								{
									title: 'Strong Job Security & Benefits',
									description:
										'<p>Enjoy competitive pay with flexible schedules, good benefits, and long-term job security.</p>',
								},
							],
					_debug: {
						source: 'hygraph',
						timestamp: new Date().toISOString(),
						companyFound: true,
						cacheStatus: 'fresh',
						rawResponse: result,
						updatedAt: company.updatedAt,
						calculatedTtl: ttl,
						calculatedSwr: swr,
					},
				}
			} catch (error) {
				console.error(
					'❌ CMS Error:',
					error instanceof Error ? error.message : error,
				)
				return {
					description: null,
					whyWorkHereIntro: `<p>Working for ${companyName} provides rewarding opportunities with room for career growth.</p>`,
					whyWorkHereTitleDetails: [
						{
							title: 'Diverse Career Paths',
							description:
								'<p>Opportunities range from entry-level to leadership roles, with room for career growth.</p>',
						},
						{
							title: 'Strong Job Security & Benefits',
							description:
								'<p>Enjoy competitive pay with flexible schedules, good benefits, and long-term job security.</p>',
						},
					],
					_debug: {
						source: 'hygraph',
						timestamp: new Date().toISOString(),
						error: error instanceof Error ? error.message : 'Unknown error',
						cacheStatus: 'fresh',
					},
				}
			}
		},
		checkValue: value => value !== null && typeof value === 'object',
	})
}

async function fetchEmployerData(companyName: string, timings: Timings) {
	const normalizedCompanyName = companyName
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ')
	console.log('🔍 DB: Querying employer:', normalizedCompanyName)

	return cachified({
		key: `employer-data:${normalizedCompanyName}`,
		cache,
		timings,
		ttl: 1000 * 60 * 60,
		staleWhileRevalidate: 1000 * 60 * 60 * 24,
		getFreshValue: async () => {
			const employer = await db.query.employers.findFirst({
				where: sql`lower(${employers.name}) = ${normalizedCompanyName}`,
				with: {
					jobs: {
						with: {
							address: {
								with: { city: true, state: true, country: true },
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
	})
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	invariant(params.company, 'Company name is required')

	// Extract ID from the URL parameter (format: "123-company-name")
	const match = params.company.match(/^(\d+)-(.+)$/)
	if (!match) {
		throw json({ message: 'Invalid company ID format' }, { status: 400 })
	}

	const companyId = parseInt(match[1], 10)
	if (isNaN(companyId)) {
		throw json({ message: 'Invalid company ID' }, { status: 400 })
	}

	const url = new URL(request.url)
	const baseUrl = `${url.protocol}//${url.host}`
	const $top = Number(url.searchParams.get('$top')) || 10
	const $skip = Number(url.searchParams.get('$skip')) || 0

	const timings: Timings = {}

	try {
		// Find employer by ID
		const employer = await db.query.employers.findFirst({
			where: sql`${employers.id} = ${companyId}`,
			with: {
				jobs: {
					with: {
						address: {
							with: { city: true, state: true, country: true },
						},
					},
					orderBy: (jobs, { desc }) => [desc(jobs.dateStamp)],
				},
			},
		})

		if (!employer) {
			throw new Error('Employer not found')
		}

		// Fetch CMS data using the actual employer name
		const cmsData = await fetchCmsData(employer.name, timings)

		const total = employer.jobs.length
		const totalPages = Math.ceil(total / $top)
		const currentPage = Math.floor($skip / $top) + 1
		const paginatedJobs = employer.jobs.slice($skip, $skip + $top)

		const paginatedEmployer = { ...employer, jobs: paginatedJobs }

		const data: LoaderData = {
			employer: paginatedEmployer,
			cmsData,
			pagination: { total, currentPage, totalPages, $top, $skip },
			baseUrl,
		}

		return json(data)
	} catch (error) {
		console.error('❌ Loader Error:', error)
		if (error instanceof Error && error.message === 'Employer not found') {
			throw json({ message: 'Employer not found' }, { status: 404 })
		}
		throw json({ message: 'An unexpected error occurred' }, { status: 500 })
	}
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

	const theme = useTheme()
	const displayName = employer.name || ''
	const companyLogo = employer.s3Link || null

	// Sanitize HTML content with DOMPurify
	const sanitizedDescription = cmsData.description
		? DOMPurify.sanitize(cmsData.description, {
				ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
				ALLOWED_ATTR: ['href', 'target'],
			})
		: null
	const sanitizedWhyWorkHereIntro = DOMPurify.sanitize(
		cmsData.whyWorkHereIntro,
		{
			ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
			ALLOWED_ATTR: ['href', 'target'],
		},
	)
	const sanitizedWhyWorkHereDetails = cmsData.whyWorkHereTitleDetails.map(
		benefit => ({
			...benefit,
			description: DOMPurify.sanitize(benefit.description, {
				ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
				ALLOWED_ATTR: ['href', 'target'],
			}),
		}),
	)

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

	return (
		<div className="flex flex-col">
			{/* Hero Section */}
			<header className="bg-gradient-to-r from-blue-700/70 to-blue-500/70 py-10 text-white">
				<div className="container mx-auto px-4">
					<div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 md:flex-row">
						{companyLogo && (
							<LogoImage
								employerImage={employer.s3Link}
								employer={displayName}
								size={80}
								layout="grid"
							/>
						)}
						<div className="flex-grow">
							<h1
								className="mb-3 text-3xl font-bold md:text-4xl"
								itemProp="name"
							>
								Good Union Jobs at {displayName}
							</h1>
							<div className="flex items-center" itemProp="jobLocation">
								<Icon name="map-pin" className="mr-2 h-4 w-4" />
								<span className="text-base">Locations: {locationSummary}</span>
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Why Work Here Section */}
			<section
				className="bg-white py-10 dark:bg-gray-800"
				itemScope
				itemType="https://schema.org/Organization"
			>
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-3xl">
						<h2 className="mb-4 text-2xl font-bold" itemProp="name">
							Why Work for {displayName}?
						</h2>

						<div className="mb-6" itemProp="description">
							<div
								className="prose dark:prose-invert text-base"
								dangerouslySetInnerHTML={{ __html: sanitizedWhyWorkHereIntro }}
							/>
						</div>

						<div className="mt-6">
							<ul className="space-y-3">
								{sanitizedWhyWorkHereDetails.map((benefit, index) => (
									<li
										key={index}
										className="text-sm"
										itemProp="employeeBenefit"
										itemScope
										itemType="https://schema.org/EmployeeBenefit"
									>
										<h3 className="text-base font-semibold" itemProp="name">
											{benefit.title}
										</h3>
										<div
											className="text-xs text-gray-600 dark:text-gray-300"
											itemProp="description"
											dangerouslySetInnerHTML={{ __html: benefit.description }}
										/>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* About Section */}
			<section
				className="bg-white pb-10 dark:bg-gray-800"
				itemScope
				itemType="https://schema.org/Organization"
			>
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-3xl">
						<h2 className="mb-4 text-2xl font-bold" itemProp="name">
							About {displayName}
						</h2>

						<div
							className="prose prose-sm dark:prose-invert max-w-none"
							itemProp="description"
						>
							{sanitizedDescription ? (
								<div
									dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
								/>
							) : (
								<>
									<p>
										{displayName} is dedicated to providing quality job
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
										{displayName} offers diverse career paths with room for
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

			{/* Open Positions Section */}
			<section
				className="bg-gray-50 py-10 dark:bg-gray-900"
				itemScope
				itemType="https://schema.org/JobPosting"
			>
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<h2 className="mb-4 text-2xl font-bold" itemProp="title">
							{displayName} Open Positions
						</h2>

						<div className="mb-6 grid gap-6 lg:grid-cols-4">
							<div className="lg:col-span-1">
								<LocationFilters
									jobs={employer.jobs}
									onFilterChange={handleLocationFilterChange}
								/>
							</div>

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
									<div className="grid gap-0.5">
										{filteredJobs.map(job => {
											// Calculate the necessary values for JobHeaderDrizzle
											const jobSlug = slugify(job.title)
											const unixTimestamp = Math.floor(
												new Date(job.timeStamp).getTime() / 1000,
											)
											const finalTime = calculateFinalTime(unixTimestamp)

											// Default color based on theme or use employer color if available
											const defaultColor =
												theme === 'light' ? '#FFFFFF' : '#0f172a'
											const color = job.color
												? '#' + ('000000' + job.color.toString(16)).slice(-6)
												: defaultColor
											const textColor = FindTextColor(
												color,
												'#FFFFFF',
												'#000000',
											)

											// Generate URL for the job post
											const jobUrl = `/jobs/${job.id}-${jobSlug}`

											return (
												<Link
													key={job.id}
													to={jobUrl}
													prefetch="intent"
													className="block w-full"
												>
                            {/* TODO: 1. Fix up locations only showing up for jobs showing on job positions and up at top. */}
                            {/* 2. Fix up buttons down under to actually navgiate.  */}
                            {/* 3. Fix up to show total job positions not "10 out of 10" for first page. */}
                            {/* 4. Select state with whole cities as opposed to individually */}
													<JobHeaderDrizzle
														color={color}
														textColor={textColor}
														employerImage={employer.s3Link}
														employer={employer.name}
														hit={job}
														finalTime={finalTime}
														url={jobUrl}
														to={jobUrl} // Pass the navigation URL here
													/>
												</Link>
											)
										})}
									</div>
								)}
							</div>
						</div>

						<div className="mx-auto max-w-3xl">
							<PaginationBar
								total={pagination.total}
								$top={pagination.$top}
								$skip={pagination.$skip}
							/>
						</div>

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
			{/* Job Alerts Section */}
			<section className="bg-blue-50 py-8 dark:bg-blue-900">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
						<h2 className="mb-3 text-xl font-bold">
							Sign Up for {displayName} Job Alerts
						</h2>
						<p className="mb-4 text-sm">
							Register now and get personalized {displayName} job postings
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
