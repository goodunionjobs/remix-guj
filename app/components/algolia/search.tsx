import algoliasearch, { type SearchClient } from 'algoliasearch/lite.js'
import { Configure, InstantSearch, Pagination, SearchBox, Hits } from 'react-instantsearch';
import { InstantSearchSSRProvider, type InstantSearchServerState } from 'react-instantsearch';
// ! TODO Don't know why it doesn't work if I take the brackets off
import { history } from 'instantsearch.js/es/lib/routers/index.js';
import { CustomMenuEmployment } from './custom-menu-employment.tsx'
import { CustomMenuState } from './custom-menu-state.tsx'
import { Hit } from './hit.tsx'
// import { SelteCt } from '../ui/select.tsx'

let timerId: NodeJS.Timeout | string | number | undefined = undefined
const indexEnv = { prod: 'guj', stage: 'test_guj' }
type SearchProps = {
  serverState?: InstantSearchServerState;
  serverUrl?: string;
};
const indexName = process.env.NODE_ENV === 'production' ? 'guj' : 'test_guj'

// TODO Put back formDismissed in Search later
export function Search() {
	// If error found here remember that header referer has to also be put in
	// on Algolias settings

	const searchClient: SearchClient =
		process.env.NODE_ENV === 'production'
			? // TODO FIX AND REMOVE @ts-ignore
			  //@ts-ignore
			  algoliasearch('WW2B8U6V57', 'fe2560456c3ab24fdc8e06e843d3978b', {
					// headers: {
					// 	referer: serverUrl,
					// },
					// ! IMPLEMENT IN THE FUTURE
					// // Caches responses from Algolia
					// responsesCache: createInMemoryCache(), // or createNullCache()
					// // Caches Promises with the same request payload
					// requestsCache: createInMemoryCache(), // or createNullCache()
			  })
			: //@ts-ignore
			  algoliasearch('WW2B8U6V57', '213e8a12187682eb022fbbdfb374acb9', {
					// ! IMPLEMENT IN THE FUTURE
					// // Caches responses from Algolia
					// responsesCache: createInMemoryCache(), // or createNullCache()
					// // Caches Promises with the same request payload
					// requestsCache: createInMemoryCache(), // or createNullCache();
					// Set the search parameters for the predefined search
			  })

	return (
		<>
			<div className="justify-center p-6">
				<h1 className="flex flex-col text-2xl font-bold sm:text-4xl">
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
			<InstantSearch
				searchClient={searchClient}
				indexName={
                    // TO-DO WORKS FOR DEVELOPMENT!!!
					process.env.NODE_ENV === 'production' ? indexEnv.prod : indexEnv.stage
				}

                routing={{
                    		router: history({
            cleanUrlOnDispose: false,
			getLocation() {
				return window.location
			},
		}),
		stateMapping: {
			stateToRoute(uiState) {
				const indexUiState = uiState[indexName]
				return {
					q: indexUiState.query,
					state: indexUiState.menu?.state,
					jobtype: indexUiState.menu?.employmentType,
					page: indexUiState.page,
				}
			},
			routeToState(routeState) {
				return {
					[indexName]: {
						query: routeState.q, //|| initialQuery, // Use initialQuery if route query is undefined
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
		// initialRouteState, // Set initial route state with the initialQuery
	}}


                future={{
                    preserveSharedStateOnUnmount: true,
                }}
                >
				<Configure hitsPerPage={40} />
				<div className="grid justify-items-center ">
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
							queryHook={(query, search) => {
								if (timerId) {
									clearTimeout(timerId)
								}
								timerId = setTimeout(() => search(query), 500)
							}}
						/>
					</div>
					{/* Later when we have more filters get rid of the margins. They'll line up in the middle. Easier to handle */}
					<div className="z-20 -mt-0.5 mb-3">
						<CustomMenuState attribute="state" />
						<CustomMenuEmployment attribute="employmentType" />
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

		</>
	)
}
