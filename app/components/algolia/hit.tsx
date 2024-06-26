import { useFetcher } from '@remix-run/react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTheme } from '#app/routes/resources+/theme-switch.tsx'
import { FindTextColor } from '#app/utils/find-text-color.tsx'
import type { HitProps } from '#app/utils/types.tsx'
import { ApplyButton } from '../apply-button.tsx'
import { Attributes } from '../attributes.tsx'
import { BodyText } from '../body-text.tsx'
import { FinalTime } from '../final-time.tsx'
import { divBlock } from '../job-posts/jobblockcss.ts'
import { LogoImage } from '../logo-image.tsx'
// import { generateJobPostingStructuredData } from '~/utils/json-schema.tsx'

export function Hit({ hit }: HitProps) {
	//TODO: Make function
	// const descripFetcher = useFetcher<typeof jobDescripLoader>()
	// const [showResults, setShowResults] = useState(false)
	// const [fetchedObjectIds, setFetchedObjectIds] = useState<
	// 	Record<string, boolean>
	// >({})
	//
	// const onClick = (objectID: string, job: string) => {
	// 	setShowResults(!showResults)
	// 	window.history.replaceState({}, '', `/jobs/${objectID}-${job}`)
	//
	// 	if (objectID && !fetchedObjectIds[objectID]) {
	// 		descripFetcher.load('/resources/download-job-descrip')
	// 		setFetchedObjectIds(prev => ({ ...prev, [objectID]: true }))
	// 	}
	// }

	const handleButtonClick = (event: { stopPropagation: () => void }) => {
		event.stopPropagation()
	}

	const formatJobSlug = (job: string) =>
		job.replace(/\s/g, '-').replace(/\//g, '_')

	enum TimeFormat {
		Hour = 'hr',
		Day = 'd',
		Month = 'mo',
		Year = 'yr',
	}

	const now = dayjs()
	const datestamp = dayjs.unix(hit.datestamp)
	let finalTime: [number, TimeFormat] = [0, TimeFormat.Hour]

	const hourDiff = now.diff(datestamp, 'hour')
	const dayDiff = now.diff(datestamp, 'day')
	const monthDiff = now.diff(datestamp, 'month')
	const yearDiff = now.diff(datestamp, 'year')

	if (hourDiff < 24) {
		finalTime = [hourDiff, TimeFormat.Hour]
	} else if (dayDiff < 31) {
		finalTime = [dayDiff, TimeFormat.Day]
	} else if (monthDiff < 12) {
		finalTime = [monthDiff, TimeFormat.Month]
	} else if (yearDiff) {
		finalTime = [yearDiff, TimeFormat.Year]
	}

	const baseURL =
		process.env.NODE_ENV === 'development'
			? 'http://localhost:3000/'
			: 'https://goodunionjobs.com/'

	const finalImage: string[] = hit.image.map(el =>
		el
			.replace(
				'https://goodunionjobs.s3.amazonaws.com/',
				'https://goodunionjobs.com/',
			) // Always prod url because cached
			.replace(/%20/g, '+'),
	)

	const theme = useTheme()
	const lightColor = '#FFFFFF'
	const darkColor = '#000000'
	const color = hit.color
		? '#' + ('000000' + hit.color.toString(16)).slice(-6)
		: theme === 'light'
			? lightColor
			: '#0f172a'

	console.log(hit.color, 'color here')

	// For some reason until you fix colors function doesnt work :)
	const textColor = FindTextColor(color, lightColor, darkColor)

	return (
		<div aria-label="Job post">
			{/* <script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(JobPostingStructuredData),
				}}
			/> */}
			<div
				className="group pt-2"
				//TODO: Make function
				// onClick={() => onClick(hit.objectID, formatJobSlug(hit.job))}
				onClick={() => console.log}
			>
				<div
					className={divBlock}
					style={{ background: color, color: textColor }}
				>
					<div className="flex h-24 flex-row items-stretch">
						<LogoImage
							finalImage={finalImage}
							employer={hit.employer}
							size={53}
							layout="flex"
						/>
						<Attributes
							hit={hit}
							salary={hit.salary}
							state={hit.state}
							employmentType={hit.employmentType}
							employer={hit.employer}
							job={hit.job}
						/>
						<FinalTime finalTime={finalTime} />
						<ApplyButton
							url={hit.url}
							handleButtonClick={handleButtonClick}
							textColor={textColor}
						/>
					</div>
				</div>
				<BodyText
					url={hit.url}
					baseUrl={baseURL}
					description={hit.description}
					objectID={hit.objectID}
					handleButtonClick={handleButtonClick}
					//TODO: Make work
					// showResults={showResults}
					job={formatJobSlug(hit.job)}
				/>
			</div>
		</div>
	)
}
