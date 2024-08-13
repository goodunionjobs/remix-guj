import type { LoaderFunction } from '@remix-run/node'

//TODO: Should we redirect somewhere else if they just go to users/ without any username?
export const loader: LoaderFunction = async ({ params }) => {
	return new Response(null, {
		status: 301,
		headers: {
			Location: '/',
		},
	})
}
