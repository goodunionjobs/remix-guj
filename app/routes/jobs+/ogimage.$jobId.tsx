import fs from 'fs/promises'
import path from 'path'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Resvg } from '@resvg/resvg-js'
import { eq } from 'drizzle-orm'
import satori, { type SatoriOptions } from 'satori'
import { db } from '#app/utils/db.server'
import { jobs } from '../../../drizzle/schema'

type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

async function getFont(
	font: string,
	weights: Weight[] = [400, 700],
): Promise<SatoriOptions['fonts']> {
	const css = await fetch(
		`https://fonts.googleapis.com/css2?family=${font}:wght@${weights.join(';')}`,
	).then(res => res.text())

	const resource = css.matchAll(
		/src: url\((.+)\) format\('(opentype|truetype)'\)/g,
	)

	return Promise.all(
		[...resource].map(async ([_, url], i) => ({
			name: font,
			style: 'normal',
			weight: weights[i],
			data: await fetch(url).then(res => res.arrayBuffer()),
		})),
	)
}

async function loadLocalEmoji(filename: string): Promise<string> {
	const filePath = path.resolve('public', 'img', 'emojis', filename)
	const fileData = await fs.readFile(filePath)
	const base64 = fileData.toString('base64')
	return `data:image/png;base64,${base64}`
}
async function fetchImageAsDataUri(url: string): Promise<string | null> {
	try {
		const response = await fetch(url)
		console.log('HERE IS THE URL: ', url)
		if (!response.ok) {
			console.error(
				`Failed to fetch image: ${response.status} ${response.statusText}`,
			)
			return null
		}
		const arrayBuffer = await response.arrayBuffer()
		const base64 = Buffer.from(arrayBuffer).toString('base64')
		const mimeType = response.headers.get('content-type') || 'image/jpeg'
		return `data:${mimeType};base64,${base64}`
	} catch (error) {
		console.error('Error fetching image:', error)
		return null
	}
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { jobId } = params

	const url = new URL(request.url)
	// Extract job ID and title from the URL
	const jobIdNumber = parseInt(jobId?.split('-')[0] || '', 10)
	if (isNaN(jobIdNumber)) {
		throw json({ error: 'Invalid job ID' }, { status: 400 })
	}

	// Fetch the job from the database
	const job = await db.query.jobs.findFirst({
		where: eq(jobs.id, jobIdNumber),
		with: {
			address: {
				with: {
					city: true,
					state: true,
					country: true,
				},
			},
			employer: true,
		},
	})

	if (!job) {
		throw json({ error: 'Job not found' }, { status: 404 })
	}

	const minSalary = job.minSalary
	const maxSalary = job.maxSalary

	const salaryRangeStr =
		minSalary !== null && maxSalary !== null
			? `$${minSalary.toLocaleString()}-${maxSalary.toLocaleString()}/yr`
			: ''

	// Generate the image as before
	const [fonts, logoDataUri, moneyBagEmoji, pushPinEmoji, clockEmoji] =
		await Promise.all([
			getFont('Atkinson Hyperlegible', [400, 700]),
			fetchImageAsDataUri(`${url.origin}/${job.employer.s3Link}.jpeg`),
			loadLocalEmoji('moneybag.png'),
			loadLocalEmoji('pushpin.png'),
			loadLocalEmoji('clock.png'),
		])

	const jsx = (
		<div
			style={{
				height: '100%',
				width: '100%',
				display: 'flex',
				backgroundColor: '#ffffff',
				color: '#000000',
				fontFamily: '"Atkinson Hyperlegible"',
				padding: '40px',
			}}
		>
			<div
				style={{
					flex: 2,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					height: '100%',
					paddingTop: '10px',
					paddingBottom: '10px',
				}}
			>
				<p style={{ fontSize: '50px', marginBottom: '10px' }}>
					{job.employer.name}
				</p>
				<p
					style={{ fontSize: '52px', fontWeight: 'bold', marginBottom: '20px' }}
				>
					{job.title}
				</p>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
					{salaryRangeStr && (
						<span
							style={{
								backgroundColor: '#e2e8f0',
								border: '2px solid #000000',
								borderRadius: '4px',
								padding: '6px 10px',
								fontSize: '48px',
								fontWeight: 'bold',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<img
								src={moneyBagEmoji}
								alt="Moneybag"
								style={{ width: '48px', height: '48px' }}
							/>
							{salaryRangeStr}
						</span>
					)}
					{job.address.state.name && (
						<span
							style={{
								backgroundColor: '#e2e8f0',
								border: '2px solid #000000',
								borderRadius: '4px',
								padding: '6px 10px',
								fontSize: '48px',
								fontWeight: 'bold',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<img
								src={pushPinEmoji}
								alt="Pushpin"
								style={{ width: '48px', height: '48px' }}
							/>
							{job.address.state.name}
						</span>
					)}
					{job.employmentType && (
						<span
							style={{
								backgroundColor: '#e2e8f0',
								border: '2px solid #000000',
								borderRadius: '4px',
								padding: '6px 10px',
								fontSize: '48px',
								fontWeight: 'bold',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<img
								src={clockEmoji}
								alt="Clock"
								style={{ width: '48px', height: '48px' }}
							/>
							{job.employmentType}
						</span>
					)}
				</div>
			</div>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{logoDataUri ? (
					<img
						src={logoDataUri}
						alt="Company Logo"
						style={{
							maxWidth: '100%',
							maxHeight: '100%',
							objectFit: 'contain',
						}}
						width="400"
						height="400"
					/>
				) : (
					<div style={{ fontSize: '24px', fontWeight: 'bold' }}>
						{job.employer.name.slice(0, 2).toUpperCase()}
					</div>
				)}
			</div>
		</div>
	)

	const svg = await satori(jsx, {
		width: 1200,
		height: 630,
		fonts,
	})

	const resvg = new Resvg(svg)
	const pngData = resvg.render()
	const pngBuffer = pngData.asPng()

	return new Response(pngBuffer, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
}
