import { RemixBrowser } from '@remix-run/react'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	void import('./utils/monitoring.client.tsx').then(({ init }) => init())
}

function hydrate() {
	startTransition(() => {
		hydrateRoot(
			document,
			<StrictMode>
				<RemixBrowser />
			</StrictMode>,
		)
	})

	// Add Umami script
	const script = document.createElement('script')
	script.defer = true
	script.src = 'https://cloud.umami.is/script.js'
	script.setAttribute('data-website-id', 'b84e466c-cbe0-43fc-b6fc-00691c847f0d')
	document.body.appendChild(script)
}

if (window.requestIdleCallback) {
	window.requestIdleCallback(hydrate)
} else {
	// Safari doesn't support requestIdleCallback
	// https://caniuse.com/requestidlecallback
	window.setTimeout(hydrate, 1)
}
