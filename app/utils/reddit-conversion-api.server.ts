import crypto from 'crypto'

interface ConversionEvent {
	click_id?: string
	event_at: string
	event_type: {
		tracking_type: string
		custom_event_name?: string
	}
	event_metadata?: {
		item_count?: number
		currency?: string
		value?: number
		value_decimal?: number
		conversion_id?: string
		products?: Array<{
			id: string
			name: string
			category?: string
		}>
	}
	user: {
		email?: string
		external_id?: string
		uuid?: string
		ip_address?: string
		user_agent?: string
		idfa?: string
		aaid?: string
		opt_out?: boolean
		screen_dimensions?: {
			width: number
			height: number
		}
	}
}

class RedditConversionAPI {
	private accountId: string
	private accessToken: string
	private apiUrl: string

	constructor(accountId: string, accessToken: string) {
		this.accountId = accountId
		this.accessToken = accessToken
		this.apiUrl = `https://ads-api.reddit.com/api/v2.0/conversions/events/${this.accountId}`
	}

	private hashData(data: string): string {
		return crypto.createHash('sha256').update(data).digest('hex')
	}

	private normalizeAndHashEmail(email: string): string {
		// Convert to lowercase
		let normalizedEmail = email.toLowerCase()

		// Remove dots and everything after '+' in the local part
		const [localPart, domain] = normalizedEmail.split('@')
		const normalizedLocalPart = localPart.replace(/\./g, '').split('+')[0]

		normalizedEmail = `${normalizedLocalPart}@${domain}`

		// Hash the normalized email
		return this.hashData(normalizedEmail)
	}

	async sendEvents(events: ConversionEvent[], testMode: boolean = false) {
		const hashedEvents = events.map(event => ({
			...event,
			user: {
				...event.user,
				email: event.user.email
					? this.normalizeAndHashEmail(event.user.email)
					: undefined,
				external_id: event.user.external_id
					? this.hashData(event.user.external_id)
					: undefined,
				ip_address: event.user.ip_address
					? this.hashData(event.user.ip_address)
					: undefined,
				idfa: event.user.idfa
					? this.hashData(event.user.idfa.toUpperCase())
					: undefined,
				aaid: event.user.aaid
					? this.hashData(event.user.aaid.toLowerCase())
					: undefined,
			},
		}))

		const payload = {
			test_mode: testMode,
			events: hashedEvents,
		}

		try {
			const response = await fetch(this.apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.accessToken}`,
				},
				body: JSON.stringify(payload),
			})

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			return await response.json()
		} catch (error) {
			console.error('Error sending events to Reddit Conversion API:', error)
			throw error
		}
	}
}

export const redditConversionAPI = new RedditConversionAPI(
	process.env.REDDIT_ACCOUNT_ID!,
	process.env.REDDIT_ACCESS_TOKEN!,
)
