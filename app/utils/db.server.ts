// import { remember } from '@epic-web/remember'
// import { PrismaClient } from '@prisma/client'
// import chalk from 'chalk'
//
// export const prisma = remember('prisma', () => {
// 	// NOTE: if you change anything in this function you'll need to restart
// 	// the dev server to see your changes.
//
// 	// Feel free to change this log threshold to something that makes sense for you
// 	const logThreshold = 20
//
// 	const client = new PrismaClient({
// 		log: [
// 			{ level: 'query', emit: 'event' },
// 			{ level: 'error', emit: 'stdout' },
// 			{ level: 'warn', emit: 'stdout' },
// 		],
// 	})
// 	client.$on('query', async e => {
// 		if (e.duration < logThreshold) return
// 		const color =
// 			e.duration < logThreshold * 1.1
// 				? 'green'
// 				: e.duration < logThreshold * 1.2
// 					? 'blue'
// 					: e.duration < logThreshold * 1.3
// 						? 'yellow'
// 						: e.duration < logThreshold * 1.4
// 							? 'redBright'
// 							: 'red'
// 		const dur = chalk[color](`${e.duration}ms`)
// 		console.info(`prisma:query - ${dur} - ${e.query}`)
// 	})
// 	client.$connect()
// 	return client
// })
//

import { remember } from '@epic-web/remember'
import { neon } from '@neondatabase/serverless'
import chalk from 'chalk'
import { DefaultLogger, LogWriter } from 'drizzle-orm/logger'
import { drizzle } from 'drizzle-orm/neon-http'
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
	const client = neon(process.env.DATABASE_URL!)

	const logger = new DefaultLogger({ writer: new MyLogWriter() })

	// Create a Drizzle client with custom logger
	const db = drizzle(client, { schema, logger })

	return db
}

// Use `remember` to ensure the client is only created once
export const db = remember('db', createDbClient)
