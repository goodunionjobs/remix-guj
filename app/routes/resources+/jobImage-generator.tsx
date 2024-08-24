import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { Resvg } from '@resvg/resvg-js'
import satori, { type SatoriOptions } from 'satori'

// Helper to resolve the current directory in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

function getBaseUrl(request: Request): string {
	const url = new URL(request.url)
	if (url.hostname === 'localhost') {
		return 'http://localhost:3000'
	} else if (url.hostname === 'remix-guj-staging.fly.dev') {
		return 'https://remix-guj-staging.fly.dev'
	} else {
		return 'https://goodunionjobs.com'
	}
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

async function loadLocalEmoji(filename: string): Promise<string> {
	const filePath = path.resolve('public', 'img', 'emojis', filename)
	const fileData = await fs.readFile(filePath)
	const base64 = fileData.toString('base64')
	return `data:image/png;base64,${base64}`
}

export async function loader({ request }: LoaderFunctionArgs) {
	try {
		const url = new URL(request.url)
		const title = url.searchParams.get('title') || ''
		const employer = url.searchParams.get('employer') || ''
		const logoPath = url.searchParams.get('logo') || ''
		const state = url.searchParams.get('state') || ''
		const salaryRange = url.searchParams.get('salaryRange') || ''
		const employmentType = url.searchParams.get('employmentType') || ''

		const baseUrl = getBaseUrl(request)

		// Decode the logo URL and construct it correctly
		const decodedLogoPath = decodeURIComponent(logoPath)
		const logoUrl = decodedLogoPath.startsWith('http')
			? decodedLogoPath
			: `${baseUrl}/${decodedLogoPath}.jpeg`

		console.log('Fetching logo from:', logoUrl)

		const [fonts, logoDataUri, moneyBagEmoji, pushPinEmoji, clockEmoji] =
			await Promise.all([
				getFont('Atkinson Hyperlegible', [400, 700]),
				fetchImageAsDataUri(logoUrl),
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
						justifyContent: 'center',
					}}
				>
					<p style={{ fontSize: '24px', marginBottom: '10px' }}>{employer}</p>
					<p
						style={{
							fontSize: '36px',
							fontWeight: 'bold',
							marginBottom: '20px',
						}}
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
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								<img
									src={moneyBagEmoji}
									alt="Moneybag"
									style={{ width: '24px', height: '24px' }}
								/>
								{salaryRange}
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
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								<img
									src={pushPinEmoji}
									alt="Pushpin"
									style={{ width: '24px', height: '24px' }}
								/>
								{state}
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
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								<img
									src={clockEmoji}
									alt="Clock"
									style={{ width: '24px', height: '24px' }}
								/>
								{employmentType}
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
							{employer.slice(0, 2).toUpperCase()}
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
	} catch (error) {
		console.error('Error generating image:', error)
		return new Response(`Error generating image: ${error.message}`, {
			status: 500,
		})
	}
}
