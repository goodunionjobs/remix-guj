import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

neonConfig.webSocketConstructor = WebSocket
neonConfig.fetchFunction = (
	url: Parameters<typeof fetch>[0],
	options: Parameters<typeof fetch>[1],
) => {
	options = options ?? {}
	options.headers = {
		...(options.headers ?? {}),
		connection: 'keep-alive',
	}
	options.priority = 'high'
	return fetch(url, options)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const db = drizzle(pool, { schema })
