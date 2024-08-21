import { getKindeSession } from '@kinde-oss/kinde-remix-sdk'
import { type KindeUser } from '@kinde-oss/kinde-remix-sdk/types'
import {
	json,
	type LoaderFunctionArgs,
	type LinksFunction,
	type MetaFunction,
} from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import algoliasearch from 'algoliasearch/lite'
import { eq } from 'drizzle-orm'
import { history } from 'instantsearch.js/es/lib/routers/index.js'
import { useEffect } from 'react'
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
} from '#app/components/algolia/combobox-menu.js'
import { Hit } from '#app/components/algolia/hit'
import { SalaryRangeSliderPopover } from '#app/components/algolia/salary-slider.js'
import { db } from '#app/utils/db.server'
import { users } from '../../../drizzle/schema'
import { organizationSchema, description } from '#app/utils/constants.js'

const searchClient = algoliasearch(
	//WARNING: THESE ARE PUBLIC
	// MUST ONLY USE API KEY LIMITED TO HTTP REFERRER
	ENV.ALGOLIA_ID!,
	ENV.ALGOLIA_API!,
)

export const links: LinksFunction = () => [
	{
		rel: 'preconnect',
		href: `https://${ENV.ALGOLIA_ID!}-dsn.algolia.net`,
		crossOrigin: 'anonymous',
	},
]

export async function loader({ request }: LoaderFunctionArgs) {
	const { getUser } = await getKindeSession(request)
	const user: KindeUser | null = await getUser()

	let isNewSignUp = false

	if (user) {
		// Check if the user exists in our database
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, user.email),
		})

		if (existingUser?.kindeUserId !== user.id) {
			await db
				.update(users)
				.set({
					kindeUserId: user.id,
					updatedAt: new Date(),
				})
				.where(eq(users.kindeUserId, user.id))
		}
		//TODO: Need to make sure kindeUserId and our DB.UserId match
		// If not query updates

		if (!existingUser) {
			// New sign up - create user in our database
			// TODO: Create upsert just in case!
			await db.insert(users).values({
				kindeUserId: user.id,
				email: user.email,
				firstName: user.given_name,
				lastName: user.family_name,
			})
			isNewSignUp = true
		}
	}

	const serverUrl = request.url
	const serverState = await getServerState(<Search serverUrl={serverUrl} />, {
		renderToString,
	})

	return json({
		user,
		isNewSignUp,
		serverState,
		serverUrl,
	})
}

type SearchProps = {
	serverState?: InstantSearchServerState
	serverUrl?: string
	user?: KindeUser | null
	isNewSignUp?: boolean
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: data ? 'Good Union Jobs' : 'Error | Good Union Jobs' },
		{
			name: 'description',
			content: description,
		},
		{ 'script:ld+json': organizationSchema },
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

function Search({ serverState, serverUrl, user, isNewSignUp }: SearchProps) {
	const ALGOLIA_INDEX = ENV.ALGOLIA_INDEX!
	useEffect(() => {
		const script = document.createElement('script')
		script.id = 'reddit-pixel'
		script.async = true
		script.innerText = `!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','a2_fdiyqmhdozo7');rdt('track', 'PageVisit');`
		document.head.appendChild(script)
		if (isNewSignUp && user) {
			// Function to attempt tracking
			const attemptTracking = () => {
				if (typeof window.rdt === 'function') {
					const normalizedEmail =
						window.redditNormalizeEmail?.(user.email) ?? user.email
					window.rdt('track', 'SignUp', {
						email: normalizedEmail,
						external_id: user.id,
					})
				} else {
					// If rdt is not available, try again after a short delay
					setTimeout(attemptTracking, 500)
				}
			}

			// Start attempting to track
			attemptTracking()
		}
	}, [isNewSignUp, user])

	return (
		<>
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
									return new URL(serverUrl!) as unknown as Location
								}
								return window.location
							},
						}),
						stateMapping: {
							stateToRoute(uiState) {
								const indexUiState = uiState[ALGOLIA_INDEX]
								return {
									q: indexUiState.query,
									state: indexUiState.menu?.state,
									jobtype: indexUiState.menu?.employmentType,
									page: indexUiState.page,
								}
							},
							routeToState(routeState) {
								return {
									[ALGOLIA_INDEX]: {
										query: routeState.q,
										menu: {
											categories: routeState.state,
											// Set other menu properties if needed
										},
										page: routeState.page,
									},
								}
							},
						},
						onRouteChange() {
							// This callback is called when the route changes
							// You can implement any additional logic here if needed
						},
						// initialRouteState, // Uncomment and set initial route state if needed
					}}
				>
					<Configure hitsPerPage={40} />
					<div className="mt-10 grid justify-items-center">
						<div className=" justify-center">
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
									<div className={`${classNames.submitIcon}`}>🔍</div>
								)}
								queryHook={queryHook}
							/>
						</div>
						{/* Later when we have more filters get rid of the margins. They'll line up in the middle. Easier to handle */}
						<div className="z-20 mb-3 mt-2">
							<EmploymentTypeCombobox />
							<StateCombobox />
							<SalaryRangeSliderPopover />
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
	const { serverState, serverUrl, user, isNewSignUp } =
		useLoaderData() as SearchProps

	return (
		<Search
			serverState={serverState}
			serverUrl={serverUrl}
			user={user}
			isNewSignUp={isNewSignUp}
		/>
	)
}
