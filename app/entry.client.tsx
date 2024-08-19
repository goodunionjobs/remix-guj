import { RemixBrowser } from '@remix-run/react'
import posthog from 'posthog-js'
import { startTransition, useEffect, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	import('./utils/monitoring.client.tsx').then(({ init }) => init())
}

function hydrate() {
	posthog.init('phc_JlLZHgPkAs5IFqAguiVTI09r3aThYEYsuJ0mKy9kzAi', {
		api_host: 'https://us.i.posthog.com',
		person_profiles: 'identified_only',
		capture_pageview: false,
	})

	startTransition(() => {
		hydrateRoot(
			document,
			<StrictMode>
				<RemixBrowser />
			</StrictMode>,
		)
	})
}

if (window.requestIdleCallback) {
	window.requestIdleCallback(hydrate)
} else {
	window.setTimeout(hydrate, 1)
}
//
// function PosthogInit() {
// 	useEffect(() => {
// 		if (ENV.MODE === 'production') {
// 			posthog.init('phc_JlLZHgPkAs5IFqAguiVTI09r3aThYEYsuJ0mKy9kzAi', {
// 				api_host: 'https://us.i.posthog.com',
// 				person_profiles: 'identified_only',
// 				capture_pageview: false,
// 			})
// 		}
// 	}, [])
//
// 	return null
// }
//
// startTransition(() => {
// 	hydrateRoot(
// 		document,
// 		// TODO: Strictmode disable?
// 		<StrictMode>
// 			<RemixBrowser />
// 			<PosthogInit />
// 		</StrictMode>,
// 	)
// })
