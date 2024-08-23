// app/routes/resources+/jobImage-generator.tsx
import { type LoaderFunctionArgs } from '@remix-run/node'
import { Resvg } from '@resvg/resvg-js'
import satori, { type SatoriOptions } from 'satori'

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

async function loadImage(src: string): Promise<string> {
	const res = await fetch(src)
	const arrayBuffer = await res.arrayBuffer()
	const base64 = Buffer.from(arrayBuffer).toString('base64')
	const mimeType = res.headers.get('content-type') || 'image/png'
	return `data:${mimeType};base64,${base64}`
}

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const title = url.searchParams.get('title') || ''
	const employer = url.searchParams.get('employer') || ''
	const logo = url.searchParams.get('logo') || ''
	const state = url.searchParams.get('state') || ''
	const salaryRange = url.searchParams.get('salaryRange') || ''
	const employmentType = url.searchParams.get('employmentType') || ''

	const fonts = await getFont('Atkinson Hyperlegible', [400, 700])

	let logoData = ''
	try {
		if (logo) {
			logoData = await loadImage(logo)
		}
	} catch (error) {
		console.error('Failed to load logo:', error)
		// Proceed without the logo if it fails to load
	}

	const jsx = (
		<div
			style={{
				height: '100%',
				width: '100%',
				display: 'flex',
				backgroundColor: '#ffffff',
				color: '#000000',
				fontFamily: 'Atkinson Hyperlegible',
				padding: '40px',
			}}
		>
			<div
				style={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
				}}
			>
				<p style={{ fontSize: '24px', marginBottom: '10px' }}>{employer}</p>
				<p
					style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '20px' }}
				>
					{title}
				</p>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
					{salaryRange && (
						<span
							style={{
								backgroundColor: '#e2e8f0',
								border: '2px solid #000000',
								borderRadius: '4px',
								padding: '4px 8px',
								fontSize: '18px',
								fontWeight: 'bold',
							}}
						>
							💰 {salaryRange}
						</span>
					)}
					{state && (
						<span
							style={{
								backgroundColor: '#e2e8f0',
								border: '2px solid #000000',
								borderRadius: '4px',
								padding: '4px 8px',
								fontSize: '18px',
								fontWeight: 'bold',
							}}
						>
							📌 {state}
						</span>
					)}
					{employmentType && (
						<span
							style={{
								backgroundColor: '#e2e8f0',
								border: '2px solid #000000',
								borderRadius: '4px',
								padding: '4px 8px',
								fontSize: '18px',
								fontWeight: 'bold',
							}}
						>
							🕑 {employmentType}
						</span>
					)}
				</div>
			</div>
			{logoData && (
				<div
					style={{
						width: '200px',
						height: '200px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<img
						src={logoData}
						alt="Company Logo"
						style={{
							maxWidth: '100%',
							maxHeight: '100%',
							objectFit: 'contain',
						}}
						width="200"
						height="200"
					/>
				</div>
			)}
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
