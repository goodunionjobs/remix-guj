import { createCookieSessionStorage } from '@remix-run/node'

export const signupPopupStorage = createCookieSessionStorage({
	cookie: {
		name: 'signup_popup_shown',
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: process.env.SESSION_SECRET.split(','),
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 5, // 5 days in seconds
	},
})

export async function setPopupShown(request: Request) {
	const session = await signupPopupStorage.getSession(
		request.headers.get('cookie'),
	)
	session.set('shown', 'true')
	return new Headers({
		'set-cookie': await signupPopupStorage.commitSession(session),
	})
}

export async function hasPopupBeenShown(request: Request) {
	const session = await signupPopupStorage.getSession(
		request.headers.get('cookie'),
	)
	return session.has('shown')
}

// Use this in your root loader
export async function checkPopupStatus(request: Request) {
	const shouldShow = !(await hasPopupBeenShown(request))
	return { shouldShowSignupPopup: shouldShow }
}

// Use this when user dismisses the popup
export async function dismissPopup(request: Request) {
	return {
		headers: await setPopupShown(request),
	}
}
