import { useState, useEffect } from 'react'
import { useRange } from 'react-instantsearch'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Slider } from '../ui/slider'

export function SalaryRangeSliderPopover() {
	const { range, start, canRefine, refine } = useRange({
		attribute: 'minSalary',
	})

	const [value, setValue] = useState([0, 300])

	useEffect(() => {
		if (canRefine) {
			const min = 0
			const max = Math.max(300, range.max)
			const from = Math.max(min, Number.isFinite(start[0]) ? start[0] : min)
			const to = Math.min(max, Number.isFinite(start[1]) ? start[1] : max)
			setValue([from, to])
		}
	}, [canRefine, range.max, start])

	const handleValueChange = (newValue: number[]) => {
		setValue(newValue)
	}

	const handleValueCommit = (newValue: number[]) => {
		refine(newValue)
	}

	const formatSalary = (value: number) => {
		return `$${value}K`
	}

	const getButtonText = () => {
		if (value[0] === 0 && value[1] >= 300) {
			return 'Salary: Any'
		} else if (value[0] > 0) {
			return `Salary: >${formatSalary(value[0])}`
		} else {
			return `Salary: <${formatSalary(value[1])}`
		}
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" className="dark:border-white dark:bg-black">
					{getButtonText()}
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
							min={0}
							max={300}
							step={1}
							value={value}
							onValueChange={handleValueChange}
							onValueCommit={handleValueCommit}
							className="mb-2"
						/>
						<div className="flex justify-between text-sm">
							<span>{formatSalary(value[0])}</span>
							<span>{formatSalary(value[1])}</span>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
