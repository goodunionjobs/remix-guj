import { useState } from 'react'
import { useRange } from 'react-instantsearch'
import { Button, FilterClearButton } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Slider } from '../ui/slider'
import { Icon } from '../ui/icon'

export function SalaryRangeSliderPopover() {
	type RangeBoundaries = [number | undefined, number | undefined]
	const defaultRange: RangeBoundaries = [undefined, undefined]
	// The `useRange` Hook automatically stores min/max in `uiState.range.minSalary`.
	// (No need for useSearchParams if you want to rely on InstantSearch routing.)
	const { range, start, canRefine, refine } = useRange({
		attribute: 'minSalary',
	})

	const [isOpen, setIsOpen] = useState(false)

	// If user hasn’t refined yet, `start[0]` might be `undefined`;
	// let’s default to range.min or some sensible default:
	const minValue = start[0] ?? range.min ?? 0
	const maxValue = range.max ?? 999_999 // or however big your salaries can get

	const clearRange = () => refine(defaultRange)

	const formatSalary = (value: number) => {
		// Return 'Pay' if there's no start value or if value is invalid
		if (!start[0] || !isFinite(value) || value < 0) return 'Pay'
		const formatted = value >= 1000 ? `${Math.floor(value / 1000)}K` : value
		return `> ${formatted} USD/year`
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className="dark:border-white dark:bg-black"
					disabled={!canRefine}
				>
					<Icon className="mr-2 h-4 w-4" name="circle-dollar-sign" />
					{canRefine ? formatSalary(minValue) : 'Pay'}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="grid gap-4">
					<div className="space-y-2">
						<FilterClearButton onClear={clearRange} />
						<h4 className="font-medium leading-none">Minimum Yearly Pay</h4>
						<p className="text-sm text-muted-foreground">
							Set the minimum yearly pay threshold (*estimated).
						</p>
					</div>
					<div className="grid gap-2">
						{canRefine ? (
							<>
								{/* 
                  No need for a hidden <input> & useSearchParams,
                  since we want to rely on InstantSearch’s uiState 
                */}
								<Slider
									min={range.min ?? 0}
									max={range.max ?? 999_999}
									step={1000}
									value={[minValue]}
									onValueChange={newValue => {
										// We call refine([MIN, MAX])
										refine([newValue[0], maxValue])
									}}
									className="mb-2"
								/>
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
