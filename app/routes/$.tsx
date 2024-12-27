// This is called a "splat route" and as it's in the root `/app/routes/`
// directory, it's a catchall. If no other routes match, this one will and we
// can know that the user is hitting a URL that doesn't exist. By throwing a
// 404 from the loader, we can force the error boundary to render which will
// ensure the user gets the right status code and we can display a nicer error
// message for them than the Remix and/or browser default.

import { Link, useLocation } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
//TODO: Include icon Home in SVG load ins

export async function loader() {
	throw new Response('Not found', { status: 404 })
}

export default function NotFound() {
	// due to the loader, this component will never be rendered, but we'll return
	// the error boundary just in case.
	return <ErrorBoundary />
}

export function ErrorBoundary() {
	const location = useLocation()
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => (
					<div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
						<div className="w-full max-w-md space-y-8">
							<div className="text-center">
								<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
									We can't find this page
								</h2>
								<p className="mt-2 text-2xl text-gray-600">
									{location.pathname}
								</p>
							</div>
							<div className="mt-8 space-y-6">
								<div className="flex justify-center">
									<Button asChild>
										<Link to="/" reloadDocument>
											<Icon className="mr-2 h-4 w-4" name="home" />
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
