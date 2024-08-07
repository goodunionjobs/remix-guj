import { json } from '@remix-run/node'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
// TODO: in Staging make it so emails send to test email. Check deliveraibility rate from there. Maybe make it a test?

export const loader = async () => {
	try {
		const { data, error } = await resend.emails.send({
			from: 'Acme <info@jobs.goodunionjobs.com>',
			to: 'ivanl@fastmail.com',
			subject: 'Hello world',
			html: '<strong>It works!</strong>',
			text: 'dfel',
		})

		console.log('Response data:', data)
		console.log('Response error:', error)

		if (error) {
			console.log('Email send error:', error)
			return json({ error }, 400)
		}

		return json(data, 200)
	} catch (err) {
		console.log('Caught error in loader:', err)
		return json({ error: 'Unexpected error occurred' }, 500)
	}
}

// import { json } from '@remix-run/node'
// import { Resend } from 'resend'
//
// const resend = new Resend(process.env.RESEND_API_KEY)
//
// export const loader = async () => {
// 	const { data, error } = await resend.emails.send({
// 		from: 'Acme <info@jobs.goodunionjobs.com>',
// 		to: ['ivanl@fastmail.com'],
// 		subject: 'Hello world',
// 		html: '<strong>It works!</strong>',
// 	})
//
// 	console.log(data)
//
// 	if (error) {
// 		console.log('hereerere')
// 		return json({ error }, 400)
// 	}
//
// 	return json(data, 200)
// }
