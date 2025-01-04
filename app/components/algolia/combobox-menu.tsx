import { Check, ChevronsUpDown } from 'lucide-react'
import { useState, useCallback } from 'react'
import {
	useRefinementList,
	ClearRefinements,
	RefinementList,
} from 'react-instantsearch'
import { cn } from '#app/utils/misc.js'
//TODO: Remove this below
import states from '#app/utils/statelist.js'
import { useMemo } from 'react'
import { Button, FilterClearButton } from '../ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Icon } from '../ui/icon'

type EmploymentType =
	| 'Part-time'
	| 'Full-time'
	| 'Contract'
	| 'Temporary'
	| 'Volunteer'
	| 'Other'
const employmentLabels: Record<EmploymentType, EmploymentType> = {
	'Part-time': 'Part-time',
	'Full-time': 'Full-time',
	Contract: 'Contract',
	Temporary: 'Temporary',
	Volunteer: 'Volunteer',
	Other: 'Other',
}

const stateLabels: Record<string, string> = {
	AL: 'Alabama',
	AK: 'Alaska',
	AZ: 'Arizona',
	AR: 'Arkansas',
	CA: 'California',
	CO: 'Colorado',
	CT: 'Connecticut',
	DE: 'Delaware',
	FL: 'Florida',
	GA: 'Georgia',
	HI: 'Hawaii',
	ID: 'Idaho',
	IL: 'Illinois',
	IN: 'Indiana',
	IA: 'Iowa',
	KS: 'Kansas',
	KY: 'Kentucky',
	LA: 'Louisiana',
	ME: 'Maine',
	MD: 'Maryland',
	MA: 'Massachusetts',
	MI: 'Michigan',
	MN: 'Minnesota',
	MS: 'Mississippi',
	MO: 'Missouri',
	MT: 'Montana',
	NE: 'Nebraska',
	NV: 'Nevada',
	NH: 'New Hampshire',
	NJ: 'New Jersey',
	NM: 'New Mexico',
	NY: 'New York',
	NC: 'North Carolina',
	ND: 'North Dakota',
	OH: 'Ohio',
	OK: 'Oklahoma',
	OR: 'Oregon',
	PA: 'Pennsylvania',
	RI: 'Rhode Island',
	SC: 'South Carolina',
	SD: 'South Dakota',
	TN: 'Tennessee',
	TX: 'Texas',
	UT: 'Utah',
	VT: 'Vermont',
	VA: 'Virginia',
	WA: 'Washington',
	WV: 'West Virginia',
	WI: 'Wisconsin',
	WY: 'Wyoming',
	DC: 'District of Columbia',
	AS: 'American Samoa',
	GU: 'Guam',
	MP: 'Northern Mariana Islands',
	PR: 'Puerto Rico',
	VI: 'U.S. Virgin Islands',
}

type SearchAttribute = 'state' | 'employmentType'

type SearchParamTypeMap = {
	state: 'state'
	employmentType: 'jobtype'
}

function getSearchParamType(
	attribute: SearchAttribute,
): SearchParamTypeMap[SearchAttribute] {
	switch (attribute) {
		case 'state':
			return 'state'
		case 'employmentType':
			return 'jobtype'
		default:
			// This exhaustive check ensures we handle all possible cases
			const _exhaustiveCheck: never = attribute
			throw new Error(`Unhandled attribute type: ${_exhaustiveCheck}`)
	}
}

interface ComboboxProps {
	items: Array<{
		value: string
		label: string
		count: number
		isRefined: boolean
	}>
	refine: (value: string) => void
	placeholder: string
	width?: string
}

