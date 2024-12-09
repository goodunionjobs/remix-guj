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

	// Add Google Tag Manager script
	const gtmScript = document.createElement('script')
	gtmScript.async = true
	gtmScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-Y5XF93C0RL'
	document.head.appendChild(gtmScript)
	// Initialize GTM
	const w = window as any
	w.dataLayer = w.dataLayer || []
	function gtag(...args: any[]) {
		w.dataLayer.push(arguments)
	}
	w.gtag = gtag
	gtag('js', new Date())
	gtag('config', 'G-Y5XF93C0RL')
}

if (window.requestIdleCallback) {
	window.requestIdleCallback(hydrate)
} else {
	// Safari doesn't support requestIdleCallback
	// https://caniuse.com/requestidlecallback
	window.setTimeout(hydrate, 1)
}
