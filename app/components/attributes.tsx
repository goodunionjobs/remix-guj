import { Highlight } from 'react-instantsearch'
import type { HitProps } from '#app/utils/types.tsx'

function formatSalaryInThousands(salary: number): string {
	// Round to the nearest thousand
	const roundedSalary = Math.round(salary / 1000)

	// Format with dollar sign and add 'K' suffix
	return `$${roundedSalary}K`
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

export function Attributes({
	hit,
	minSalary,
	maxSalary,
	state,
	employmentType,
	employer,
	title,
}: {
	hit?: HitProps['hit']
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
				<p className="font-Atkinson line-clamp-2 text-sm font-bold leading-none sm:text-lg sm:leading-tight">
					{hit ? <Highlight attribute="title" hit={hit} /> : title}
				</p>
				{minSalary === null && maxSalary === null ? (
					<span className="hidden"></span>
				) : (
					<span
						className="font-Atkinson whitespace-nowrap rounded-sm border-2 border-solid border-black bg-gray-200 px-1
                  pt-0.5 text-xs font-bold text-black sm:text-sm"
					>
						💰{salaryRangeStr}
					</span>
				)}
				{state === '' || state === null ? (
					<span className="hidden"></span>
				) : (
					<span
						className="font-Atkinson mx-1 whitespace-nowrap rounded-sm border-2 border-solid border-black bg-gray-200
                  px-1 pt-0.5 text-xs font-bold text-black sm:text-sm"
					>
						📌{state}
					</span>
				)}
				{employmentType === '' || employmentType === null ? (
					<span className="hidden"></span>
				) : (
					<span
						className="font-Atkinson whitespace-nowrap rounded-sm border-2 border-solid border-black bg-gray-200 px-1
                  pt-0.5 text-xs font-bold text-black sm:text-sm"
					>
						🕑{employmentType}
					</span>
				)}
			</div>
		</>
	)
}
