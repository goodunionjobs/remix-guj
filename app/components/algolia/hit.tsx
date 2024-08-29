import { useFetcher, Link } from '@remix-run/react'
import { useState } from 'react'
import {
	JobHeader,
	JobDescription,
	calculateFinalTime,
} from '#app/components/algolia/jobpost-parts'
import { useTheme } from '#app/routes/resources+/theme-switch'
import { FindTextColor } from '#app/utils/find-text-color'
import { type HitProps } from '#app/utils/types'
import slugify from '@sindresorhus/slugify'

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
		window.history.pushState(
			{},
			'',
			`/jobs/${hit.objectID}-${slugify(hit.title)}`,
		)
	}

	const theme = useTheme()
	const lightColor = '#FFFFFF'
	const darkColor = '#000000'
	const color = hit.color
		? '#' + ('000000' + hit.color.toString(16)).slice(-6)
		: theme === 'light'
			? lightColor
			: '#0f172a'

	const textColor = FindTextColor(color, lightColor, darkColor)
	const finalTime = calculateFinalTime(hit.datestamp)

	const baseUrl =
		process.env.NODE_ENV === 'development'
			? 'http://localhost:3000/'
			: 'https://goodunionjobs.com/'

	return (
		<div aria-label="Job post">
			<div className="group pt-2" style={{ cursor: 'pointer' }}>
				<JobHeader
					color={color}
					textColor={textColor}
					employerImage={hit.employerImage}
					employer={hit.employer}
					hit={hit}
					finalTime={finalTime}
					url={hit.url}
					onClick={onClick}
				/>

				{/* TODO: Make the below expand if javascript is disabled and add in aria-expaned */}
				{showResults && (
					<JobDescription
						url={hit.url}
						baseUrl={baseUrl}
						description={descriptionFetcher.data?.description || ''}
						objectID={hit.objectID}
						job={slugify(hit.title)}
						isLoading={descriptionFetcher.state === 'loading'}
					/>
				)}
			</div>
		</div>
	)
}
