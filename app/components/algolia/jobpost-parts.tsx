// File: app/components/jobs/shared-components.tsx
import dayjs from 'dayjs'
import { ApplyButton } from '#app/components/apply-button'
import { Attributes, DrizzleAttributes } from '#app/components/attributes'
import { FinalTime } from '#app/components/final-time'
import { LogoImage } from '#app/components/logo-image'
import { jobs } from '../../../drizzle/schema'
import { Icon } from '#app/components/ui/icon.tsx'

enum TimeFormat {
	Hour = 'hr',
	Day = 'd',
	Month = 'mo',
	Year = 'yr',
}

// First, infer the base type from your schema
type BaseSelectJob = typeof jobs.$inferSelect

// Create a type that represents the JSON version of our job object
type JsonJob = {
	[K in keyof BaseSelectJob]: BaseSelectJob[K] extends Date
		? string
		: BaseSelectJob[K]
}

// Create a union type that can be either the base type or the JSON type
export type SelectJob = BaseSelectJob | JsonJob

//TODO: Combine with otherJobHeader
export function JobHeaderDrizzle({
	color,
	textColor,
	employerImage,
	employer,
	hit,
	finalTime,
	url,
	onClick,
}: {
	color: string
	textColor: string
	employerImage: string
	employer: string
	//TODO: Make this hit better than above selection for types
	hit: any
	finalTime: [number, TimeFormat]
	url: string
	onClick?: () => void
}) {
	return (
		<div
			className="border-grey-200 border-1 relative z-10 h-max overflow-hidden rounded-md border text-black shadow-xl transition duration-300 ease-out dark:shadow-slate-800/60 lg:hover:transform-none lg:active:translate-x-0.5 lg:active:translate-y-0.5 2xl:hover:translate-x-0.5 2xl:hover:translate-y-0.5 2xl:active:translate-x-1 2xl:active:translate-y-1"
			style={{ background: color, color: textColor }}
		>
			<div className="flex h-24 flex-row items-center" onClick={onClick}>
				<LogoImage
					employerImage={employerImage}
					employer={employer}
					size={53}
					layout="flex"
				/>
				<DrizzleAttributes
					hit={hit}
					minSalary={hit.minSalary}
					maxSalary={hit.maxSalary}
					state={hit.address.state.name}
					employmentType={hit.employmentType}
					employer={employer}
					title={hit.title}
				/>
				<FinalTime finalTime={finalTime} />
				<ApplyButton
					url={url}
					handleButtonClick={e => e.stopPropagation()}
					textColor={textColor}
				/>
			</div>
		</div>
	)
}

export function JobHeader({
	color,
	textColor,
	employerImage,
	employer,
	hit,
	finalTime,
	url,
	onClick,
}: {
	color: string
	textColor: string
	employerImage: string
	employer: string
	hit: any //TODO: ? Replace 'any' with a more specific type
	finalTime: [number, TimeFormat]
	url: string
	onClick?: () => void
}) {
	return (
		<div
			className="border-grey-200 border-1 relative z-10 h-max overflow-hidden rounded-md border text-black shadow-xl transition duration-300 ease-out dark:shadow-slate-800/60 lg:hover:transform-none lg:active:translate-x-0.5 lg:active:translate-y-0.5 2xl:hover:translate-x-0.5 2xl:hover:translate-y-0.5 2xl:active:translate-x-1 2xl:active:translate-y-1"
			style={{ background: color, color: textColor }}
		>
			<div className="flex h-24 flex-row items-center" onClick={onClick}>
				<LogoImage
					employerImage={employerImage}
					employer={employer}
					size={53}
					layout="flex"
				/>
				<Attributes
					hit={hit}
					minSalary={hit.minSalary}
					maxSalary={hit.maxSalary}
					state={hit.state}
					employmentType={hit.employmentType}
					employer={employer}
					title={hit.title}
				/>
				<FinalTime finalTime={finalTime} />
				<ApplyButton
					url={url}
					handleButtonClick={e => e.stopPropagation()}
					textColor={textColor}
				/>
			</div>
		</div>
	)
}

