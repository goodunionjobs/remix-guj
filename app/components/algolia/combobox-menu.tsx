import { Check, ChevronsUpDown } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useMenu } from 'react-instantsearch'
import { cn } from '#app/utils/misc.js'
import states from '#app/utils/statelist.js'
import { Button } from '../ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

const employmentTypes = [
	{
		value: 'Part-time',
		label: 'Part-time',
	},
	{
		value: 'Full-time',
		label: 'Full-time',
	},
	{
		value: 'Contract',
		label: 'Contract',
	},
	{
		value: 'Temporary',
		label: 'Temporary',
	},
	{
		value: 'Volunteer',
		label: 'Volunteer',
	},
	{
		value: 'Other',
		label: 'Other',
	},
]

type Option = {
	value: string
	label: string
}

interface AlgoliaFlexibleComboboxProps {
	attribute: 'state' | 'employmentType'
	placeholder: string
	width?: string
	options: Option[]
}

export function AlgoliaFlexibleCombobox({
	attribute,
	placeholder,
	width = '200px',
	options,
}: AlgoliaFlexibleComboboxProps) {
	const [open, setOpen] = useState(false)
	const { items, refine } = useMenu({
		attribute,
		showMore: false,
	})

	const [selectedValue, setSelectedValue] = useState('')

	//TODO: Fix it up somehow since when clicking a place that doesn't have jobs like job type or state it doesn't change

	// TODO: Fixup with types and make it switch case
	const allOptionLabel = attribute === 'state' ? 'All States' : 'All Job Types'

	// Add specific "All" option to the beginning of the options array
	const allOptions = useMemo(
		() => [{ value: '', label: allOptionLabel }, ...options],
		[options, allOptionLabel],
	)

	// Merge Algolia items with our predefined options
	const mergedItems = useMemo(() => {
		return allOptions.map(option => {
			if (option.value === '') {
				// Special case for "All" option
				return {
					...option,
					count: items.reduce((sum, item) => sum + item.count, 0),
					isRefined: !items.some(item => item.isRefined),
				}
			}
			const algoliaItem = items.find(item => item.value === option.value)
			return {
				...option,
				count: algoliaItem ? algoliaItem.count : 0,
				isRefined: algoliaItem ? algoliaItem.isRefined : false,
			}
		})
	}, [allOptions, items])

	// Update selected value when refinement changes
	useEffect(() => {
		const refinedItem = mergedItems.find(item => item.isRefined)
		setSelectedValue(refinedItem ? refinedItem.value : '')
	}, [mergedItems])

	const handleSelect = currentValue => {
		if (currentValue === '') {
			// If "All States" or "All Employment Types" is selected, remove the refinement
			refine(null)
		} else {
			refine(currentValue)
		}
		setOpen(false)
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					aria-label={attribute}
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={`dark:border-white dark:bg-black w-[${width}] justify-between`}
				>
					{selectedValue
						? mergedItems.find(item => item.value === selectedValue)?.label
						: allOptionLabel}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className={`w-[${width}] p-0`}>
				<Command>
					<CommandInput
						placeholder={`Search ${placeholder.toLowerCase()}...`}
					/>
					<CommandList>
						<CommandEmpty>No {placeholder.toLowerCase()} found.</CommandEmpty>
						<CommandGroup>
							{mergedItems.map(item => (
								<CommandItem
									key={item.value}
									value={item.value}
									onSelect={handleSelect}
								>
									<Check
										className={cn(
											'mr-2 h-4 w-4',
											item.isRefined ? 'opacity-100' : 'opacity-0',
										)}
									/>
									<div>
										<div>
											{/* //TODO: Check over count...not working? */}
											{/* {item.label} {item.value !== '' && `(${item.count})`} */}
											{item.label} {item.value !== ''}
										</div>
										{item.description && (
											<div className="text-sm text-gray-500">
												{item.description}
											</div>
										)}
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}

export function StateCombobox() {
	return (
		<AlgoliaFlexibleCombobox
			attribute="state"
			placeholder="Select state"
			options={states} // You'll need to import or define the states array
		/>
	)
}

export function EmploymentTypeCombobox() {
	return (
		<AlgoliaFlexibleCombobox
			attribute="employmentType"
			placeholder="Select job type"
			width="300px"
			options={employmentTypes}
		/>
	)
}
