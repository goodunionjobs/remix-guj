// import { invariant } from '@epic-web/invariant'
// import {
// 	type LoaderFunctionArgs,
// 	type MetaFunction,
// 	json,
// } from '@remix-run/node'
// import { sql } from 'drizzle-orm'
// import { type Timings } from '#app/utils/timing.server'
// import { db } from '#app/utils/db.server'
// import type { InferSelectModel } from 'drizzle-orm'
// import { employers, guilds } from '../../../drizzle/schema'
// import { Link } from '@remix-run/react'
// import { useLoaderData } from '@remix-run/react'
// import { Button } from '#app/components/ui/button.tsx'
// import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
// import { Icon } from '#app/components/ui/icon.tsx'
// import { LogoImage } from '#app/components/logo-image.tsx'
// import { useMemo } from 'react'
// import slugify from '@sindresorhus/slugify'
// import { cachified, cache } from '#app/utils/cache.server'
//
// // Meta function
// export const meta: MetaFunction<typeof loader> = ({ data }) => {
// 	return [
// 		{
// 			title: `Good Union Jobs - ${data?.guild.name} Opportunities`,
// 		},
// 		{
// 			name: 'description',
// 			content: `Explore union job opportunities with ${data?.guild.name}. GoodUnionJobs offers daily updated job postings with union benefits across various industries nationwide.`,
// 		},
// 		{
// 			name: 'keywords',
// 			content: `${data?.guild.name}, union jobs, job opportunities, career, employment, benefits`,
// 		},
// 	]
// }
//
// async function fetchGuildData(unionName: string, timings: Timings) {
// 	const normalizedUnionName = unionName
// 		.toLowerCase()
// 		.trim()
// 		.replace(/\s+/g, ' ')
// 	console.log('🔍 DB: Querying guild:', normalizedUnionName)
//
// 	return cachified({
// 		key: `guild-data:${normalizedUnionName}`,
// 		cache,
// 		timings,
// 		ttl: 1000 * 60 * 60,
// 		staleWhileRevalidate: 1000 * 60 * 60 * 24,
// 		getFreshValue: async () => {
// 			// First get the guild
// 			const guild = await db.query.guilds.findFirst({
// 				where: sql`lower(${guilds.name}) = ${normalizedUnionName}`,
// 			})
//
// 			if (!guild) throw new Error('Union not found')
//
// 			// Then fetch associated employers separately
// 			const relatedEmployers = await db.query.employers.findMany({
// 				where: sql`${employers.guildId} = ${guild.id}`,
// 			})
//
// 			// Manually combine the results
// 			return {
// 				...guild,
// 				employers: relatedEmployers,
// 			}
// 		},
// 		checkValue: value => value !== null && typeof value === 'object',
// 	})
// }
//
// export const loader = async ({ params, request }: LoaderFunctionArgs) => {
// 	invariant(params.union, 'Union name is required')
//
// 	// Extract ID from the URL parameter (format: "123-union-name")
// 	const match = params.union.match(/^(\d+)-(.+)$/)
// 	if (!match) {
// 		throw json({ message: 'Invalid union ID format' }, { status: 400 })
// 	}
//
// 	const unionId = parseInt(match[1], 10)
// 	if (isNaN(unionId)) {
// 		throw json({ message: 'Invalid union ID' }, { status: 400 })
// 	}
//
// 	const url = new URL(request.url)
// 	const baseUrl = `${url.protocol}//${url.host}`
//
// 	const timings: Timings = {}
//
// 	try {
// 		// First get the guild by ID
// 		const guild = await db.query.guilds.findFirst({
// 			where: sql`${guilds.id} = ${unionId}`,
// 		})
//
// 		if (!guild) throw new Error('Union not found')
//
// 		// Then fetch associated employers separately
// 		const relatedEmployers = await db.query.employers.findMany({
// 			where: sql`${employers.guildId} = ${guild.id}`,
// 		})
//
// 		// Manually combine the results
// 		const guildWithEmployers = {
// 			...guild,
// 			employers: relatedEmployers,
// 		}
//
// 		return json({
// 			guild: guildWithEmployers,
// 			baseUrl,
// 		})
// 	} catch (error) {
// 		console.error('❌ Loader Error:', error)
// 		if (error instanceof Error && error.message === 'Union not found') {
// 			throw json({ message: 'Union not found' }, { status: 404 })
// 		}
// 		throw json({ message: 'An unexpected error occurred' }, { status: 500 })
// 	}
// }
//
// type Guild = InferSelectModel<typeof guilds> & {
// 	employers: Array<InferSelectModel<typeof employers>>
// }
//
// type LoaderData = {
// 	guild: Guild
// 	baseUrl: string
// }
//
// export default function UnionRoute() {
// 	const { guild, baseUrl } = useLoaderData<LoaderData>()
// 	const displayName = guild.name || ''
//
// 	// Sort employers alphabetically by name
// 	const sortedEmployers = useMemo(() => {
// 		return [...guild.employers].sort((a, b) => a.name.localeCompare(b.name))
// 	}, [guild.employers])
//
// 	return (
// 		<div className="flex flex-col">
// 			{/* Hero Section */}
// 			<header className="bg-gradient-to-r from-blue-700/70 to-blue-500/70 py-10 text-white">
// 				<div className="container mx-auto px-4">
// 					<div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 md:flex-row">
// 						<div className="flex-grow">
// 							<h1
// 								className="mb-3 text-3xl font-bold md:text-4xl"
// 								itemProp="name"
// 							>
// 								{displayName} Union Jobs
// 							</h1>
// 							<div className="flex items-center">
// 								<Icon name="building-2" className="mr-2 h-4 w-4" />
// 								<span className="text-base">
// 									{sortedEmployers.length}{' '}
// 									{sortedEmployers.length === 1 ? 'Employer' : 'Employers'}
// 								</span>
// 							</div>
// 						</div>
// 					</div>
// 				</div>
// 			</header>
//
// 			{/* About Section */}
// 			<section
// 				className="bg-white py-10 dark:bg-gray-800"
// 				itemScope
// 				itemType="https://schema.org/Organization"
// 			>
// 				<div className="container mx-auto px-4">
// 					<div className="mx-auto max-w-3xl">
// 						<h2 className="mb-4 text-2xl font-bold" itemProp="name">
// 							About {displayName}
// 						</h2>
//
// 						<div
// 							className="prose prose-sm dark:prose-invert max-w-none"
// 							itemProp="description"
// 						>
// 							<p>
// 								{displayName} is dedicated to representing workers and ensuring
// 								fair labor practices. Union members benefit from collective
// 								bargaining, which provides stronger job protections, better
// 								wages, and comprehensive benefits.
// 							</p>
// 							<p>
// 								Through {displayName}, employees have access to a wide range of
// 								job opportunities across different employers while maintaining
// 								union membership benefits. Browse the employers below to explore
// 								specific job openings.
// 							</p>
// 						</div>
// 					</div>
// 				</div>
// 			</section>
//
// 			{/* Employers Section */}
// 			<section className="bg-gray-50 py-10 dark:bg-gray-900">
// 				<div className="container mx-auto px-4">
// 					<div className="mx-auto max-w-5xl">
// 						<h2 className="mb-6 text-2xl font-bold">{displayName} Employers</h2>
//
// 						{sortedEmployers.length === 0 ? (
// 							<div className="rounded-lg border bg-card p-6 text-center">
// 								<h3 className="mb-2 text-lg font-semibold">
// 									No employers found
// 								</h3>
// 								<p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
// 									There are currently no employers associated with this union.
// 								</p>
// 								<Link to="/" prefetch="intent">
// 									<Button size="sm">Browse All Jobs</Button>
// 								</Link>
// 							</div>
// 						) : (
// 							<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
// 								{sortedEmployers.map(employer => {
// 									const companySlug = slugify(employer.name)
// 									const companyUrl = `/company/${companySlug}`
//
// 									return (
// 										<Link
// 											key={employer.id}
// 											to={`/companies/${employer.id}-${slugify(employer.name)}`}
// 											prefetch="intent"
// 											className="flex flex-col items-center rounded-lg border bg-white p-4 transition-all hover:shadow-md dark:bg-gray-800"
// 										>
// 											<div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
// 												{employer.s3Link ? (
// 													<LogoImage
// 														employerImage={employer.s3Link}
// 														employer={employer.name}
// 														size={64}
// 														layout="grid"
// 													/>
// 												) : (
// 													<Icon name="home" className="h-8 w-8 text-gray-400" />
// 												)}
// 											</div>
// 											<h3 className="text-center text-base font-medium">
// 												{employer.name}
// 											</h3>
// 										</Link>
// 									)
// 								})}
// 							</div>
// 						)}
// 					</div>
// 				</div>
// 			</section>
//
// 			{/* Job Alerts Section */}
// 			<section className="bg-blue-50 py-8 dark:bg-blue-900">
// 				<div className="container mx-auto px-4">
// 					<div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
// 						<h2 className="mb-3 text-xl font-bold">
// 							Sign Up for {displayName} Job Alerts
// 						</h2>
// 						<p className="mb-4 text-sm">
// 							Register now and get personalized {displayName} job postings
// 							delivered straight to your inbox.
// 						</p>
// 						<div className="flex flex-col space-y-3 md:flex-row md:space-x-3 md:space-y-0">
// 							<Link to="/kinde-auth/register">
// 								<Button type="submit" className="text-sm md:w-auto">
// 									Sign Up for Job Alerts Now
// 								</Button>
// 							</Link>
// 						</div>
// 					</div>
// 				</div>
// 			</section>
// 		</div>
// 	)
// }
//
// export function ErrorBoundary() {
// 	return (
// 		<GeneralErrorBoundary
// 			statusHandlers={{
// 				400: () => (
// 					<div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
// 						<div className="w-full max-w-md space-y-8">
// 							<div className="text-center">
// 								<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
// 									Invalid Union ID
// 								</h2>
// 								<p className="mt-2 text-2xl text-gray-600">
// 									The union ID you've entered is not in the correct format.
// 								</p>
// 							</div>
// 							<div className="mt-8 space-y-6">
// 								<div className="flex justify-center">
// 									<Button asChild>
// 										<Link to="/" reloadDocument>
// 											<Icon className="mr-2 h-4 w-4" name="home" />
// 											Go back home
// 										</Link>
// 									</Button>
// 								</div>
// 							</div>
// 						</div>
// 					</div>
// 				),
// 				404: () => (
// 					<div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
// 						<div className="w-full max-w-md space-y-8">
// 							<div className="text-center">
// 								<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
// 									Union Page Not Found
// 								</h2>
// 								<p className="mt-2 text-2xl text-gray-600">
// 									The union you're looking for doesn't exist or has been
// 									removed.
// 								</p>
// 							</div>
// 							<div className="mt-8 space-y-6">
// 								<div className="flex justify-center">
// 									<Button asChild>
// 										<Link to="/" reloadDocument>
// 											<Icon className="mr-2 h-4 w-4" name="home" />
// 											Go back home
// 										</Link>
// 									</Button>
// 								</div>
// 							</div>
// 						</div>
// 					</div>
// 				),
// 			}}
// 		/>
// 	)
// }
