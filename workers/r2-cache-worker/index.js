export default {
	async fetch(request, env, context) {
		try {
			const url = new URL(request.url)

			// Determine which bucket to use based on the environment
			const bucket = env.BUCKET
			if (!bucket) {
				throw new Error('No R2 bucket bound to this environment')
			}

			// Construct the cache key from the cache URL
			const cacheKey = new Request(url.toString(), request)
			const cache = caches.default

			// Check whether the value is already available in the cache
			let response = await cache.match(cacheKey)

			if (response) {
				console.log(`Cache hit for: ${request.url}.`)
				return response
			}

			console.log(`Cache miss for: ${request.url}. Fetching from R2.`)

			// Decode the URL-encoded path (to handle spaces and other special characters)
			const objectKey = decodeURIComponent(url.pathname.slice(1))

			// Fetch the object from R2 using the decoded objectKey
			const object = await bucket.get(objectKey)
			if (object === null) {
				return new Response('Object Not Found', { status: 404 })
			}

			// Set the appropriate object headers
			const headers = new Headers()
			object.writeHttpMetadata(headers)
			headers.set('etag', object.httpEtag)

			// Set Content-Type based on file extension
			const contentType = this.getContentType(objectKey)
			if (contentType) {
				headers.set('Content-Type', contentType)
			}

			// Set Cache-Control header for longer caching (e.g., 1 hour)
			headers.set('Cache-Control', 'public, max-age=3600')

			response = new Response(object.body, {
				headers,
			})

			// Store the fetched response as cacheKey
			context.waitUntil(cache.put(cacheKey, response.clone()))

			return response
		} catch (e) {
			return new Response('Error thrown ' + e.message)
		}
	},

	getContentType(key) {
		const extension = key.split('.').pop().toLowerCase()
		const contentTypes = {
			avif: 'image/avif',
			webp: 'image/webp',
			jpeg: 'image/jpeg',
			jpg: 'image/jpeg',
			png: 'image/png',
			gif: 'image/gif',
		}
		return contentTypes[extension] || 'application/octet-stream'
	},
}
