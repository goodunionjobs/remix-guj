import lozad from 'lozad'
import { useEffect } from 'react'

export interface LogoImageProps {
	finalImage: string[]
	employer: string
	size: number
	layout: 'grid' | 'flex'
}

export function LogoImage({
	finalImage,
	employer,
	size,
	layout,
}: LogoImageProps) {
	useEffect(() => {
		const { observe, observer } = lozad()
		observe()
		return () => observer.disconnect()
	}, [])

	const containerClassName =
		layout === 'flex'
			? 'sm:flex-initial flex-none sm:mx-4 mt-4 mx-1 w-1/5 sm:w-auto h-16 text-sm font-light self-center'
			: 'grid text-sm font-light justify-center rounded-lg self-center'

	const imageClassName =
		'lozad object-scale-down h-5/6 rounded-md shadow-xl text-xs'

	useEffect(() => {
		;[finalImage].forEach((array, index) => {
			console.log(`Array ${index + 1}:`, array)
		})
	}, [])

	return (
		<div className={containerClassName}>
			{finalImage.length === 3 ? (
				// Avif, Webp, jpeg
				<picture className="lozad">
					<source srcSet={finalImage[2]} type="image/avif" />
					<source srcSet={finalImage[1]} type="image/webp" />
					<img
						crossOrigin="anonymous"
						src={finalImage[0]}
						alt={employer + ' Logo'}
						className={imageClassName}
						decoding="async"
						width={size}
						height={size}
					/>
				</picture>
			) : (
				// Only an SVG
				<img
					src={finalImage[0]}
					alt={employer + ' Logo'}
					className={imageClassName}
					decoding="async"
					width={size}
					height={size}
				/>
			)}
		</div>
	)
}
