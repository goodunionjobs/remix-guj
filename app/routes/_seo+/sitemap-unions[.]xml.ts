// File: app/routes/_seo+/sitemap.unions[.]xml.ts
import { type LoaderFunction } from '@remix-run/node'
import { cachified, cache } from '#app/utils/cache.server.ts'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { db } from '#app/utils/db.server'
import { guilds } from '../../../drizzle/schema' // Adjust the import path based on your schema structure
import {
	generateSitemap,
	createSitemapResponse,
	type SitemapURL,
} from '#app/utils/sitemap.server'

export const loader: LoaderFunction = async ({ request }) => {
	const baseUrl = getDomainUrl(request)

	const sitemap = await cachified({
		key: 'sitemap-unions',
		cache,
		ttl: 600_000, // 10 minutes
		async getFreshValue() {
			// Get all guilds
			const guildsQuery = await db.select().from(guilds)
			// If you have a lot of guilds, consider implementing pagination like in the jobs example
			// For now, assuming guilds won't reach the 50,000 limit

			// Map guild data to sitemap URLs
			const guildUrls: SitemapURL[] = guildsQuery.map(guild => {
				// Assuming guild.name is the field you want to use in the URL
				const encodedName = encodeURIComponent(guild.name)

				return {
					loc: `${baseUrl}/guilds/${encodedName}`,
					priority: 0.7,
					// lastmod: guild.dateScraped || new Date(),
					changefreq: 'monthly', // Guilds/unions don't change very often
				}
			})

			return generateSitemap(guildUrls)
		},
	})

	return createSitemapResponse(sitemap)
}
