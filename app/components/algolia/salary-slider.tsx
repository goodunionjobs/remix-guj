import { useState, useEffect } from 'react'
import { useRange } from 'react-instantsearch'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Slider } from '../ui/slider'

export function SalaryRangeSliderPopover() {
	const { range, canRefine, refine } = useRange({
		attribute: 'minSalary',
	})

	const [value, setValue] = useState(1000)
	const [maxAvailable, setMaxAvailable] = useState(1000)
	const [isOpen, setIsOpen] = useState(false)

	// Update available range when data changes
	useEffect(() => {
		if (canRefine && range && Number.isFinite(range.max)) {
			setMaxAvailable(range.max)
			// Reset value if it's higher than the new maximum
			setValue(currentValue =>
				currentValue > range.max
					? Math.max(1000, range.min || 1000)
					: currentValue,
			)
		}
	}, [range, canRefine])

	const formatSalary = (value: number) => {
		if (value >= 1000) {
			return `$${Math.floor(value / 1000)}K`
		}
		return `$${value}`
	}

	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	})

	const handleValueChange = (newValue: number[]) => {
		setValue(newValue[0])
	}

	const handleValueCommit = (newValue: number[]) => {
		if (canRefine) {
			// Set the range from the selected value up to the maximum
			refine([newValue[0], maxAvailable])
		}
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className="dark:border-white dark:bg-black"
					disabled={!canRefine}
				>
					{canRefine ? `Yearly Pay: >${formatSalary(value)}` : 'No salary data'}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="grid gap-4">
					<div className="space-y-2">
						<h4 className="font-medium leading-none">Minimum Yearly Pay</h4>
						<p className="text-sm text-muted-foreground">
							Set the minimum yearly pay threshold (*estimated).
						</p>
					</div>
					<div className="grid gap-2">
						{canRefine ? (
							<>
								<Slider
									min={Math.max(1000, range.min || 1000)}
									max={maxAvailable}
									step={1000}
									value={[value]}
									onValueChange={handleValueChange}
									onValueCommit={handleValueCommit}
									className="mb-2"
								/>
								<div className="flex justify-between text-sm">
									<span>
										Showing jobs paying above: {formatter.format(value)}
									</span>
								</div>
							</>
						) : (
							<div className="text-sm text-muted-foreground">
								No salary data available for the current selection.
							</div>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
