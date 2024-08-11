// app/routes/resources+/show-toast.ts
import { json } from '@remix-run/node'
import { createToastHeaders } from '#app/utils/toast.server'

export async function action({ request }: { request: Request }) {
	const formData = await request.formData()
	const description = formData.get('description')
	if (typeof description !== 'string') {
		return json({ success: false })
	}

	return json(
		{ success: true },
		{
			headers: await createToastHeaders({
				description,
				type: 'success',
			}),
		},
	)
}
