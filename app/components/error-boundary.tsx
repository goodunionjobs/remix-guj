import {
	type ErrorResponse,
	isRouteErrorResponse,
	useParams,
	useRouteError,
	Link,
} from '@remix-run/react'
import { captureRemixErrorBoundaryError } from '@sentry/remix'
import { AlertTriangle, Home } from 'lucide-react'
import { getErrorMessage } from '#app/utils/misc.tsx'
import { Alert, AlertTitle, AlertDescription } from './ui/alert'
import { Button } from './ui/button'

const ErrorDisplay = ({
	title,
	message,
}: {
	title: string
	message: string
}) => (
	<Alert variant="destructive">
		<AlertTriangle className="h-4 w-4" />
		<AlertTitle>{title}</AlertTitle>
		<AlertDescription>{message}</AlertDescription>
	</Alert>
)

type StatusHandler = (info: {
	error: ErrorResponse
	params: Record<string, string | undefined>
}) => JSX.Element | null

export function GeneralErrorBoundary({
	defaultStatusHandler = ({ error }) => (
		<p>
			{error.status} {error.data}
		</p>
	),
	statusHandlers,
	unexpectedErrorHandler = error => <p>{getErrorMessage(error)}</p>,
}: {
	defaultStatusHandler?: StatusHandler
	statusHandlers?: Record<number, StatusHandler>
	unexpectedErrorHandler?: (error: unknown) => JSX.Element | null
}) {
	const error = useRouteError()
	captureRemixErrorBoundaryError(error)
	const params = useParams()

	if (typeof document !== 'undefined') {
		console.error(error)
	}

	let errorContent
	if (isRouteErrorResponse(error)) {
		const handler = statusHandlers?.[error.status] || defaultStatusHandler
		errorContent = handler({ error, params })
	} else {
		errorContent = unexpectedErrorHandler ? unexpectedErrorHandler(error) : null
	}

	if (!errorContent) {
		errorContent = (
			<ErrorDisplay
				title="Oops! Something went wrong"
				message={getErrorMessage(error)}
			/>
		)
	}

	//TODO: FIX UP TO MAKE HAVE LOGO AND LOOK NICER!
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
						Error Encountered
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						We apologize for the inconvenience
					</p>
				</div>
				<div className="mt-8 space-y-6">
					{errorContent}
					<div className="flex justify-center">
						<Button asChild>
							<Link to="/" reloadDocument>
								<Home className="mr-2 h-4 w-4" /> Go back home
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
