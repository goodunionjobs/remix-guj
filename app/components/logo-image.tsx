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
	const containerClassName =
		layout === 'flex'
			? 'sm:flex-initial flex-none sm:mx-4 mt-4 mx-1 w-1/5 sm:w-auto h-16 text-sm font-light self-center'
			: 'grid text-sm font-light justify-center rounded-lg self-center'

	const imageClassName = 'object-scale-down h-5/6 rounded-md shadow-xl text-xs'

	// Extract the key part of the path (everything after 'company/assets/')
	const imageKey = employerImage.split('company/assets/')[1]

	if (!imageKey) {
		console.error('Invalid employerImage format:', employerImage)
		return null
	}

	// Encode the key for use in URL
	const encodedKey = encodeURIComponent(imageKey)

	return (
		<div className={containerClassName}>
			<picture>
				<source
					srcSet={`/images/${encodedKey.replace('.avif', '')}.avif`}
					type="image/avif"
				/>
				<source
					srcSet={`/images/${encodedKey.replace('.avif', '')}.webp`}
					type="image/webp"
				/>
				<img
					src={`/images/${encodedKey.replace('.avif', '')}.jpeg`}
					alt={`${employer} Logo`}
					className={imageClassName}
					decoding="async"
					loading="lazy"
					width={size}
					height={size}
				/>
			</picture>
		</div>
	)
}
