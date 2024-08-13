import { getKindeSession } from '@kinde-oss/kinde-remix-sdk'
import {
	redirect,
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import {
	Form,
	useLoaderData,
	useActionData,
	type MetaFunction,
} from '@remix-run/react'
import {
	useForm,
	useInputControl,
	getFormProps,
	getInputProps,
} from '@conform-to/react'
import { parseWithZod, getZodConstraint } from '@conform-to/zod'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { useOptionalUser } from '#app/utils/user.ts'
import { Checkbox } from '#app/components/ui/checkbox'
import { Label } from '#app/components/ui/label'
import { RadioGroup, RadioGroupItem } from '#app/components/ui/radio-group'
import { db } from '#app/utils/db.server' // Assuming you have a db utility set up for Drizzle

const schema = z.object({
	categories: z.array(z.string()).min(1, 'Select at least one category'),
	frequency: z.enum(['daily', 'weekly'], {
		required_error: 'Please select a notification frequency',
	}),
})

export async function loader({ params, request }: LoaderFunctionArgs) {
	const { getUser } = await getKindeSession(request)
	const user = await getUser()

	if (user === null) {
		throw redirect('/kinde-auth/login')
	}

	return json({ user })
	// // Fetch user preferences from the database
	// const preferences = await db.query.userPreferences.findFirst({
	// 	where: (preferences, { eq }) => eq(preferences.userId, user.id),
	// })
	//
	// return json({ user, preferences })
}

export async function action({ request }: ActionFunctionArgs) {
	const { getUser } = await getKindeSession(request)
	const user = await getUser()

	if (user === null) {
		throw redirect('/kinde-auth/login')
	}

	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema })

	if (submission.status !== 'success') {
		return submission.reply()
	}

	// Save preferences to the database
	// await db
	// 	.insert(userPreferences)
	// 	.values({
	// 		userId: user.id,
	// 		categories: submission.value.categories,
	// 		frequency: submission.value.frequency,
	// 	})
	// 	.onConflictDoUpdate({
	// 		target: userPreferences.userId,
	// 		set: {
	// 			categories: submission.value.categories,
	// 			frequency: submission.value.frequency,
	// 		},
	// 	})

	return redirect('/profile')
}

export default function ProfileRoute() {
	const { user } = useLoaderData<typeof loader>()
	const lastResult = useActionData<typeof action>()
	const userDisplayName = user.given_name ?? user.email
	const loggedInUser = useOptionalUser()
	const isLoggedInUser = user.id === loggedInUser?.id

	const [form, fields] = useForm({
		id: 'job-preferences',
		lastResult,
		constraint: getZodConstraint(schema),
		// defaultValue: preferences,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})

	const categories = [
		'Construction',
		'Education',
		'Energy Infrastructure',
		'General Misc. Services',
	]

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center">
			<Spacer size="4xs" />

			<div className="container flex flex-col items-center rounded-3xl bg-muted p-12">
				<div className="relative w-52">
					<div className="absolute -top-40">
						<div className="relative">
							<img
								src="/img/user.png"
								alt={userDisplayName}
								className="h-52 w-52 rounded-full object-cover"
							/>
						</div>
					</div>
				</div>

				<Spacer size="sm" />
				<div className="flex flex-wrap items-center justify-center gap-4">
					<h1 className="text-center text-h2">{userDisplayName}</h1>
				</div>

				{isLoggedInUser && (
					<div className="mt-10 w-full max-w-md">
						<h2 className="mb-4 text-xl font-semibold">
							Job Posting Notifications
						</h2>
						<Form method="post" {...getFormProps(form)}>
							<div className="space-y-4">
								<Label className="text-base font-medium">Job Categories</Label>
								{categories.map(category => {
									const control = useInputControl(fields.categories)
									return (
										<div key={category} className="flex items-center space-x-2">
											<Checkbox
												id={category.toLowerCase().replace(' ', '-')}
												checked={((control.value as string[]) || []).includes(
													category,
												)}
												onCheckedChange={checked => {
													const currentCategories =
														(control.value as string[]) || []
													const newCategories = checked
														? [...currentCategories, category]
														: currentCategories.filter(c => c !== category)
													control.change(newCategories)
												}}
											/>
											<input
												{...getInputProps(fields.categories, {
													type: 'checkbox',
													value: category,
												})}
												className="sr-only"
											/>
											<Label
												htmlFor={category.toLowerCase().replace(' ', '-')}
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											>
												{category}
											</Label>
										</div>
									)
								})}
								{fields.categories.errors && (
									<div className="text-red-500">{fields.categories.errors}</div>
								)}
							</div>

							<div className="mt-4 space-y-4">
								<Label className="text-base font-medium">
									Notification Frequency
								</Label>
								<RadioGroup
									defaultValue={fields.frequency.value as string}
									onValueChange={value => fields.frequency.onChange(value)}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="daily" id="daily" />
										<Label htmlFor="daily">Daily</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="weekly" id="weekly" disabled />
										<Label htmlFor="weekly" className="opacity-50">
											Weekly (Coming soon)
										</Label>
									</div>
								</RadioGroup>
								<input
									{...getInputProps(fields.frequency, { type: 'hidden' })}
								/>
								{fields.frequency.errors && (
									<div className="text-red-500">{fields.frequency.errors}</div>
								)}
							</div>

							<p className="mt-2 text-sm text-muted-foreground">
								While we are in beta, weekly postings are only available until
								we get it going.
							</p>

							<Button type="submit" className="mt-4">
								Save Preferences
							</Button>
						</Form>
					</div>
				)}

				<div className="mt-10 flex gap-4">
					{/* {isLoggedInUser ? ( */}
					{/* 	<> */}
					{/* 		<Button asChild> */}
					{/* 			<Link to="notes" prefetch="intent"> */}
					{/* 				My notes */}
					{/* 			</Link> */}
					{/* 		</Button> */}
					{/* 		<Button asChild> */}
					{/* 			<Link to="/settings/profile" prefetch="intent"> */}
					{/* 				Edit profile */}
					{/* 			</Link> */}
					{/* 		</Button> */}
					{/* 	</> */}
					{/* ) : ( */}
					{/* 	<Button asChild> */}
					{/* 		<Link to="notes" prefetch="intent"> */}
					{/* 			{userDisplayName}'s notes */}
					{/* 		</Link> */}
					{/* 	</Button> */}
					{/* )} */}
				</div>
			</div>
		</div>
	)
}

//TODO: ADD LATER?
// export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
// 	const displayName = data?.user.name ?? params.username
// 	return [
// 		{ title: `${displayName} | Epic Notes` },
// 		{
// 			name: 'description',
// 			content: `Profile of ${displayName} on Epic Notes`,
// 		},
// 	]
// }

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No user with the username "{params.username}" exists</p>
				),
			}}
		/>
	)
}
