import { remember } from '@epic-web/remember'
import { Pool, neonConfig } from '@neondatabase/serverless'
import chalk from 'chalk'
import { DefaultLogger, type LogWriter } from 'drizzle-orm/logger'
import { drizzle } from 'drizzle-orm/neon-serverless'
import ws from 'ws'
import * as schema from '../../drizzle/schema'

const logThreshold = 20

class MyLogWriter implements LogWriter {
	write(message: string) {
		const durationMatch = message.match(/(\d+ms)/)
		if (durationMatch) {
			const duration = parseInt(durationMatch[0], 10)
			if (duration < logThreshold) return
			const color =
				duration < logThreshold * 1.1
					? 'green'
					: duration < logThreshold * 1.2
						? 'blue'
						: duration < logThreshold * 1.3
							? 'yellow'
							: duration < logThreshold * 1.4
								? 'redBright'
								: 'red'
			const dur = chalk[color](durationMatch[0])
			console.info(`drizzle:query - ${dur} - ${message}`)
		} else {
			console.info(`drizzle:query - ${message}`)
		}
	}
}

const createDbClient = () => {
	neonConfig.webSocketConstructor = ws
	const pool = new Pool({ connectionString: process.env.DATABASE_URL })

	//HERE
	const logger = new DefaultLogger({ writer: new MyLogWriter() })

	// Create a Drizzle client with custom logger
	const db = drizzle(pool, { schema, logger })

	return db
}

// Use `remember` to ensure the client is only created once
export const db = remember('db', createDbClient)
