import {
	type ErrorResponse,
	isRouteErrorResponse,
	useParams,
	useRouteError,
	Link,
} from '@remix-run/react'
import { captureRemixErrorBoundaryError } from '@sentry/remix'
import { type ReactElement } from 'react'
import { Icon } from './ui/icon.tsx'
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
		<Icon className="text-body-md" name="exclamation-triangle" />
		{/* <AlertTriangle className="h-4 w-4" /> */}
		<AlertTitle>{title}</AlertTitle>
		<AlertDescription>{message}</AlertDescription>
	</Alert>
)

type StatusHandler = (info: {
	error: ErrorResponse
	params: Record<string, string | undefined>
}) => ReactElement | null

export function GeneralErrorBoundary({
	defaultStatusHandler = ({ error }) => (
		<ErrorDisplay title="Error" message={`${error.status} ${error.data}`} />
	),
	statusHandlers,
	unexpectedErrorHandler = error => (
		<ErrorDisplay
			title="Oops! Something went wrong"
			message={getErrorMessage(error)}
		/>
	),
}: {
	defaultStatusHandler?: StatusHandler
	statusHandlers?: Record<number, StatusHandler>
	unexpectedErrorHandler?: (error: unknown) => ReactElement | null
}) {
	const error = useRouteError()
	captureRemixErrorBoundaryError(error)
	const params = useParams()

	if (typeof document !== 'undefined') {
		console.error(error)
	}

	const errorContent = isRouteErrorResponse(error)
		? (statusHandlers?.[error.status] ?? defaultStatusHandler)({
				error,
				params,
			})
		: unexpectedErrorHandler(error)

	// If it's a known error status (like 404) with a custom handler,
	// return just the error content without the error encountered wrapper
	if (isRouteErrorResponse(error) && statusHandlers?.[error.status]) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
				<div className="w-full max-w-md space-y-8">{errorContent}</div>
			</div>
		)
	}

	// For unexpected errors, show the full error encountered message
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
								<Icon className="mr-2 h-4 w-4" name="home" />
								Go back home
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
