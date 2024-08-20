import { getKindeSession } from '@kinde-oss/kinde-remix-sdk'
import {
	json,
	type LoaderFunctionArgs,
	type HeadersFunction,
	type LinksFunction,
	type MetaFunction,
} from '@remix-run/node'
import {
	Form,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLocation,
	useLoaderData,
	useSubmit,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import posthog from 'posthog-js'
import { useRef, useEffect } from 'react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { EpicProgress } from './components/progress-bar.tsx'
import { SearchBar } from './components/search-bar.tsx'
import { useToast } from './components/toaster.tsx'
import { Button } from './components/ui/button.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuTrigger,
} from './components/ui/dropdown-menu.tsx'
import { Icon, href as iconsHref } from './components/ui/icon.tsx'
import { EpicToaster } from './components/ui/sonner.tsx'
import { ThemeSwitch, useTheme } from './routes/resources+/theme-switch.tsx'
import tailwindStyleSheetUrl from './styles/tailwind.css?url'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { getEnv } from './utils/env.server.ts'
import { honeypot } from './utils/honeypot.server.ts'
import { combineHeaders, getDomainUrl, getUserImgSrc } from './utils/misc.tsx'
import { useNonce } from './utils/nonce-provider.ts'
import { type Theme, getTheme } from './utils/theme.server.ts'
import { makeTimings, time } from './utils/timing.server.ts'
import { getToast } from './utils/toast.server.ts'

export const links: LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		{ rel: 'preload', href: iconsHref, as: 'image' },
		// Preload CSS as a resource to avoid render blocking
		{ rel: 'mask-icon', href: '/favicons/mask-icon.svg' },
		{
			rel: 'alternate icon',
			type: 'image/png',
			href: '/favicons/favicon-32x32.png',
		},
		{ rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png' },
		{
			rel: 'manifest',
			href: '/site.webmanifest',
			crossOrigin: 'use-credentials',
		} as const, // necessary to make typescript happy
		//These should match the css preloads above to avoid css as render blocking resource
		{ rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
		{ rel: 'stylesheet', href: tailwindStyleSheetUrl },
	].filter(Boolean)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	// TODO: Fix up
	return [
		{ title: data ? 'Good Union Jobs' : 'Error | Good Union Jobs' },
		{ name: 'description', content: `Your own captain's log` },
	]
}

export async function loader({ request }: LoaderFunctionArgs) {
	const timings = makeTimings('root loader')

	const { getUser } = await getKindeSession(request)
	const user = await getUser()

	const { toast, headers: toastHeaders } = await getToast(request)
	const honeyProps = honeypot.getInputProps()

	return json(
		{
			user,
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				userPrefs: {
					theme: getTheme(request),
				},
			},
			ENV: getEnv(),
			toast,
			honeyProps,
		},
		{
			headers: combineHeaders(
				{ 'Server-Timing': timings.toString() },
				toastHeaders,
			),
		},
	)
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	const headers = {
		'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
	}
	return headers
}

