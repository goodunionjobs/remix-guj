// File: app/components/jobs/shared-components.tsx

import { Link } from '@remix-run/react'
import dayjs from 'dayjs'
import { ApplyButton } from '#app/components/apply-button'
import { Attributes, DrizzleAttributes } from '#app/components/attributes'
import { FinalTime } from '#app/components/final-time'
import { LogoImage } from '#app/components/logo-image'
import { jobs } from '../../../drizzle/schema'
import { divBlock } from '../job-posts/jobblockcss'

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
		<div className={divBlock} style={{ background: color, color: textColor }}>
			<div className="flex h-24 flex-row items-stretch" onClick={onClick}>
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
		<div className={divBlock} style={{ background: color, color: textColor }}>
			<div className="flex h-24 flex-row items-stretch" onClick={onClick}>
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
			{objectID && (
				<div className="mb-2 mt-1 flex flex-col">
					<div className="text-center text-xl font-bold underline">
						Share this job:
					</div>
					<div
						onClick={e => {
							e.preventDefault()
							navigator.clipboard.writeText(`${baseUrl}jobs/${objectID}-${job}`)
						}}
						className="border-1.5 border-grey-400 mx-auto cursor-pointer justify-center rounded-md border bg-white px-2 text-base dark:bg-slate-800"
					>
						<Link
							to={`/jobs/${objectID}-${job}`}
							target="_blank"
							className="block max-w-sm select-all overflow-hidden whitespace-nowrap sm:max-w-xl"
						>
							{`${baseUrl}jobs/${objectID}-${job}`}
						</Link>
					</div>
				</div>
			)}
		</div>
	)
}

export function formatJobSlug(job: string) {
	return job.replace(/\s/g, '-').replace(/\//g, '_')
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
