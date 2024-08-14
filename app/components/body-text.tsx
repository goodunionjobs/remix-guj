import { Link } from '@remix-run/react'
import { Suspense } from 'react'

export function BodyText({
	handleButtonClick,
	url,
	baseUrl,
	description,
	showResults,
	objectID,
	job,
}: {
	handleButtonClick: (event: { stopPropagation: () => void }) => void
	url?: string
	baseUrl: string
	description: string
	showResults?: boolean
	objectID?: string
	job?: string
}) {
	return (
		<div key={objectID}>
			{(showResults || showResults === undefined) && (
				<div
					className={`light:bg-white light:border-black dark:border-gray -my-2 mr-2 w-full rounded-lg border-2 border-solid py-4  text-sm dark:bg-slate-900 sm:text-base`}
					onClick={handleButtonClick}
				>
					{url && (
						<div className="flex">
							<a
								href={url}
								className="light:bg-yellow-100 mx-auto mb-1 justify-center rounded-md
            border-2 border-solid border-black px-2 text-2xl font-bold hover:bg-white dark:bg-blue-600"
							>
								Apply 📎
							</a>
						</div>
					)}
					<div className="flex justify-center">
						<Suspense
							fallback={
								<div
									className="prose prose-neutral prose-p:text-black mx-auto max-w-prose pl-2 pr-1 sm:mx-3"
									style={{ wordBreak: 'break-word' }}
								>
									Loading...
								</div>
							}
						>
							<div
								className="prose prose-neutral prose-p:text-black mx-auto max-w-prose pl-2 pr-1 sm:mx-3"
								style={{ wordBreak: 'break-word' }}
								dangerouslySetInnerHTML={{ __html: description }}
							/>
						</Suspense>
					</div>
					{objectID && (
						<div className="mb-2 mt-1 flex flex-col">
							<div className="text-center text-xl font-bold underline">
								Share this job:
							</div>
							<div
								onClick={e => {
									e.preventDefault()
									navigator.clipboard.writeText(
										`${baseUrl}jobs/${objectID}-${job}`,
									)
								}}
								className="border-1.5 border-grey-400 mx-auto cursor-pointer justify-center
								rounded-md border bg-white px-2 text-base dark:bg-slate-800"
							>
								<Link
									to={`/jobs/${objectID}-${job}`}
									target="_blank"
									className="block max-w-sm select-all overflow-hidden whitespace-nowrap sm:max-w-xl"
								>
									{`${baseUrl}jobs/${objectID}-${job}`}
								</Link>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