function Document({
	children,
	nonce,
	theme = 'light',
	env = {},
	allowIndexing = true,
}: {
	children: React.ReactNode
	nonce: string
	theme?: Theme
	env?: Record<string, string>
	allowIndexing?: boolean
}) {
	return (
		<html lang="en" className={`${theme} h-full overflow-x-hidden`}>
			<head>
				<ClientHintCheck nonce={nonce} />
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				{allowIndexing ? null : (
					<meta name="robots" content="noindex, nofollow" />
				)}
				<Links />
			</head>
			<body className="bg-background text-foreground">
				{children}
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const nonce = useNonce()
	// const user = useOptionalUser()
	// TODO: When theme button is clicked job details loads again like its being fetched when job post is open
	const theme = useTheme()
	// TODO: DELETE
	// const matches = useMatches()
	// const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
	// const searchBar = isOnSearchPage ? null : <SearchBar status="idle" />
	const allowIndexing = data.ENV.ALLOW_INDEXING !== 'false'
	useToast(data.toast)
	const location = useLocation()
	useEffect(() => {
		// Posthog capture pageview
		posthog.capture('$pageview')
		// Add reddit pixel
		const script = document.createElement('script')
		script.id = 'reddit-pixel'
		script.async = true
		script.innerText = `!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','a2_fdiyqmhdozo7');rdt('track', 'PageVisit');`
		document.head.appendChild(script)

		const signUpButton = document.getElementById('signUpButton')
		if (signUpButton) {
			signUpButton.addEventListener('click', () => {
				if (window.rdt) {
					window.rdt('track', 'SignUpClick', {
						customEventName: 'SignUpClick',
						value: 'Job Notifications',
					})
				}
			})
		}

		// Clean up the event listener on component unmount
		return () => {
			if (signUpButton) {
				signUpButton.removeEventListener('click', () => {
					if (window.rdt) {
						window.rdt('track', 'SignUpClick')
					}
				})
			}
		}
	}, [location])

	return (
		<Document
			nonce={nonce}
			theme={theme}
			allowIndexing={allowIndexing}
			env={data.ENV}
		>
			<div className="flex h-screen flex-col justify-between">
				{/* <div className="flex items-center justify-center bg-blue-700 pt-0.5  text-white sm:py-1"> */}
				{/* 	<span> */}
				{/* 		<a href="https://www.ukrainefreedomproject.org/"> */}
				{/* 			Help Provide Humanitarian Aid to Ukraine 🇺🇦 */}
				{/* 		</a> */}
				{/* 	</span> */}
				{/* </div> */}

				<header className="px-3.5 py-6 sm:container">
					<nav className="flex items-center justify-between gap-1">
						<div className="flex justify-between gap-2">
							<Logo />
							<Link to="/" className="hidden self-center md:block">
								<div className="font-light">Good</div>
								<div className="font-bold">Union Jobs</div>
							</Link>
							<div className="ml-4 flex h-10 w-10 items-center justify-center self-center rounded-full bg-gray-300 dark:bg-slate-500">
								<ThemeSwitch
									userPreference={data.requestInfo.userPrefs.theme}
								/>
							</div>
						</div>
						{/* // TODO Add back later. Cool to look up users */}
						{/* {isOnSearchPage ? null : (
							<div className="ml-auto max-w-sm flex-1 pr-10">
								<SearchBar status="idle" />
							</div>
						)} */}
						<div className="flex flex-col gap-4">
							<div className="flex flex-col items-center gap-2">
								{data.user ? (
									<UserDropdown user={data.user} />
								) : (
									<>
										<Button
											asChild
											variant="default"
											size="lg"
											className="w-3/4 sm:w-full "
											id="signUpButton" // reddit pixel
										>
											<Link to={'/kinde-auth/register'}>
												Sign Up - Job Notifications 💼
											</Link>
										</Button>
										<Button
											asChild
											variant="outline"
											size="lg"
											className="w-3/4 sm:w-full"
										>
											<Link to={'/kinde-auth/login'}>Login</Link>
										</Button>
									</>
								)}
							</div>
						</div>
					</nav>
				</header>

				<div className="flex-1">
					<Outlet />
				</div>

				<div className="container flex justify-between justify-items-center pb-5">
					<div className="flex items-center justify-items-center  gap-4">
						<Logo />
						<Link to="/" className="hidden self-center md:block">
							<div className="font-light">Good</div>
							<div className="font-bold">Union Jobs</div>
						</Link>
						<Link to="/tos" className="">
							Terms & Conditions
						</Link>
						<Link to="/privacy" className="">
							Privacy Policy
						</Link>
					</div>
				</div>
			</div>

			<EpicToaster closeButton position="top-center" theme={theme} />
			<EpicProgress />
		</Document>
	)
}

function Logo() {
	return (
		<Link to="/" className="rounded-full bg-blue-500">
			<img
				src="/favicons/512x512.png"
				alt="good union jobs logo"
				// TODO Fix this to be dynamic
				// multiply by 0.4 of logo.png to get size used now
				width={60.8}
				height={56}
			/>
		</Link>
	)
}

function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<HoneypotProvider {...data.honeyProps}>
			<App />
		</HoneypotProvider>
	)
}

export default withSentry(AppWithProviders)

type KindeUser = NonNullable<
	Awaited<ReturnType<Awaited<ReturnType<typeof getKindeSession>>['getUser']>>
>

function UserDropdown({ user }: { user: KindeUser }) {
	const submit = useSubmit()
	const formRef = useRef<HTMLFormElement>(null)
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button asChild variant="secondary">
					<Link
						to={`/users/${user.id}`}
						// this is for progressive enhancement
						onClick={e => e.preventDefault()}
						className="flex items-center gap-2"
					>
						<img
							className="h-8 w-8 rounded-full object-cover"
							alt={user.given_name}
							src="/img/user.png"
						/>
						<span className="text-body-sm font-bold">{user.given_name}</span>
					</Link>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuPortal>
				<DropdownMenuContent sideOffset={8} align="start">
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to={`/users/${user.id}`}>
							<Icon className="text-body-md" name="avatar">
								Profile
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						asChild
						// this prevents the menu from closing before the form submission is completed
						onSelect={event => {
							event.preventDefault()
							submit(formRef.current)
						}}
					>
						<Form action="/logout" method="POST" ref={formRef}>
							<Icon className="text-body-md" name="exit">
								<button type="submit">
									{/* //TODO: Work on making this look like the format of login/register button */}
									<Link to={'/kinde-auth/logout'}>Logout</Link>
								</button>
							</Icon>
						</Form>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu>
	)
}

export function ErrorBoundary() {
	// the nonce doesn't rely on the loader so we can access that
	const nonce = useNonce()

	// NOTE: you cannot use useLoaderData in an ErrorBoundary because the loader
	// likely failed to run so we have to do the best we can.
	// We could probably do better than this (it's possible the loader did run).
	// This would require a change in Remix.

	// Just make sure your root route never errors out and you'll always be able
	// to give the user a better UX.

	return (
		<Document nonce={nonce}>
			<GeneralErrorBoundary />
		</Document>
	)
}
