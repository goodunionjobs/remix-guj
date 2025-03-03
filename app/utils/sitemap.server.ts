// File: app/utils/sitemap.server.ts

export type SitemapURL = {
	loc: string
	priority?: number
	lastmod?: string | Date
	changefreq?:
		| 'always'
		| 'hourly'
		| 'daily'
		| 'weekly'
		| 'monthly'
		| 'yearly'
		| 'never'
}

/**
 * Generate an XML sitemap from an array of URLs
 */
export function generateSitemap(urls: SitemapURL[]): string {
	const sitemapEntries = urls
		.map(url => {
			// Format the lastmod date if it exists
			const lastmod = url.lastmod
				? url.lastmod instanceof Date
					? url.lastmod.toISOString()
					: url.lastmod
				: undefined

			return `
        <url>
          <loc>${url.loc}</loc>
          ${url.priority ? `<priority>${url.priority}</priority>` : ''}
          ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
          ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
        </url>
      `
		})
		.join('')

	return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemapEntries}
    </urlset>
  `.trim()
}

/**
 * Generate a sitemap index from an array of sitemap URLs
 */
export function generateSitemapIndex(
	sitemaps: { loc: string; lastmod?: string | Date }[],
): string {
	const sitemapEntries = sitemaps
		.map(sitemap => {
			// Format the lastmod date if it exists
			const lastmod = sitemap.lastmod
				? sitemap.lastmod instanceof Date
					? sitemap.lastmod.toISOString()
					: sitemap.lastmod
				: undefined

			return `
        <sitemap>
          <loc>${sitemap.loc}</loc>
          ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
        </sitemap>
      `
		})
		.join('')

	return `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemapEntries}
    </sitemapindex>
  `.trim()
}

/**
 * Create a standard sitemap response
 */
export function createSitemapResponse(sitemap: string, status = 200): Response {
	return new Response(sitemap, {
		status,
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=600, immutable', // Cache for 10 minutes
		},
	})
}
