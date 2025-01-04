import {
	json,
	type LoaderFunctionArgs,
	type LinksFunction,
	type MetaFunction,
} from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { ClientOnly } from 'remix-utils/client-only'
import { history } from 'instantsearch.js/es/lib/routers/index.js'
import { renderToString } from 'react-dom/server'
import {
	type InstantSearchServerState,
	InstantSearch,
	Configure,
	Pagination,
	SearchBox,
	Hits,
	InstantSearchSSRProvider,
	getServerState,
} from 'react-instantsearch'
import {
	StateCombobox,
	EmploymentTypeCombobox,
	ClearAllButton,
} from '#app/components/algolia/combobox-menu.js'
import { Hit } from '#app/components/algolia/hit'
import { SalaryRangeSliderPopover } from '#app/components/algolia/salary-slider.js'
import {
	organizationSchema,
	webSiteSchema,
	description,
} from '#app/utils/constants.js'
import { Button } from '#app/components/ui/button.tsx'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '#app/components/ui/sheet'
import { Icon } from '#app/components/ui/icon.tsx'
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'

const ResponsiveFilters = ({ children }) => {
	return (
		<>
			{/* Show filters directly on larger screens */}
			<div className="hidden md:flex md:space-x-2">{children}</div>

			{/* Show sheet trigger and sheet on smaller screens */}
			<div className="md:hidden">
				<Sheet>
					<SheetTrigger asChild>
						<Button
							variant="outline"
							size="default"
							className="border-2 border-black dark:border-white"
						>
							<Icon name="mixer-horizontal" className="h-4 w-4">
								Filters
							</Icon>
						</Button>
					</SheetTrigger>
					<SheetContent>
						<SheetHeader>
							<SheetTitle>Filters</SheetTitle>
						</SheetHeader>
						<div className="mt-4 flex flex-col space-y-4">{children}</div>
					</SheetContent>
				</Sheet>
			</div>
		</>
	)
}

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
	server: {
		apiKey: 'jXm6SRZvWLLJiR68PiSYmII2VYE3xZNF', // Be sure to use the search-only-api-key
		nodes: [
			{
				host: 'rcnf5b3d74o1k9p2p-1.a1.typesense.net',
				port: 443,
				protocol: 'https',
			},
		],
	},
	// The following parameters are directly passed to Typesense's search API endpoint.
	//  So you can pass any parameters supported by the search endpoint below.
	//  query_by is required.
	additionalSearchParameters: {
		query_by: 'title, employer',
		//TODO: Try out again later
		// facet_by: 'state,employmentType,minSalary',
	},
})

const searchClient = typesenseInstantsearchAdapter.searchClient

// const searchClient = algoliasearch(
// 	//WARNING: THESE ARE PUBLIC
// 	// MUST ONLY USE API KEY LIMITED TO HTTP REFERRER
// 	ENV.ALGOLIA_ID!,
// 	ENV.ALGOLIA_API!,
// )

export const links: LinksFunction = () => [
	{
		rel: 'preconnect',
		href: `https://${ENV.ALGOLIA_ID!}-dsn.algolia.net`,
		crossOrigin: 'anonymous',
	},
]

export async function loader({ request }: LoaderFunctionArgs) {
	const serverUrl = request.url
	const serverState = await getServerState(<Search serverUrl={serverUrl} />, {
		renderToString,
	})

	return json({
		serverState,
		serverUrl,
	})
}

type SearchProps = {
	serverState?: InstantSearchServerState
	serverUrl?: string
}

