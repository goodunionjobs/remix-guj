import { getKindeSession } from '@kinde-oss/kinde-remix-sdk'
import {
	json,
	type LoaderFunctionArgs,
	type HeadersFunction,
	type LinksFunction,
	type MetaFunction,
	type ActionFunctionArgs,
} from '@remix-run/node'
import {
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useSubmit,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { useRef } from 'react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import appleTouchIconAssetUrl from './assets/favicons/apple-touch-icon.png'
import faviconAssetUrl from './assets/favicons/favicon.svg'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { EpicProgress } from './components/progress-bar.tsx'
import { useToast } from './components/toaster.tsx'
import { Button } from './components/ui/button.tsx'
import DelayedPopupForm from './components/signup-popup-form.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuTrigger,
} from './components/ui/dropdown-menu.tsx'
import { Icon, href as iconsHref } from './components/ui/icon.tsx'
import { EpicToaster } from './components/ui/sonner.tsx'
import {
	ThemeSwitch,
	useOptionalTheme,
	useTheme,
} from './routes/resources+/theme-switch.tsx'
import tailwindStyleSheetUrl from './styles/tailwind.css?url'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { organizationSchema, description } from './utils/constants.tsx'
import { getEnv } from './utils/env.server.ts'
import { honeypot } from './utils/honeypot.server.ts'
import { combineHeaders, getDomainUrl } from './utils/misc.tsx'
import { useNonce } from './utils/nonce-provider.ts'
import { type Theme, getTheme } from './utils/theme.server.ts'
import { makeTimings } from './utils/timing.server.ts'
import { getToast } from './utils/toast.server.ts'
import {
	checkPopupStatus,
	dismissPopup,
	setPopupShown,
} from './utils/check-pop-up.server.ts'
import { useIsBot } from './utils/is-bot.context.tsx'

export const links: LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		{ rel: 'preload', href: iconsHref, as: 'image' },
		{
			rel: 'icon',
			href: '/favicon.ico',
			sizes: '48x48',
		},
		{ rel: 'icon', type: 'image/svg+xml', href: faviconAssetUrl },
		{ rel: 'apple-touch-icon', href: appleTouchIconAssetUrl },
		{
			rel: 'manifest',
			href: '/site.webmanifest',
			crossOrigin: 'use-credentials',
		} as const, // necessary to make typescript happy
		//TODO: Fix svg icon. Shows in chrome and other browsers small!
		// { rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
		{ rel: 'stylesheet', href: tailwindStyleSheetUrl },
	].filter(Boolean)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{
			title: data
				? 'Browse nationwide union jobs, get daily alerts - Good Union Jobs'
				: 'Error | Good Union Jobs',
		},
		{
			name: 'description',
			content:
				'GoodUnionJobs is your go-to platform for browsing union job postings across all industries nationwide. Stay updated with daily email alerts on the latest opportunities, ensuring you never miss a chance to find your next union job.',
		},
		{ 'script:ld+json': organizationSchema },
	]
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'closePopup') {
		return json(
			{ success: true },
			{
				headers: await setPopupShown(request), // This sets the cookie
			},
		)
	}

	// Handle other intents or return a default response
	return json({ success: false }, { status: 400 })
}

