import {
	useMenu,
	type UseMenuProps,
} from 'react-instantsearch'
import { employmentList } from '#app/utils/employment-list.tsx'

export function CustomMenuEmployment(props: UseMenuProps) {
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
				<option key=" " label="All Job Types"></option>
				{employmentList.map(employment => {
					return <option key={employment.value}> {employment.value} </option>
				})}
			</select>
		</>
	)
}
