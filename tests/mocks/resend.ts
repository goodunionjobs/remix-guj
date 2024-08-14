// import { faker } from '@faker-js/faker'
// import { HttpResponse, http, type HttpHandler } from 'msw'
// import { requireHeader, writeEmail } from './utils.ts'
//
// const { json } = HttpResponse
//
// export const handlers: Array<HttpHandler> = [
// 	http.post(`https://api.resend.com/emails`, async ({ request }) => {
// 		requireHeader(request.headers, 'Authorization')
// 		const body = await request.json()
// 		console.info('🔶 mocked email contents:', body)
//
// 		const email = await writeEmail(body)
//
// 		return json({
// 			id: faker.string.uuid(),
// 			from: email.from,
// 			to: email.to,
// 			created_at: new Date().toISOString(),
// 		})
// 	}),
// ]
import { faker } from '@faker-js/faker'
import { HttpResponse, http, type HttpHandler } from 'msw'
import { requireHeader, writeEmail } from './utils.ts'

const { json } = HttpResponse

export const handlers: Array<HttpHandler> = [
	http.post(`https://api.resend.com/emails`, async ({ request }) => {
		try {
			requireHeader(request.headers, 'Authorization')
			const body = await request.json()
			console.info('🔶 mocked email request body:', body)

			const email = await writeEmail(body)

			const response = {
				id: faker.string.uuid(),
				from: email.from,
				to: email.to,
				created_at: new Date().toISOString(),
			}

			console.info('🔶 mocked email response:', response)
			return json(response)
		} catch (err) {
			console.error('Error in MSW handler:', err)
			return new HttpResponse('Bad Request', { status: 400 })
		}
	}),
]
