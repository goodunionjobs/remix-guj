// import { getKindeSession } from '@kinde-oss/kinde-remix-sdk'
// import { type KindeUser } from '@kinde-oss/kinde-remix-sdk/types'
// import {
// 	json,
// 	type LoaderFunctionArgs,
// 	type LinksFunction,
// 	type MetaFunction,
// } from '@remix-run/node'
// import { useLoaderData } from '@remix-run/react'
// import algoliasearch from 'algoliasearch/lite'
// import { eq } from 'drizzle-orm'
import { useEffect, useState } from 'react'
import {
	InstantSearch,
	Configure,
	Pagination,
	SearchBox,
	Hits,
} from 'react-instantsearch'
import { history } from 'instantsearch.js/es/lib/routers/index.js'
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'
import { Hit } from '#app/components/algolia/hit'
import {
	StateCombobox,
	EmploymentTypeCombobox,
} from '#app/components/algolia/combobox-menu.js'
import { SalaryRangeSliderPopover } from '#app/components/algolia/salary-slider.js'

function ClientSearch() {
	const [searchClient, setSearchClient] = useState(null)
	const [isLoading, setIsLoading] = useState(true)
	const ALGOLIA_INDEX = ENV.ALGOLIA_INDEX!

	useEffect(() => {
		const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
			server: {
				apiKey: 'jXm6SRZvWLLJiR68PiSYmII2VYE3xZNF',
				nodes: [
					{
						host: 'rcnf5b3d74o1k9p2p-1.a1.typesense.net',
						port: 443,
						protocol: 'https',
					},
				],
			},
			additionalSearchParameters: {
				query_by: 'title',
			},
		})

		setSearchClient(typesenseInstantsearchAdapter.searchClient)
		setIsLoading(false)
	}, [])

	if (isLoading || !searchClient) {
		return <div>Loading search...</div>
	}

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
									},
									page: routeState.page,
								},
							}
						},
					},
				}}
			>
				<Configure hitsPerPage={40} />
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
								<div className={`${classNames.submitIcon}`}>🔍</div>
							)}
						/>
					</div>
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
		</>
	)
}

export default function SearchRoute() {
	return <ClientSearch />
}