function generateCanonicalUrl(url: string): string {
	const parsedUrl = new URL(url)

	// Remove query, state, and employmenttype parameters
	parsedUrl.searchParams.delete('q')
	parsedUrl.searchParams.delete('state')
	parsedUrl.searchParams.delete('employmenttype')

	// Keep the page parameter if it exists and is greater than 1
	const page = parsedUrl.searchParams.get('page')
	if (page && parseInt(page) > 1) {
		parsedUrl.searchParams.set('page', page)
	} else {
		parsedUrl.searchParams.delete('page')
	}

	return parsedUrl.toString()
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return [
			{ title: 'Error | Good Union Jobs' },
			{ name: 'robots', content: 'noindex' },
		]
	}

	const canonicalUrl = generateCanonicalUrl(data.serverUrl)

	return [
		{
			title: 'Good Union Jobs - Browse nationwide union jobs, get daily alerts',
		},
		{
			name: 'description',
			content: description,
		},
		{ property: 'robots', content: 'index,follow' },
		{ 'script:ld+json': organizationSchema },
		{ 'script:ld+json': webSiteSchema },
		{ tagName: 'link', rel: 'canonical', href: canonicalUrl },
	]
}

//@ts-ignore
let timerId = undefined
let timeout = 200

//@ts-ignore
function queryHook(query, search) {
	//@ts-ignore
	if (timerId) {
		clearTimeout(timerId)
	}

	timerId = setTimeout(() => search(query), timeout)
}

function arrayify(value) {
	// If it's already an array or null/undefined, handle gracefully
	if (Array.isArray(value)) return value
	if (value == null) return []
	// Otherwise wrap single value in array
	return [value]
}

function PlaceholderFilters() {
	return (
		<>
			<Button variant="outline" className="dark:border-white dark:bg-black">
				<span className="mr-2">💼</span>
				Job Types
			</Button>
			<Button variant="outline" className="dark:border-white dark:bg-black">
				<span className="mr-2">📌</span>
				States
			</Button>
			<Button variant="outline" className="dark:border-white dark:bg-black">
				<span className="mr-2">💰</span>
				Pay
			</Button>
		</>
	)
}

function SearchHeader() {
	return (
		<div className="mt-10 justify-center p-6">
			<h1 className="flex flex-col text-3xl font-bold sm:text-4xl">
				<span className="inline-flex justify-center">
					<span className="rounded-sm bg-[#0730FD] px-1 text-white">
						Make your job
					</span>
				</span>
				<span className="inline-flex justify-center pt-1.5">
					<span className="rounded-sm bg-amber-300 px-1 text-black">
						work for{' '}
						<span className="decoration-3 text-black underline">you</span>
					</span>
				</span>
			</h1>
		</div>
	)
}

