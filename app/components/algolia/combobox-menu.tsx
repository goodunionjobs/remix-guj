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

	// Maintain a separate state for user selection that doesn't depend on Algolia results
	const [userSelectedValue, setUserSelectedValue] = useState('')

	const allOptionLabel = attribute === 'state' ? 'All States' : 'All Job Types'

	// Add "All" option to the beginning of the options array
	const allOptions = useMemo(
		() => [{ value: '', label: allOptionLabel }, ...options],
		[options, allOptionLabel],
	)

	// Merge Algolia items with our predefined options, maintaining user selection
	const mergedItems = useMemo(() => {
		return allOptions.map(option => {
			if (option.value === '') {
				return {
					...option,
					count: items.reduce((sum, item) => sum + item.count, 0),
					isRefined: !items.some(item => item.isRefined) && !userSelectedValue,
				}
			}
			const algoliaItem = items.find(item => item.value === option.value)
			return {
				...option,
				count: algoliaItem ? algoliaItem.count : 0,
				isRefined: option.value === userSelectedValue,
			}
		})
	}, [allOptions, items, userSelectedValue])

	// Handle selection
	const handleSelect = (currentValue: string) => {
		setUserSelectedValue(currentValue)
		refine(currentValue || null) // Refine with null for "All" option
		setOpen(false)
	}

	// Get display label based on user selection
	const getDisplayLabel = () => {
		if (userSelectedValue) {
			const selectedItem = allOptions.find(
				item => item.value === userSelectedValue,
			)
			return selectedItem ? selectedItem.label : allOptionLabel
		}
		return allOptionLabel
	}

	return (
		<Popover open={open} onOpenChange={setOpen} modal={true}>
			<PopoverTrigger asChild>
				<Button
					aria-label={attribute}
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={`dark:border-white dark:bg-black w-[${width}] justify-between`}
				>
					{getDisplayLabel()}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className={` w-[${width}] p-0`}>
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
											{item.label}{' '}
											{item.value !== '' && item.count > 0 && `(${item.count})`}
										</div>
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
			options={states}
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
