import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUserId, logout } from '#app/utils/auth.server.ts'
import { db } from '#app/utils/db.server.ts'
// import { eq } from 'drizzle-orm'
import { getKindeSession } from '@kinde-oss/kinde-remix-sdk'

export async function loader({ request }: LoaderFunctionArgs) {
	//TODO: Flesh out replacement below to match detail of kinde
	// const userId = await requireUserId(request)
	const { getUser } = await getKindeSession(request)
	const kindeUser = await getUser()

	if (kindeUser === null) {
		throw redirect('/kinde-auth/login')
	}
	const user = await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.id, kindeUser.id),
	})
	//TODO: Do we need to fix below?
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
