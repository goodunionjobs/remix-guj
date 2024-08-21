import {
	unstable_Control as Control,
	type FieldMetadata,
} from '@conform-to/react'
import { Checkbox } from '#app/components/ui/checkbox'

export function CheckboxGroupConform({
	meta,
	items,
}: {
	meta: FieldMetadata<string[]>
	items: Array<{ name: string; value: string }>
}) {
	const initialValue =
		typeof meta.initialValue === 'string'
			? [meta.initialValue]
			: meta.initialValue ?? []

	return (
		<div className="flex flex-wrap gap-4">
			{items.map(item => (
				<Control
					key={item.value}
					meta={{
						key: meta.key,
						initialValue: initialValue.find(v => v == item.value)
							? [item.value]
							: '',
					}}
					render={control => (
						<div
							className="flex items-center gap-2"
							ref={element => {
								control.register(element?.querySelector('input'))
							}}
						>
							<Checkbox
								type="button"
								id={`${meta.name}-${item.value}`}
								name={meta.name}
								value={item.value}
								checked={control.value == item.value}
								onCheckedChange={value =>
									control.change(value.valueOf() ? item.value : '')
								}
								onBlur={control.blur}
								className="focus:ring-2 focus:ring-stone-950 focus:ring-offset-2"
							/>
							<label
								className="text-sm sm:text-base"
								htmlFor={`${meta.name}-${item.value}`}
							>
								{item.name}
							</label>
						</div>
					)}
				/>
			))}
		</div>
	)
}
