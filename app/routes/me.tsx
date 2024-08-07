import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUserId, logout } from '#app/utils/auth.server.ts'
import { db } from '#app/utils/db.server.ts'
// import { eq } from 'drizzle-orm'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	// TODO: Add in Kinde require user id replacement above
	const user = await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.id, userId),
	})
	if (!user) {
		const requestUrl = new URL(request.url)
		const loginParams = new URLSearchParams([
			['redirectTo', `${requestUrl.pathname}${requestUrl.search}`],
		])
		const redirectTo = `/login?${loginParams}`
		await logout({ request, redirectTo })
		return redirect(redirectTo)
	}

	//TODO: Should be email or just kindeId?
	return redirect(`/users/${user.email}`)
	// return redirect(`/users/${user.username}`)
}
