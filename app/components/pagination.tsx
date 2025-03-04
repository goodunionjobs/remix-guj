import { useSearchParams } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import { Link } from '@remix-run/react'

// Helper function unchanged
function setSearchParamsString(
	searchParams: URLSearchParams,
	changes: Record<string, string | number | undefined>,
) {
	const newSearchParams = new URLSearchParams(searchParams)
	for (const [key, value] of Object.entries(changes)) {
		if (value === undefined) {
			newSearchParams.delete(key)
			continue
		}
		newSearchParams.set(key, String(value))
	}
	return Array.from(newSearchParams.entries())
		.map(([key, value]) =>
			value ? `${key}=${encodeURIComponent(value)}` : key,
		)
		.join('&')
}

// Pagination range function unchanged
export function getPaginationRange(
	currentPage: number,
	totalPages: number,
	maxVisible = 7,
) {
	const pages: (number | 'ellipsis')[] = []
	if (totalPages <= maxVisible) {
		return Array.from({ length: totalPages }, (_, i) => i + 1)
	}
	pages.push(1)
	let start = Math.max(2, currentPage - 2)
	let end = Math.min(totalPages - 1, currentPage + 2)
	if (start <= 3) end = maxVisible - 2
	if (end >= totalPages - 2) start = totalPages - maxVisible + 3
	if (start > 2) pages.push('ellipsis')
	for (let i = start; i <= end; i++) pages.push(i)
	if (end < totalPages - 1) pages.push('ellipsis')
	pages.push(totalPages)
	return pages
}

export function PaginationBar({
	total,
	$top,
	$skip,
}: {
	total: number
	$top: number
	$skip: number
}) {
	const [searchParams] = useSearchParams()
	const totalPages = Math.ceil(total / $top)
	const currentPage = Math.floor($skip / $top) + 1
	const pages =
		totalPages > 1 ? getPaginationRange(currentPage, totalPages) : [1]

	return (
		<div className="flex items-center gap-1">
			<Button size="sm" variant="outline" asChild disabled={$skip <= 0}>
				<Link
					to={{ search: setSearchParamsString(searchParams, { $skip: 0 }) }}
					preventScrollReset
				>
					{'<<'}
					<span className="sr-only">First page</span>
				</Link>
			</Button>
			{pages.map((page, i) =>
				page === 'ellipsis' ? (
					<span key={`ellipsis-${i}`} className="px-2 text-neutral-600">
						...
					</span>
				) : (
					<Button
						key={page}
						size="sm"
						variant={page === currentPage ? 'ghost' : 'outline'}
						asChild={page !== currentPage}
						disabled={page === currentPage}
						className={page === currentPage ? 'bg-neutral-200 text-black' : ''}
					>
						{page === currentPage ? (
							page
						) : (
							<Link
								to={{
									search: setSearchParamsString(searchParams, {
										$skip: (page - 1) * $top,
									}),
								}}
								preventScrollReset
							>
								{page}
							</Link>
						)}
					</Button>
				),
			)}
			<Button
				size="sm"
				variant="outline"
				asChild={totalPages > 1 && $skip + $top < total}
				disabled={$skip + $top >= total}
			>
				{totalPages > 1 && $skip + $top < total ? (
					<Link
						to={{
							search: setSearchParamsString(searchParams, {
								$skip: $skip + $top,
							}),
						}}
						preventScrollReset
					>
						{'>>'}
						<span className="sr-only">Next page</span>
					</Link>
				) : (
					<span>
						{'>>'}
						<span className="sr-only">Next page</span>
					</span>
				)}
			</Button>
		</div>
	)
}
