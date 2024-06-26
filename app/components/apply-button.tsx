export function ApplyButton({
	url,
	handleButtonClick,
	textColor,
}: {
	url: string
	handleButtonClick: (event: { stopPropagation: () => void }) => void
	textColor: string
}) {
	return (
		<>
			<div className="al mx-0 my-5 self-center sm:mx-1">
				<a href={url} aria-label="Job Post Link">
					<button
						type="button"
						onClick={handleButtonClick}
						className={`focus:outline-black text-[${textColor}] invisible hidden rounded-md  bg-[#ff8400] px-6
                py-2.5 text-xs font-bold shadow-[0_5px_0px] shadow-amber-600 hover:translate-y-0.5
                hover:shadow-none  sm:block 
                sm:text-sm sm:group-hover:visible
                `}
					>
						Apply
					</button>
				</a>
			</div>
		</>
	)
}
