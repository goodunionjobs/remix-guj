import { json, type LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import algoliasearch from 'algoliasearch/lite'
import { history } from 'instantsearch.js/es/lib/routers/index.js'
import { renderToString } from 'react-dom/server'
import {
	Hits,
	InstantSearch,
	// Hits,
	InstantSearchSSRProvider,
	getServerState,
} from 'react-instantsearch'

const searchClient = algoliasearch(
	'WW2B8U6V57',
	'4a522f73130e446a24ea67bab00e1eb3',
	// Test below
	// '213e8a12187682eb022fbbdfb374acb9',
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
	serverState?: InstantSearchServerState
	serverUrl?: string
}

function Search({ serverState, serverUrl }: SearchProps) {
	return (
		<InstantSearchSSRProvider {...serverState}>
			<InstantSearch
				searchClient={searchClient}
				// indexName="test_guj"
				indexName="guj"
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
				<Hits hitComponent={Hit} />
			</InstantSearch>
		</InstantSearchSSRProvider>
	)
}

function Hit({ hit }) {
	return JSON.stringify(hit.job)
}

export default function SearchRoute() {
	const { serverState, serverUrl } = useLoaderData() as SearchProps

	return <Search serverState={serverState} serverUrl={serverUrl} />
}
