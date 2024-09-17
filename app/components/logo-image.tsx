import { useState } from 'react'

export interface LogoImageProps {
	employerImage: string
	employer: string
	size: number
	layout: 'grid' | 'flex'
}

export function LogoImage({
	employerImage,
	employer,
	size,
	layout,
}: LogoImageProps) {
	const [imgError, setImgError] = useState(false)

	const containerClassName =
		layout === 'flex'
			? 'sm:flex-initial flex-none sm:mx-4 mt-4 mx-1 w-1/5 sm:w-auto h-16 text-sm font-light self-center'
			: 'grid text-sm font-light justify-center rounded-lg self-center'

	const imageClassName = 'object-scale-down h-5/6 rounded-md shadow-xl text-xs'

	// Remove the file extension and the leading path
	const imageKey = employerImage
		.replace(/^assets\/company\/image\//, '')
		.replace(/\.(avif|webp|jpeg)$/, '')
	const encodedKey = encodeURIComponent(imageKey)

	const imageUrl = `assets/company/image/${encodedKey}`

	const handleImageError = (
		e: React.SyntheticEvent<HTMLImageElement, Event>,
	) => {
		console.error('Image failed to load:', e)
		setImgError(true)
	}

	if (imgError) {
		return (
			<div className={containerClassName}>
				<div className={imageClassName}>{employer.charAt(0)}</div>
			</div>
		)
	}

	return (
		<div className={containerClassName}>
			<picture>
				<source srcSet={`${imageUrl}.avif`} type="image/avif" />
				<source srcSet={`${imageUrl}.webp`} type="image/webp" />
				<img
					src={`${imageUrl}.jpeg`}
					alt={`${employer} Logo`}
					className={imageClassName}
					decoding="async"
					loading="lazy"
					width={size}
					height={size}
					onError={handleImageError}
				/>
			</picture>
		</div>
	)
}