export function JobDescription({
	description,
	url,
	baseUrl,
	objectID,
	job,
	isLoading,
}: {
	description: string
	url?: string
	baseUrl: string
	objectID?: string
	job?: string
	isLoading?: boolean
}) {
	const socialIcons = [
		{ name: 'twitter', icon: 'social-x' },
		{ name: 'facebook', icon: 'social-facebook' },
		{ name: 'linkedin', icon: 'social-linkedin' },
		{ name: 'reddit', icon: 'social-reddit' },
	] as const
	return (
		<div className="light:bg-white light:border-black dark:border-gray -my-2 mr-2 w-full rounded-lg border-2 border-solid py-4 text-sm dark:bg-slate-900 sm:text-base">
			{url && (
				<div className="flex">
					<a
						href={url}
						className="light:bg-yellow-100 mx-auto mb-1 justify-center rounded-md border-2 border-solid border-black px-2 text-2xl font-bold hover:bg-white dark:bg-blue-600"
					>
						Apply 📎
					</a>
				</div>
			)}
			<div className="flex justify-center">
				{isLoading ? (
					<div
						className="prose prose-neutral prose-p:text-black mx-auto max-w-prose pl-2 pr-1 sm:mx-3"
						style={{ wordBreak: 'break-word' }}
					>
						Loading...
					</div>
				) : (
					<div
						className="prose prose-neutral prose-p:text-black mx-auto max-w-prose pl-2 pr-1 sm:mx-3"
						style={{ wordBreak: 'break-word' }}
						dangerouslySetInnerHTML={{ __html: description }}
					/>
				)}
			</div>
		</div>
	)
}

export function calculateFinalTime(timestamp: number): [number, TimeFormat] {
	const now = dayjs()
	const datestamp = dayjs.unix(timestamp)
	const hourDiff = now.diff(datestamp, 'hour')
	const dayDiff = now.diff(datestamp, 'day')
	const monthDiff = now.diff(datestamp, 'month')
	const yearDiff = now.diff(datestamp, 'year')

	//TODO: Correct way to use enum? Shoudl I even use enum?
	if (hourDiff < 24) return [hourDiff, TimeFormat.Hour]
	if (dayDiff < 31) return [dayDiff, TimeFormat.Day]
	if (monthDiff < 12) return [monthDiff, TimeFormat.Month]
	return [yearDiff, TimeFormat.Year]
}

// {objectID && (
// 	//TODO: Work on just making a button that says, maybe, "Click to Copy and share?"
// 	{/* <section className="mx-auto mt-4 w-fit overflow-hidden rounded-lg border border-gray-200 bg-transparent dark:border-white/10"> */}
// 	{/* 	<div className="flex flex-col items-center justify-center gap-4 p-4 sm:flex-row"> */}
// 	{/* 		<div className="flex items-center gap-1 whitespace-nowrap text-sm"> */}
// 	{/* 			<svg */}
// 	{/* 				xmlns="http://www.w3.org/2000/svg" */}
// 	{/* 				viewBox="0 0 20 20" */}
// 	{/* 				fill="currentColor" */}
// 	{/* 				className="h-5 w-5 animate-pulse text-rose-400/90" */}
// 	{/* 			> */}
// 	{/* 				<path */}
// 	{/* 					fillRule="evenodd" */}
// 	{/* 					d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" */}
// 	{/* 					clipRule="evenodd" */}
// 	{/* 				/> */}
// 	{/* 			</svg> */}
// 	{/* 			Share with friends */}
// 	{/* 		</div> */}
// 	{/* 		<div className="flex flex-wrap items-center justify-center gap-2"> */}
// 	{/* 			{socialIcons.map(({ name, icon }) => ( */}
// 	{/* 				<a */}
// 	{/* 					key={name} */}
// 	{/* 					href={`https://${name}.com/share?url=https%3A%2F%2Fwww.epicreact.dev%2Freact-19-cheatsheet`} */}
// 	{/* 					className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700" */}
// 	{/* 					target="_blank" */}
// 	{/* 					rel="noopener noreferrer" */}
// 	{/* 				> */}
// 	{/* 					<span className="sr-only">share on {name}</span> */}
// 	{/* 					<Icon name={icon} className="h-4 w-4" /> */}
// 	{/* 				</a> */}
// 	{/* 			))} */}
// 	{/* 			<button */}
// 	{/* 				type="button" */}
// 	{/* 				className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700" */}
// 	{/* 			> */}
// 	{/* 				<span className="sr-only">copy url to clipboard</span> */}
// 	{/* 				<Icon name="social-link" className="h-4 w-4" /> */}
// 	{/* 			</button> */}
// 	{/* 		</div> */}
// 	{/* 	</div> */}
// 	{/* </section> */}
// )}
