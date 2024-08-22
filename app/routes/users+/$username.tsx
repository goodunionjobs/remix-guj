import { useForm, getFormProps } from '@conform-to/react'
import { parseWithZod, getZodConstraint } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
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
	useNavigation,
	useSubmit,
	useFetcher,
} from '@remix-run/react'
import { eq } from 'drizzle-orm'
import { InfoIcon } from 'lucide-react'
import { z } from 'zod'
import { CheckboxGroupConform } from '#app/components/conform/CheckboxGroup.js'
import { RadioGroupConform } from '#app/components/conform/RadioGroup.js'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Label } from '#app/components/ui/label'
import { db } from '#app/utils/db.server'
import { createToastHeaders } from '#app/utils/toast.server.js'
import { users, usersToCategories } from '../../../drizzle/schema'

const schema = z.object({
	categories: z.array(z.string()).min(1, 'Select at least one category'),
	emailFrequency: z.enum(['daily', 'weekly'], {
		required_error: 'Please select a notification frequency',
	}),
})

export async function loader({ request }: LoaderFunctionArgs) {
	const { getUser } = await getKindeSession(request)
	const user = await getUser()

	if (user === null) {
		throw redirect('/kinde-auth/login')
	}

	let dbUser = await db.query.users.findFirst({
		where: eq(users.email, user.email),
		with: {
			usersCategories: {
				columns: {},
				with: {
					category: true,
				},
			},
		},
	})

	//TODO: Think we need to still check if person does not exist
	invariantResponse(dbUser, "User not found/doesn't exist")

	const allCategories = await db.query.categories.findMany()

	return json({ user: dbUser, allCategories })
}

export async function action({ request }: ActionFunctionArgs) {
	console.log('Action function called') // Add this line for debugging
	const { getUser } = await getKindeSession(request)
	const user = await getUser()

	if (user === null) {
		throw redirect('/kinde-auth/login')
	}

	const formData = await request.formData()
	console.log('Form data received:', Object.fromEntries(formData)) // Add this line for debugging

	const submission = parseWithZod(formData, { schema })

	if (submission.status !== 'success') {
		console.log('Submission failed:', submission.error) // Add this line for debugging

		console.log('Action completed successfully') // Add this line for debugging
		return json(submission.reply())
	}

	const dbUser = await db.query.users.findFirst({
		where: eq(users.email, user.email),
	})

	invariantResponse(dbUser, "User doesn't exist/ not found")

	// Update email frequency
	await db
		.update(users)
		.set({
			emailFrequency: submission.value.emailFrequency,
			//TODO: Need to workout default in schema and make it work on default for updatedat
			updatedAt: new Date(),
		})
		.where(eq(users.id, dbUser.id))

	// Update category subscriptions
	await db
		.delete(usersToCategories)
		.where(eq(usersToCategories.userId, dbUser.id))
	await db.insert(usersToCategories).values(
		submission.value.categories.map(categoryName => ({
			userId: dbUser.id,
			categoryName,
		})),
	)

	const headers = await createToastHeaders({
		title: 'Success!',
		description: 'Your preferences have been updated.',
		type: 'success',
	})

	return json({ status: 'success', ...submission.reply() }, { headers })
}

export default function ProfileRoute() {
	const fetcher = useFetcher()

	const { user, allCategories } = useLoaderData<typeof loader>()
	// const lastResult = useActionData<typeof action>()
	const navigation = useNavigation()
	const submit = useSubmit()
	invariantResponse(user, "User not found/doesn't exist")

	const [form, fields] = useForm({
		id: 'preferences',
		// lastResult,
		constraint: getZodConstraint(schema),
		defaultValue: {
			categories: user.usersCategories.map(uc => uc.category.name),
			emailFrequency: user.emailFrequency,
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
	})

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		console.log('Form submitted') // Add this line for debugging
		submit(event.currentTarget)
	}

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center">
			<div className="container flex flex-col items-center rounded-3xl bg-muted p-12">
				<div className="mb-8 mt-6 flex flex-col items-center justify-center rounded-lg bg-blue-100 p-4 text-blue-700 sm:flex-row">
					<InfoIcon className="mb-2 h-8 w-8 sm:mb-0 sm:mr-3" />
					<p className="text-center text-lg font-medium">
						Complete the form below to get job notifications sent to your email
						inbox
					</p>
				</div>

				<fetcher.Form
					method="post"
					{...getFormProps(form)}
					onSubmit={handleSubmit}
					className="w-full max-w-2xl"
				>
					<div className="space-y-4">
						<div className="mb-4 flex flex-col items-center">
							<Label className="mb-2 text-2xl font-bold sm:text-3xl">
								Job Categories
							</Label>
							<p className="text-xs text-gray-600 dark:text-gray-400">
								Choose what types of jobs you receive
							</p>
						</div>
						<CheckboxGroupConform
							meta={fields.categories}
							items={allCategories.map(category => ({
								value: category.name,
								name: category.name,
							}))}
						/>
						{fields.categories.errors && (
							<div className="text-red-500">{fields.categories.errors}</div>
						)}
					</div>

					<div className="mt-4 space-y-4">
						<div className="mb-4 flex flex-col items-center">
							<Label className="mb-2 text-2xl font-bold sm:text-3xl">
								Notification Frequency
							</Label>
							<p className="text-xs text-gray-600 dark:text-gray-400">
								Receive either weekly or daily emails about new jobs
							</p>
						</div>
						<RadioGroupConform
							meta={fields.emailFrequency}
							items={[
								{ value: 'daily', label: 'Daily' },
								{ value: 'weekly', label: 'Weekly' },
							]}
							className="justify-center"
						/>
						{fields.emailFrequency.errors && (
							<div className="mt-2 text-center text-red-500">
								{fields.categories.errors}
							</div>
						)}
					</div>

					<div className="mt-8 flex justify-center">
						<Button
							type="submit"
							disabled={navigation.state === 'submitting'}
							className="px-8"
						>
							{navigation.state === 'submitting'
								? 'Submitting...'
								: 'Save Preferences'}
						</Button>
					</div>
				</fetcher.Form>
			</div>

			{/* {lastResult && ( */}
			{/* 	<div className="mt-4"> */}
			{/* 		<h3>Submission Result:</h3> */}
			{/* 		<pre>{JSON.stringify(lastResult, null, 2)}</pre> */}
			{/* 	</div> */}
			{/* )} */}
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
