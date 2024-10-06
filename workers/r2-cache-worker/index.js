//TODO: SETUP GITHUB C/I for this to make sure when done setting up staging you deploy new production cloudflare worker!
export default {
	async fetch(request, env, context) {
		try {
			const url = new URL(request.url)
			const bucket = env.BUCKET
			if (!bucket) {
				throw new Error('No R2 bucket bound to this environment')
			}

			const cacheKey = new Request(url.toString(), request)
			const cache = caches.default
			let response = await cache.match(cacheKey)

			if (response) {
				console.log(`Cache hit for: ${request.url}.`)
				return response
			}

			console.log(`Cache miss for: ${request.url}. Fetching from R2.`)

			const objectKey = decodeURIComponent(url.pathname.slice(1))
			const object = await bucket.get(objectKey)

			if (object === null) {
				return this.handle404(url)
			}

			const headers = new Headers()
			object.writeHttpMetadata(headers)
			headers.set('etag', object.httpEtag)

			const contentType = this.getContentType(objectKey)
			if (contentType) {
				headers.set('Content-Type', contentType)
			}

			headers.set('Cache-Control', 'public, max-age=31536000, immutable')

			response = new Response(object.body, {
				headers,
			})

			context.waitUntil(cache.put(cacheKey, response.clone()))
			return response
		} catch (e) {
			return new Response('Error: ' + e.message, { status: 500 })
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

	handle404(url) {
		const homeUrl = `${url.protocol}//${url.hostname}`
		const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Asset Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; }
          h1 { color: #e74c3c; }
          a { color: #3498db; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>404 - Asset Not Found</h1>
        <p>We're sorry, but the asset you're looking for could not be found.</p>
        <p>Click <a href="${homeUrl}">here</a> to return to the homepage.</p>
      </body>
      </html>
    `
		return new Response(html, {
			status: 404,
			headers: { 'Content-Type': 'text/html' },
		})
	},
}