export function AlgoliaFlexibleCombobox({
	items,
	refine,
	placeholder,
	width = '200px',
}: ComboboxProps) {
	const [open, setOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')

	const refinedItems = items.filter(item => item.isRefined)

	// Enhanced filtering logic
	const filteredItems = useMemo(() => {
		if (!searchTerm) return items

		const term = searchTerm.toLowerCase().trim()

		return items
			.filter(item => {
				const labelMatch = item.label.toLowerCase().includes(term)
				const valueMatch = item.value.toLowerCase() === term
				const partialValueMatch =
					term.length >= 2 && item.value.toLowerCase().includes(term)

				return labelMatch || valueMatch || partialValueMatch
			})
			.sort((a, b) => {
				// Prioritize exact matches and then alphabetically
				const aLowerLabel = a.label.toLowerCase()
				const bLowerLabel = b.label.toLowerCase()
				const termLength = term.length

				if (aLowerLabel.startsWith(term) && !bLowerLabel.startsWith(term))
					return -1
				if (!aLowerLabel.startsWith(term) && bLowerLabel.startsWith(term))
					return 1

				return aLowerLabel.localeCompare(bLowerLabel)
			})
	}, [items, searchTerm])

	const clearSearch = useCallback(() => {
		refinedItems.forEach(item => refine(item.value))
		setSearchTerm('')
	}, [refinedItems, refine])

	const label = useMemo(() => {
		if (refinedItems.length === 0) return placeholder
		if (refinedItems.length === 1) return refinedItems[0].label
		return `${refinedItems[0].label} + ${refinedItems.length - 1} more`
	}, [refinedItems, placeholder])

	return (
		<Popover open={open} onOpenChange={setOpen} modal>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={`dark:border-white dark:bg-black w-[${width}] justify-between`}
				>
					{placeholder === 'Job Types' ? (
						<span className="mr-2">💼</span>
					) : (
						<span className="mr-2">📌</span>
					)}
					{label}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent isInsideSheet className="max-h-64 overflow-y-auto p-0">
				<Command>
					<FilterClearButton onClear={clearSearch} />
					<CommandInput
						placeholder={`Search ${placeholder}`}
						value={searchTerm}
						onValueChange={setSearchTerm}
					/>
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup>
							{filteredItems.map(item => (
								<CommandItem
									key={item.value}
									value={item.label} // Changed to use label for better matching
									onSelect={() => {
										refine(item.value)
										setSearchTerm('')
									}}
								>
									<Check
										className={cn(
											'mr-2 h-4 w-4',
											item.isRefined ? 'opacity-100' : 'opacity-0',
										)}
									/>
									<div>
										{item.label}
										{/* TODO: It changes the results depending on filters... don't */}
										{/* think it is good to include */}
										{/* {item.count > 0 && ` (${item.count})`} */}
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
	if (typeof window === 'undefined') {
		// Return a non-interactive placeholder or null
		return null
	}

	// 1) create a memoized transform function
	const transformStates = useCallback(algoliaItems => {
		// Turn algoliaItems into a map keyed by short code:
		const algoliaMap = algoliaItems.reduce(
			(acc, item) => {
				acc[item.value] = item
				return acc
			},
			{} as Record<string, (typeof algoliaItems)[0]>,
		)

		// Merge with your known state codes in `stateLabels`:
		return Object.entries(stateLabels).map(([code, fullName]) => {
			// If Algolia gave us this code, use that item
			if (algoliaMap[code]) {
				return {
					...algoliaMap[code],
					label: fullName,
				}
			}
			// Else create a 0-count item
			return {
				value: code,
				label: fullName,
				count: 0,
				isRefined: false,
			}
		})
	}, [])

	const { items, refine } = useRefinementList({
		attribute: 'state',
		transformItems: transformStates,
	})

	return (
		<AlgoliaFlexibleCombobox
			items={items}
			refine={refine}
			placeholder="States"
		/>
	)
}

export function EmploymentTypeCombobox() {
	if (typeof window === 'undefined') {
		// Return a non-interactive placeholder or null
		return null
	}

	//TODO: Make a function
	// 1) create a memoized transform function
	const transformStates = useCallback(algoliaItems => {
		// Turn algoliaItems into a map keyed by short code:
		const algoliaMap = algoliaItems.reduce(
			(acc, item) => {
				acc[item.value] = item
				return acc
			},
			{} as Record<string, (typeof algoliaItems)[0]>,
		)

		// Merge with your known state codes in `stateLabels`:
		return Object.entries(employmentLabels).map(([code, fullName]) => {
			// If Algolia gave us this code, use that item
			if (algoliaMap[code]) {
				return {
					...algoliaMap[code],
					label: fullName,
				}
			}
			// Else create a 0-count item
			return {
				value: code,
				label: fullName,
				count: 0,
				isRefined: false,
			}
		})
	}, [])

	const { items, refine } = useRefinementList({
		attribute: 'employmentType',
		transformItems: transformStates,
	})

	return (
		<AlgoliaFlexibleCombobox
			items={items}
			refine={refine}
			placeholder="Job Types"
		/>
	)
}

export function ClearAllButton() {
	return (
		<ClearRefinements
			translations={{ resetButtonText: 'Clear filters' }}
			// If you only want to reset certain facets, pass `excludedAttributes`
		/>
	)
}
