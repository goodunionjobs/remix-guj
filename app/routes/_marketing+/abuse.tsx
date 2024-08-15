import { json, type LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { marked } from 'marked'

type LoaderData = {
	html: string
}

let cachedHtml: string | null = null
let cacheTime: number | null = null

export const loader: LoaderFunction = async ({ request }) => {
	const currentTime = Date.now()
	const cacheDuration = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

	// Get the base URL from the request
	const url = new URL(request.url)
	const baseUrl = `${url.protocol}//${url.host}`

	// If cache is valid, return cached content
	if (cachedHtml && cacheTime && currentTime - cacheTime < cacheDuration) {
		return json({ html: cachedHtml })
	}

	// If cache is invalid or doesn't exist, fetch and parse the content
	try {
		const response = await fetch(`${baseUrl}/markdown/abuse.md`)
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		const markdown = await response.text()
		const html = await marked.parse(markdown)

		// Update cache
		cachedHtml = html
		cacheTime = currentTime

		return json(
			{ html },
			{
				headers: {
					'Cache-Control': `public, max-age=${cacheDuration / 1000}`,
				},
			},
		)
	} catch (error) {
		console.error('Error fetching or parsing Markdown:', error)
		return json(
			{
				html: '<p>Use Restrictions Policy is currently unavailable. Please try again later.</p>',
			},
			{ status: 500 },
		)
	}
}

export default function TermsOfServiceRoute() {
	const { html } = useLoaderData<LoaderData>()

	return (
		<main className="mx-auto max-w-4xl">
			<h1 className="my-6 border-b-2 text-center text-3xl">
				Use Restrictions Policy
			</h1>
			<div
				dangerouslySetInnerHTML={{ __html: html }}
				className="markdown-content"
			/>
			<style>{`
        .markdown-content p {
          margin-bottom: 1em;
        }
        .markdown-content a {
          color: blue;
          text-decoration: underline;
        }
        .markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .markdown-content ul, .markdown-content ol {
          margin-bottom: 1em;
          padding-left: 2em;
        }
        .markdown-content li {
          margin-bottom: 0.5em;
        }
      `}</style>
		</main>
	)
}
