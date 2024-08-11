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

	const baseImageUrl = 'https://staging.goodunionjobs.com'
	console.log()
	employerImage = encodeURIComponent(employerImage)

	return (
		<div className={containerClassName}>
			<picture>
				<source
					srcSet={`${baseImageUrl}/${employerImage}.avif`}
					type="image/avif"
				/>
				<source
					srcSet={`${baseImageUrl}/${employerImage}.webp`}
					type="image/webp"
				/>
				<img
					crossOrigin="anonymous"
					src={`${baseImageUrl}/${employerImage}.jpeg`}
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