export async function loader({ request }: LoaderFunctionArgs) {
	const timings = makeTimings('root loader')

	const { getUser } = await getKindeSession(request)
	const user = await getUser()

	// Only check popup status if user is not logged in
	const { shouldShowSignupPopup } = !user
		? await checkPopupStatus(request)
		: { shouldShowSignupPopup: false }

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
			shouldShowSignupPopup,

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

function GoogleTagManager({
	nonce,
	GTM_ID,
}: {
	nonce: string
	GTM_ID: string
}) {
	return (
		<>
			<script
				nonce={nonce}
				dangerouslySetInnerHTML={{
					__html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GTM_ID}');
          `,
				}}
			/>
			<script
				nonce={nonce}
				async
				src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
			/>
		</>
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
	isBot,
}: {
	children: React.ReactNode
	nonce: string
	theme?: Theme
	env?: Record<string, string>
	isBot?: boolean
}) {
	const isClient = typeof document !== 'undefined'
	const allowIndexing = ENV.ALLOW_INDEXING !== 'false'

	return (
		<html
			lang="en"
			className={`${theme} h-full overflow-x-hidden ${isClient ? 'has-js' : ''}`}
		>
			<head>
				{/* //TODO: Shouldn't we add has-js if the person also chooses not to run js? */}
				{isBot ? null : (
					<script
						nonce={nonce}
						dangerouslySetInnerHTML={{
							__html: `document.documentElement.classList.add('has-js');`,
						}}
					/>
				)}
				<ClientHintCheck nonce={nonce} />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				{allowIndexing ? null : (
					<meta name="robots" content="noindex, nofollow" />
				)}
				<Meta />
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
				{/* TODO: Make tests on clicking on links, especially title of jobpost component,  
        and other places around website for when bot is true to make sure this work without javascript */}
				{isBot ? null : <Scripts nonce={nonce} />}
				{isBot ? null : (
					<GoogleTagManager nonce={nonce} GTM_ID="G-Y5XF93C0RL" />
				)}
			</body>
		</html>
	)
}

export function Layout({ children }: { children: React.ReactNode }) {
	// if there was an error running the loader, data could be missing
	const data = useLoaderData<typeof loader | null>()
	const nonce = useNonce()
	const theme = useOptionalTheme()
	const isBot = useIsBot()

	return (
		<Document nonce={nonce} theme={theme} isBot={isBot} env={data?.ENV}>
			{children}

			{/* //TODO: Most likely shouldn't we just load this up on pages like jobs, companies, and main page? Not in root */}
			<DelayedPopupForm
				shouldShow={data?.shouldShowSignupPopup}
				isBot={isBot}
				user={data?.user}
			/>
		</Document>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	// TODO: When theme button is clicked job details loads again like its being fetched when job post is open
	const theme = useTheme()
	// TODO: DELETE
	// const matches = useMatches()
	// const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
	// const searchBar = isOnSearchPage ? null : <SearchBar status="idle" />
	useToast(data.toast)

	return (
		<>
			<div className="flex min-h-screen flex-col justify-between">
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
							<Link
								to="/"
								className="hidden self-center md:block"
								aria-label="Good Union Jobs - Return to homepage"
							>
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
										{/* <Button */}
										{/* 	asChild */}
										{/* 	variant="default" */}
										{/* 	size="lg" */}
										{/* 	className="w-3/4 sm:w-full" */}
										{/* > */}
										{/* 	<Link to={'/kinde-auth/register'}> */}
										{/* 		Sign Up - Job Notifications 💼 */}
										{/* 	</Link> */}
										{/* </Button> */}
										<Button
											asChild
											variant="default"
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

				<div className="container mt-4 flex justify-between justify-items-center pb-5 sm:mt-6">
					<div className="flex items-center justify-items-center gap-4">
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

			<EpicToaster closeButton position="bottom-right" theme={theme} />
			<EpicProgress />
		</>
	)
}

function Logo() {
	return (
		<Link
			to="/"
			className="rounded-full bg-blue-500"
			aria-label="Good Union Jobs Logo - Return to homepage"
		>
			<img
				src="/favicons/512x512.png"
				alt="good union jobs logo"
				// TODO: Fix this to be dynamic
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
						{/* //TODO: Check if assceible and ok if div is around this. Removing it makes icon small */}
						<div>
							<button type="submit">
								<Icon className="mr-1.5 text-body-md" name="exit"></Icon>
								{/* //TODO: Work on making this look like the format of login/register button */}
								<Link to={'/kinde-auth/logout'}>Logout</Link>
							</button>
						</div>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu>
	)
}

// this is a last resort error boundary. There's not much useful information we
// can offer at this level.
export const ErrorBoundary = GeneralErrorBoundary
