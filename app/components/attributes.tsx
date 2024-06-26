import { Highlight  } from 'react-instantsearch'
import type { HitProps } from '#app/utils/types.tsx'

export function Attributes({
	hit,
	salary,
	state,
	employmentType,
	employer,
	job,
}: {
	hit?: HitProps['hit']
	salary: string
	state: string
	employmentType: string
	employer: string
	job: string
}) {
	return (
		<>
			<div className="flex-auto self-center">
				<p className="font-Atkinson line-clamp-2 text-sm leading-none sm:leading-tight">
					{hit ? <Highlight attribute="employer" hit={hit} /> : employer}
				</p>
				<p className="font-Atkinson line-clamp-2 text-sm font-bold leading-none sm:text-lg sm:leading-tight">
					{hit ? <Highlight attribute="job" hit={hit} /> : job}
				</p>
				{salary === '' || salary === null ? (
					<span className="hidden"></span>
				) : (
					<span
						className="font-Atkinson whitespace-nowrap rounded-sm border-2 border-solid border-black bg-gray-200 px-1
                  pt-0.5 text-xs font-bold text-black sm:text-sm"
					>
						💰{salary}
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