function Search({ serverState, serverUrl }: SearchProps) {
	const ALGOLIA_INDEX = ENV.ALGOLIA_INDEX!

	// Get initial state from URL
	const url =
		typeof window !== 'undefined' ? window.location : new URL(serverUrl!)
	const params = new URLSearchParams(url.search)
	// const initialState = {
	// 	state: params.get('state'),
	// 	jobtype: params.get('jobtype'),
	// }

	// Create facetFilters array for Configure widget
	const states = params.getAll('state')
	const employmentTypes = params.getAll('employmentType')
	// Then build an array:
	const facetFilters = [
		...states.map(st => `state:${st}`),
		...employmentTypes.map(jt => `employmentType:${jt}`),
	]

	// const facetFilters = [
	// 	initialState.state && `state:${initialState.state}`,
	// 	initialState.jobtype && `employmentType:${initialState.jobtype}`,
	// ].filter(Boolean)
	return (
		<>
			<SearchHeader /> {/* Rendered outside InstantSearch */}
			<InstantSearchSSRProvider {...serverState}>
				<InstantSearch
					searchClient={searchClient}
					indexName={ALGOLIA_INDEX}
					future={{
						preserveSharedStateOnUnmount: true,
					}}
					routing={{
						router: history({
							cleanUrlOnDispose: false,
							getLocation() {
								if (typeof window === 'undefined') {
									// On server: parse from your request.url
									return new URL(serverUrl) as unknown as Location
								}
								return window.location
							},
							/**
							 * Converts the final routeState into an actual URL string.
							 * You can set the path to `/jobs/all` (or anything you like).
							 */
							createURL({ qsModule, routeState, location }) {
								// Typically base it on location.origin so it works locally too
								const baseUrl = `${location.origin}${location.pathname}`

								// Turn routeState into query params
								const queryString = qsModule.stringify(routeState, {
									addQueryPrefix: true,
									arrayFormat: 'repeat', // Multiple values
								})

								// result: "https://goodunionjobs.com/?employmentType=full_time&employmentType=contractor"
								return `${baseUrl}${queryString}`
							},

							// Parse the existing URL back into an object for routeToState
							parseURL({ qsModule, location }) {
								const parsed = qsModule.parse(location.search.slice(1))
								console.log('🚀 parseURL', parsed)
								// This reads everything after the "?" in e.g. example.com/?employmentType=full_time
								return qsModule.parse(location.search.slice(1))
							},
						}),

						/**
						 * stateMapping: how to convert between InstantSearch internal uiState
						 * and our custom routeState above.
						 */
						stateMapping: {
							stateToRoute(uiState) {
								// Our index is e.g. "yourIndexName"
								const indexUiState = uiState[ALGOLIA_INDEX] || {}

								return {
									q: indexUiState.query,
									page: indexUiState.page,
									employmentType: indexUiState.refinementList?.employmentType,
									state: indexUiState.refinementList?.state,
									// TODO: Fix that %3A (a `:` character) shows up after the salary
									salary: indexUiState.range?.minSalary,
								}
							},

							routeToState(routeState) {
								console.log('🚀 routeToState input', routeState)

								return {
									[ALGOLIA_INDEX]: {
										query: routeState.q || '',
										page: routeState.page || 1,
										refinementList: {
											// Need this because if single string, might not be seen as array
											employmentType: arrayify(routeState.employmentType),
											state: arrayify(routeState.state),
										},
										range: {
											minSalary: routeState.salary,
										},
									},
								}
							},
						},
					}}
				>
					<Configure
						hitsPerPage={40}
						// facetFilters={facetFilters}
					/>
					<div className="mt-10 grid justify-items-center">
						<div className="justify-center">
							<SearchBox
								loadingIconComponent={() => 'loading...'}
								placeholder="Search for Union Jobs"
								classNames={{
									root: `relative font-bold px-2 [width:315] sm:[width:386px]
								bg-white rounded-lg border-black border border-2 text-black
								dark:bg-black dark:border-white dark:text-white`,
									input: `[width:250px] sm:[width:320px] [height:40px] sm:[height:53px]
									bg-white dark:bg-black pl-2 focus:outline-none`,
									reset: 'invisible',
									submitIcon: 'text-xl sm:text-2xl',
								}}
								submitIconComponent={({ classNames }) => (
									<div className={`${classNames.submitIcon}`}>
										<Icon name="search" className="h-6 w-6 sm:h-8 sm:w-8" />
									</div>
								)}
								queryHook={queryHook}
							/>
						</div>
						{/* Later when we have more filters get rid of the margins. They'll line up in the middle. Easier to handle */}
						<div className="z-20 mb-3 mt-2">
							<ResponsiveFilters>
								<ClientOnly fallback={<PlaceholderFilters />}>
									{() => (
										<>
											<EmploymentTypeCombobox />
											<StateCombobox />
											<SalaryRangeSliderPopover />
											<ClearAllButton />
										</>
									)}
								</ClientOnly>
							</ResponsiveFilters>
						</div>
					</div>
					<div className="mt-1 flex justify-center dark:bg-slate-950">
						<div className="[width:1115px]" aria-label="Job Listings">
							<Hits hitComponent={Hit} />
						</div>
					</div>
					<Pagination
						padding={1}
						classNames={{
							root: `sm:text-4xl text-3xl sm:max-w-sm mx-auto`,
							list: 'flex flex-row justify-center gap-4',
							selectedItem: 'border-b-4 border-black ',
						}}
					/>
				</InstantSearch>
			</InstantSearchSSRProvider>
		</>
	)
}

export default function SearchRoute() {
	const { serverState, serverUrl } = useLoaderData() as SearchProps

	return <Search serverState={serverState} serverUrl={serverUrl} />
}
