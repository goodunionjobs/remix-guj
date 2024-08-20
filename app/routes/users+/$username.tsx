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
import { Checkbox } from '#app/components/ui/checkbox'
import { Label } from '#app/components/ui/label'
import { RadioGroup, RadioGroupItem } from '#app/components/ui/radio-group'
import { db } from '#app/utils/db.server'
import { users, categories, usersToCategories } from '../../../drizzle/schema'
import { eq } from 'drizzle-orm'

const schema = z.object({
	categories: z.array(z.string()).min(1, 'Select at least one category'),
	emailFrequency: z.enum(['daily', 'weekly'], {
		required_error: 'Please select a notification frequency',
	}),
})

export async function loader({ params, request }: LoaderFunctionArgs) {
	const { getUser } = await getKindeSession(request)
	const user = await getUser()

	if (user === null) {
		throw redirect('/kinde-auth/login')
	}

	return json({
		user,
	})

	// const dbUser = await db.query.users.findFirst({
	// 	where: eq(users.kindeUserId, user.id),
	// 	with: {
	// 		usersCategories: {
	// 			columns: {},
	// 			with: {
	// 				category: true,
	// 			},
	// 		},
	// 	},
	// })

	//    let newUser
	//  if (dbUser === undefined) {
	//    newUser = await db.insert(users).values({
	//    kindeUserId: user.id,
	//    email: user.email,
	//     firstName: user.given_name,
	//     lastName: user.family_name,
	//    })
	//
	// await db.insert(usersToCategories).values(
	// 	submission.value.categories.map(categoryName => ({
	// 		userId: dbUser.id,
	// 		categoryName,
	// 	})),
	//  }

	// const allCategories = await db.query.categories.findMany()

	// return json({ user: dbUser, allCategories })
}

// export async function action({ request }: ActionFunctionArgs) {
// 	const { getUser } = await getKindeSession(request)
// 	const user = await getUser()
//
// 	if (user === null) {
// 		throw redirect('/kinde-auth/login')
// 	}
//
// 	const formData = await request.formData()
// 	const submission = parseWithZod(formData, { schema })
//
// 	if (submission.status !== 'success') {
// 		return json(submission.reply())
// 	}
//
// 	const dbUser = await db.query.users.findFirst({
// 		where: eq(users.kindeUserId, user.id),
// 	})
//
// 	if (!dbUser) {
// 		throw new Error('User not found')
// 	}
//
// 	// Update email frequency
// 	await db
// 		.update(users)
// 		.set({ emailFrequency: submission.value.emailFrequency })
// 		.where(eq(users.id, dbUser.id))
//
// 	// Update category subscriptions
// 	await db
// 		.delete(usersToCategories)
// 		.where(eq(usersToCategories.userId, dbUser.id))
// 	await db.insert(usersToCategories).values(
// 		submission.value.categories.map(categoryName => ({
// 			userId: dbUser.id,
// 			categoryName,
// 		})),
// 	)
//
// 	return json(submission.reply())
// }

