import './job_post.css'
import { Link } from '@remix-run/react'
import { Highlight } from 'react-instantsearch'
import { type HitProps } from '#app/utils/types.tsx'
import { type jobs } from '../../drizzle/schema'
import { Icon } from './ui/icon'

function formatSalaryInThousands(salary: number): string {
	// Round to the nearest thousand
	const roundedSalary = Math.round(salary / 1000)

	// Format with dollar sign and add 'K' suffix
	return `${roundedSalary}K`
}

function formatSalaryRange(
	minSalary?: number | null,
	maxSalary?: number | null,
): string | null {
	// Only format if both minSalary and maxSalary are present and not null
	if (minSalary != null && maxSalary != null) {
		const formattedMin = formatSalaryInThousands(minSalary)
		const formattedMax = formatSalaryInThousands(maxSalary)
		return `${formattedMin}-${formattedMax}`
	}

	// Return null if either salary is missing or null
	return null
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

export function DrizzleAttributes({
	hit,
	minSalary,
	maxSalary,
	state,
	employmentType,
	employer,
	title,
}: {
	hit?: SelectJob
	minSalary?: number | null
	maxSalary?: number | null
	state: string
	employmentType: string
	employer: string
	title: string
}) {
	const salaryRangeStr = formatSalaryRange(minSalary, maxSalary)

	return (
		<>
			<div className="flex-auto self-center">
				<p className="font-Atkinson line-clamp-2 text-sm leading-none sm:leading-tight">
					{employer}
				</p>
				<p className="font-Atkinson mb-1.5 line-clamp-2 text-sm font-bold leading-none sm:text-lg sm:leading-tight">
					{title}
				</p>
				{minSalary === null ||
				(minSalary === undefined && maxSalary === null) ||
				maxSalary === undefined ? (
					<span className="hidden"></span>
				) : (
					<span className="font-Atkinson inline-flex items-center whitespace-nowrap rounded-sm bg-gray-200 px-1 py-0.5 text-xs font-bold text-black sm:text-sm">
						<Icon className="mr-0.5 h-4 w-4" name="circle-dollar-sign" />
						{salaryRangeStr}
					</span>
				)}
				{state === '' || state === null ? (
					<span className="hidden"></span>
				) : (
					<span className="font-Atkinson mx-1 inline-flex items-center whitespace-nowrap rounded-sm bg-gray-200 px-1 py-0.5 text-xs font-bold text-black sm:text-sm">
						<Icon className="mr-0.5 h-4 w-4" name="map-pin" />
						{state}
					</span>
				)}
				{employmentType === '' || employmentType === null ? (
					<span className="hidden"></span>
				) : (
					<span className="font-Atkinson inline-flex items-center whitespace-nowrap rounded-sm bg-gray-200 px-1 py-0.5 text-xs font-bold text-black sm:text-sm">
						<Icon className="mr-0.5 h-4 w-4" name="briefcase-business" />
						{employmentType}
					</span>
				)}
			</div>
		</>
	)
}

export function Attributes({
	hit,
	minSalary,
	maxSalary,
	state,
	employmentType,
	employer,
	title,
}: {
	hit: HitProps['hit']
	minSalary?: number
	maxSalary?: number
	state: string
	employmentType: string
	employer: string
	title: string
}) {
	const salaryRangeStr = formatSalaryRange(minSalary, maxSalary)

	return (
		<>
			<div className="flex-auto self-center">
				<p className="font-Atkinson line-clamp-2 text-sm leading-none sm:leading-tight">
					{hit ? <Highlight attribute="employer" hit={hit} /> : employer}
				</p>
				<Link
					itemProp="url"
					to={`/jobs/${hit.objectID}-${hit.title}`}
					className="job-post_ahref font-Atkinson mb-1.5 line-clamp-2 text-sm font-bold leading-none sm:text-lg sm:leading-tight"
				>
					{hit ? <Highlight attribute="title" hit={hit} /> : title}
				</Link>
				{minSalary === 0 && maxSalary === 0 ? (
					<span className="hidden"></span>
				) : (
					<span className="font-Atkinson inline-flex items-center whitespace-nowrap rounded-sm bg-gray-200 px-1 py-0.5 text-xs font-bold text-black sm:text-sm">
						<Icon className="mr-0.5 h-4 w-4" name="circle-dollar-sign" />
						{salaryRangeStr}
					</span>
				)}
				{state === '' || state === null ? (
					<span className="hidden"></span>
				) : (
					<span className="font-Atkinson mx-1 inline-flex items-center whitespace-nowrap rounded-sm bg-gray-200 px-1 py-0.5 text-xs font-bold text-black sm:text-sm">
						<Icon className="mr-0.5 h-4 w-4" name="map-pin" />
						{state}
					</span>
				)}
				{employmentType === '' || employmentType === null ? (
					<span className="hidden"></span>
				) : (
					<span className="font-Atkinson inline-flex items-center whitespace-nowrap rounded-sm bg-gray-200 px-1 py-0.5 text-xs font-bold text-black sm:text-sm">
						<Icon className="mr-0.5 h-4 w-4" name="briefcase-business" />
						{employmentType}
					</span>
				)}
			</div>
		</>
	)
}
