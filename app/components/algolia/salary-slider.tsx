import { useState, useEffect } from 'react'
import { useRange } from 'react-instantsearch'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Slider } from '../ui/slider'

export function SalaryRangeSliderPopover() {
	const { range, start, canRefine, refine } = useRange({
		attribute: 'minSalary',
	})
	const { min, max } = range
	const [value, setValue] = useState([Math.max(min, 1000), max])

	const from = Math.max(1000, Number.isFinite(start[0]) ? start[0] : 1000)
	const to = Math.min(max, Number.isFinite(start[1]) ? start[1] : max)

	useEffect(() => {
		setValue([from, to])
	}, [from, to])

	const formatSalary = (value: number) => {
		if (value >= 1000) {
			return `${Math.floor(value / 1000)}K`
		}
		return `${value}`
	}

	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	})

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" className="dark:border-white dark:bg-black">
					Salary: {'>'}${formatSalary(from)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="grid gap-4">
					<div className="space-y-2">
						<h4 className="font-medium leading-none">Salary Range</h4>
						<p className="text-sm text-muted-foreground">
							Set the minimum and maximum salary range.
						</p>
					</div>
					<div className="grid gap-2">
						<Slider
							min={min}
							max={max}
							step={1000}
							value={value}
							onValueChange={setValue}
							onValueCommit={refine}
							disabled={!canRefine}
							className="mb-2"
						/>
						<div className="flex justify-between text-sm">
							<span>{formatter.format(from)}</span>
							<span>{formatter.format(to)}</span>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
