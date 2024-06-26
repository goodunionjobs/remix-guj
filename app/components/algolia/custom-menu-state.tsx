import { useMenu, type UseMenuProps } from 'react-instantsearch'
import { states } from '#app/utils/state-list.tsx'
// import * as Select from '@radix-ui/react-select'

export function CustomMenuState(props: UseMenuProps) {
	const { refine } = useMenu(props)
	return (
		<>
			<select
				onChange={event => refine(event.currentTarget.value)}
				className="rounded border-2 border-black bg-white
        text-xs font-bold  dark:border-white dark:bg-black
				dark:text-white sm:text-sm md:text-base
				"
			>
				{states.map(state => {
					if (state === '') {
						return (
							<option key={state} label="All States">
								{state}
							</option>
						)
					} else {
						return <option key={state}> {state} </option>
					}
				})}
			</select>
		</>
	)
}
