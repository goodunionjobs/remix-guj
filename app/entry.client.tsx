import { RemixBrowser } from '@remix-run/react'
import posthog from 'posthog-js'
import { startTransition, useEffect, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	import('./utils/monitoring.client.tsx').then(({ init }) => init())
}

// function PosthogInit() {
// 	useEffect(() => {
// 		if (ENV.MODE === 'production') {
// 			posthog.init('phc_JlLZHgPkAs5IFqAguiVTI09r3aThYEYsuJ0mKy9kzAi', {
// 				api_host: 'https://us.i.posthog.com',
// 				person_profiles: 'identified_only',
// 			})
// 		}
// 	}, [])
//
// 	return null
// }

startTransition(() => {
	hydrateRoot(
		document,
		// TODO: Strictmode disable?
		<StrictMode>
			<RemixBrowser />
			{/* <PosthogInit /> */}
		</StrictMode>,
	)
})

// startTransition(() => {
// 	hydrateRoot(
// 		document,
// 		<StrictMode>
// 			<RemixBrowser /> <PosthogInit />
// 		</StrictMode>,
// 	)
// })
