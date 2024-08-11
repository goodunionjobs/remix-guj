import { json, type LoaderFunction } from '@remix-run/node'
import { useLoaderData, Link } from '@remix-run/react'
import algoliasearch from 'algoliasearch/lite'
import { history } from 'instantsearch.js/es/lib/routers/index.js'
import { renderToString } from 'react-dom/server'
import {
	InstantSearch,
	Configure,
	Pagination,
	SearchBox,
	Hits,
	InstantSearchSSRProvider,
	getServerState,
} from 'react-instantsearch'
import { Hit } from '#app/components/algolia/hit'
import { JobProvider } from '#app/utils/job-context.js'

const searchClient = algoliasearch(
	'WW2B8U6V57',
	'7f9258c9815e66085c6072a642cfc11c',
)

export const loader: LoaderFunction = async ({ request }) => {
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
	// TODO: Figure out where to find type
	// @ts-ignore
	serverState?: InstantSearchServerState
	serverUrl?: string
}
let timerId: NodeJS.Timeout | string | number | undefined = undefined

function Search({ serverState, serverUrl }: SearchProps) {
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

			<InstantSearchSSRProvider {...serverState}>
				<InstantSearch
					searchClient={searchClient}
					// indexName="test_guj"
					indexName="staging_guj"
					future={{
						preserveSharedStateOnUnmount: true,
					}}
					routing={{
						router: history({
							getLocation() {
								if (typeof window === 'undefined') {
									return new URL(serverUrl!) as unknown as Location
								}

								return window.location
							},
							cleanUrlOnDispose: false,
						}),
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
							{/* <CustomMenuState attribute="state" /> */}
							{/* <CustomMenuEmployment attribute="employmentType" /> */}
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