export default function ProfileRoute() {
	const { user } = useLoaderData<typeof loader>()
	// const { user, allCategories } = useLoaderData<typeof loader>()
	// const lastResult = useActionData<typeof action>()
	//
	// const [form, fields] = useForm({
	// 	id: 'preferences',
	// 	lastResult,
	// 	constraint: getZodConstraint(schema),
	// 	defaultValue: {
	// 		categories: user.usersCategories.map(uc => uc.category.name),
	// 		emailFrequency: user.emailFrequency,
	// 	},
	// 	onValidate({ formData }) {
	// 		return parseWithZod(formData, { schema })
	// 	},
	// 	shouldValidate: 'onBlur',
	// 	shouldRevalidate: 'onInput',
	// })

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center">
			<Spacer size="4xs" />

			<div className="container flex flex-col items-center rounded-3xl bg-muted p-12">
				<div className="relative w-52">
					<div className="absolute -top-40">
						<div className="relative">
							<img
								src="/img/user.png"
								alt={user.given_name}
								className="h-52 w-52 rounded-full object-cover"
							/>
						</div>
					</div>
				</div>

				<Spacer size="sm" />
				<div className="flex flex-wrap items-center justify-center gap-4">
					<h1 className="text-center text-h2">{user.given_name}</h1>
				</div>

				<h2 className="mb-4 text-xl font-semibold">
					Job Posting Notifications
				</h2>
				<p>Coming soon where you will be able to pick subscriptions!</p>
				{/* <Form method="post" {...getFormProps(form)}> */}
				{/* 	<div className="space-y-4"> */}
				{/* 		<Label className="text-base font-medium">Job Categories</Label> */}
				{/* 		{allCategories.map(category => { */}
				{/* 			const control = useInputControl(fields.categories) */}
				{/* 			return ( */}
				{/* 				<div */}
				{/* 					key={category.name} */}
				{/* 					className="flex items-center space-x-2" */}
				{/* 				> */}
				{/* 					<Checkbox */}
				{/* 						id={category.name.toLowerCase().replace(' ', '-')} */}
				{/* 						checked={((control.value as string[]) || []).includes( */}
				{/* 							category.name, */}
				{/* 						)} */}
				{/* 						onCheckedChange={checked => { */}
				{/* 							const currentCategories = */}
				{/* 								(control.value as string[]) || [] */}
				{/* 							const newCategories = checked */}
				{/* 								? [...currentCategories, category.name] */}
				{/* 								: currentCategories.filter(c => c !== category.name) */}
				{/* 							control.change(newCategories) */}
				{/* 						}} */}
				{/* 					/> */}
				{/* 					<input */}
				{/* 						{...getInputProps(fields.categories, { */}
				{/* 							type: 'checkbox', */}
				{/* 							value: category.name, */}
				{/* 						})} */}
				{/* 						className="sr-only" */}
				{/* 					/> */}
				{/* 					<Label */}
				{/* 						htmlFor={category.name.toLowerCase().replace(' ', '-')} */}
				{/* 						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" */}
				{/* 					> */}
				{/* 						{category.name} */}
				{/* 					</Label> */}
				{/* 				</div> */}
				{/* 			) */}
				{/* 		})} */}
				{/* 		{fields.categories.errors && ( */}
				{/* 			<div className="text-red-500">{fields.categories.errors}</div> */}
				{/* 		)} */}
				{/* 	</div> */}
				{/**/}
				{/* 	<div className="mt-4 space-y-4"> */}
				{/* 		<Label className="text-base font-medium"> */}
				{/* 			Notification Frequency */}
				{/* 		</Label> */}
				{/* 		<RadioGroup */}
				{/* 			defaultValue={fields.emailFrequency.value as string} */}
				{/* 			onValueChange={value => fields.emailFrequency.onChange(value)} */}
				{/* 		> */}
				{/* 			<div className="flex items-center space-x-2"> */}
				{/* 				<RadioGroupItem value="daily" id="daily" /> */}
				{/* 				<Label htmlFor="daily">Daily</Label> */}
				{/* 			</div> */}
				{/* 			<div className="flex items-center space-x-2"> */}
				{/* 				<RadioGroupItem value="weekly" id="weekly" /> */}
				{/* 				<Label htmlFor="weekly">Weekly</Label> */}
				{/* 			</div> */}
				{/* 		</RadioGroup> */}
				{/* 		<input */}
				{/* 			{...getInputProps(fields.emailFrequency, { type: 'hidden' })} */}
				{/* 		/> */}
				{/* 		{fields.emailFrequency.errors && ( */}
				{/* 			<div className="text-red-500">{fields.emailFrequency.errors}</div> */}
				{/* 		)} */}
				{/* 	</div> */}
				{/**/}
				{/* 	<Button type="submit" className="mt-4"> */}
				{/* 		Save Preferences */}
				{/* 	</Button> */}
				{/* </Form> */}
			</div>

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
