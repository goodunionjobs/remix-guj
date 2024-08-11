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

export function Hit({ hit }: HitProps) {
	const [showResults, setShowResults] = useState(false)
	const descriptionFetcher = useFetcher()

	const onClick = () => {
		setShowResults(!showResults)
		if (!showResults && hit.descripUrl) {
			descriptionFetcher.load(
				`/resources/job-description?descripUrl=${encodeURIComponent(hit.descripUrl)}`,
			)
		}
		// Update URL without navigation
		window.history.pushState(
			{},
			'',
			`/jobs/${hit.objectID}-${formatJobSlug(hit.title)}`,
		)
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

	const baseUrl =
		process.env.NODE_ENV === 'development'
			? 'http://localhost:3000/'
			: 'https://goodunionjobs.com/'

	const theme = useTheme()
	const lightColor = '#FFFFFF'
	const darkColor = '#000000'
	const color = hit.color
		? '#' + ('000000' + hit.color.toString(16)).slice(-6)
		: theme === 'light'
			? lightColor
			: '#0f172a'

	const textColor = FindTextColor(color, lightColor, darkColor)

	return (
		<div aria-label="Job post">
			<div className="group pt-2" style={{ cursor: 'pointer' }}>
				<div
					className={divBlock}
					style={{ background: color, color: textColor }}
				>
					<div className="flex h-24 flex-row items-stretch" onClick={onClick}>
						<LogoImage
							employerImage={hit.employerImage}
							employer={hit.employer}
							size={53}
							layout="flex"
						/>
						<Attributes
							hit={hit}
							minSalary={hit.minSalary}
							maxSalary={hit.maxSalary}
							state={hit.state}
							employmentType={hit.employmentType}
							employer={hit.employer}
							title={hit.title}
						/>
						<FinalTime finalTime={finalTime} />
						<ApplyButton
							url={hit.url}
							handleButtonClick={e => e.stopPropagation()} // Prevent job expansion when clicking on buttons
							textColor={textColor}
						/>
					</div>
				</div>
				<BodyText
					url={hit.url}
					baseUrl={baseUrl} // Make sure this is defined or passed as a prop
					description={descriptionFetcher.data?.description || ''}
					objectID={hit.objectID}
					handleButtonClick={e => e.stopPropagation()} // Prevent the onClick from firing when clicking the apply button
					showResults={showResults}
					job={formatJobSlug(hit.title)}
					isLoading={descriptionFetcher.state === 'loading'}
				/>
			</div>
		</div>
	)
}
