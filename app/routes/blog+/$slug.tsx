import { type MetaFunction } from '@remix-run/node'
import { Link, useParams } from '@remix-run/react'
import { blogPosts, getBlogPost, getRelatedBlogPosts } from '#app/content/blog'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'
import { organizationSchema } from '#app/utils/constants'

export const meta: MetaFunction = ({ params }) => {
	const post = params.slug ? getBlogPost(params.slug) : null

	if (!post) {
		return [
			{ title: 'Article Not Found | Good Union Jobs' },
			{ name: 'robots', content: 'noindex' },
		]
	}

	const canonicalUrl = `https://goodunionjobs.com/blog/${post.slug}`
	const articleSchema = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.description,
		datePublished: post.date,
		dateModified: post.date,
		author: {
			'@type': 'Organization',
			name: post.author,
		},
		publisher: {
			'@type': 'Organization',
			name: 'Good Union Jobs',
			logo: {
				'@type': 'ImageObject',
				url: 'https://goodunionjobs.com/favicons/512x512.png',
			},
		},
		mainEntityOfPage: canonicalUrl,
	}

	return [
		{ title: `${post.title} | Good Union Jobs` },
		{ name: 'description', content: post.description },
		{ property: 'robots', content: 'index,follow' },
		{ 'script:ld+json': organizationSchema },
		{ 'script:ld+json': articleSchema },
		{ tagName: 'link', rel: 'canonical', href: canonicalUrl },
	]
}

export default function BlogPostRoute() {
	const params = useParams()
	const post = params.slug ? getBlogPost(params.slug) : null

	if (!post) {
		return (
			<main className="mx-auto max-w-3xl px-4 py-16 text-center">
				<h1 className="text-3xl font-bold">Article not found</h1>
				<p className="mt-4 text-muted-foreground">
					This blog post is not available.
				</p>
				<Button asChild className="mt-8">
					<Link to="/blog">Back to the blog</Link>
				</Button>
			</main>
		)
	}

	const relatedPosts = getRelatedBlogPosts(post.slug)

	return (
		<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
			<nav
				aria-label="Breadcrumb"
				className="mb-8 text-sm text-muted-foreground"
			>
				<Link to="/" className="hover:text-foreground">
					Home
				</Link>
				<span className="mx-2">/</span>
				<Link to="/blog" className="hover:text-foreground">
					Blog
				</Link>
				<span className="mx-2">/</span>
				<span>{post.category}</span>
			</nav>

			<article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
				<div className="min-w-0">
					<header className="border-b border-border pb-8">
						<p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
							{post.category}
						</p>
						<h1 className="max-w-4xl text-4xl font-bold tracking-normal sm:text-5xl">
							{post.title}
						</h1>
						<p className="mt-5 max-w-3xl text-lg text-muted-foreground">
							{post.description}
						</p>
						<div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
							<span className="font-medium text-foreground">{post.author}</span>
							<span aria-hidden="true">•</span>
							<time dateTime={post.date}>{post.displayDate}</time>
							<span aria-hidden="true">•</span>
							<span>{post.readMinutes} minutes read</span>
						</div>
					</header>

					<div
						className="my-8 rounded-lg bg-gradient-to-br from-blue-700 via-slate-900 to-amber-400 p-6 text-white shadow-sm"
						role="img"
						aria-label={post.heroAlt}
					>
						<div className="flex min-h-56 flex-col justify-end">
							<p className="max-w-2xl text-sm text-blue-100">{post.heroAlt}</p>
							<p className="mt-3 max-w-2xl text-2xl font-bold">
								Remote work can be flexible. Union work can be stable. The best
								searches verify both.
							</p>
						</div>
					</div>

					<div className="max-w-none text-lg leading-8">
						{post.sections.map(section => (
							<section
								key={section.id}
								id={section.id}
								className="mb-14 scroll-mt-24"
							>
								{section.eyebrow ? (
									<p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
										{section.eyebrow}
									</p>
								) : null}
								<h2 className="mb-5 text-3xl font-bold leading-tight tracking-normal">
									{section.title}
								</h2>
								{section.paragraphs.map(paragraph => (
									<p key={paragraph} className="mb-6 text-muted-foreground">
										{paragraph}
									</p>
								))}
								{section.bullets ? (
									<ul className="mt-6 list-disc space-y-3 pl-6 text-muted-foreground">
										{section.bullets.map(bullet => (
											<li key={bullet}>{bullet}</li>
										))}
									</ul>
								) : null}
							</section>
						))}

						<section id="comparison" className="mb-14 scroll-mt-24">
							<h2 className="mb-5 text-3xl font-bold leading-tight tracking-normal">
								{post.comparisonTitle}
							</h2>
							<div className="not-prose overflow-x-auto rounded-lg border border-border">
								<table className="w-full min-w-[760px] border-collapse text-left text-sm">
									<thead className="bg-muted">
										<tr>
											<th className="border-b border-border p-4 font-semibold">
												Role
											</th>
											<th className="border-b border-border p-4 font-semibold">
												Common union path
											</th>
											<th className="border-b border-border p-4 font-semibold">
												Remote fit
											</th>
											<th className="border-b border-border p-4 font-semibold">
												What to verify
											</th>
										</tr>
									</thead>
									<tbody>
										{post.comparisonRows.map(row => (
											<tr key={row.role} className="border-b border-border">
												<td className="p-4 font-medium">{row.role}</td>
												<td className="p-4 text-muted-foreground">
													{row.unionPath}
												</td>
												<td className="p-4 text-muted-foreground">
													{row.remoteFit}
												</td>
												<td className="p-4 text-muted-foreground">
													{row.whatToCheck}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>

						<section id="next-steps" className="scroll-mt-24">
							<h2 className="mb-5 text-3xl font-bold leading-tight tracking-normal">
								{post.closingTitle}
							</h2>
							{post.closingParagraphs.map(paragraph => (
								<p key={paragraph} className="mb-6 text-muted-foreground">
									{paragraph}
								</p>
							))}
						</section>
					</div>

					<section className="mt-10 rounded-lg border border-border bg-muted/40 p-6">
						<h2 className="text-2xl font-bold">Ready to search?</h2>
						<p className="mt-3 text-muted-foreground">
							Browse current union job listings and use remote-friendly titles
							as your starting point.
						</p>
						<Button asChild className="mt-5">
							<Link to="/">
								<Icon name="search" className="h-4 w-4">
									Search union jobs
								</Icon>
							</Link>
						</Button>
					</section>

					<section className="mt-10 border-t border-border pt-8">
						<p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
							Author
						</p>
						<h2 className="mt-2 text-2xl font-bold">{post.author}</h2>
						<p className="mt-2 text-muted-foreground">{post.authorTitle}</p>
						<p className="mt-4 text-muted-foreground">
							We study union job listings, employer career pages, and practical
							search patterns to help workers find roles with better structure,
							benefits, and long-term stability.
						</p>
					</section>
				</div>

				<aside className="lg:sticky lg:top-6 lg:self-start">
					<div className="rounded-lg border border-border p-5">
						<h2 className="text-lg font-bold">Table of Contents</h2>
						<ol className="mt-4 space-y-3 text-sm">
							{post.sections.map((section, index) => (
								<li key={section.id}>
									<a
										href={`#${section.id}`}
										className="text-muted-foreground hover:text-foreground"
									>
										{index + 1}. {section.title}
									</a>
								</li>
							))}
							<li>
								<a
									href="#comparison"
									className="text-muted-foreground hover:text-foreground"
								>
									{post.sections.length + 1}. {post.comparisonTitle}
								</a>
							</li>
							<li>
								<a
									href="#next-steps"
									className="text-muted-foreground hover:text-foreground"
								>
									{post.sections.length + 2}. {post.closingTitle}
								</a>
							</li>
						</ol>
					</div>
				</aside>
			</article>

			<section className="mt-14 border-t border-border pt-8">
				<h2 className="text-2xl font-bold">Similar articles</h2>
				<div className="mt-5 grid gap-5 md:grid-cols-2">
					{relatedPosts.length > 0 ? (
						relatedPosts.map(relatedPost => (
							<Link
								key={relatedPost.slug}
								to={`/blog/${relatedPost.slug}`}
								className="rounded-lg border border-border p-5 hover:bg-muted"
							>
								<p className="text-sm text-muted-foreground">
									{relatedPost.category}
								</p>
								<h3 className="mt-2 text-xl font-bold">{relatedPost.title}</h3>
								<p className="mt-2 text-muted-foreground">
									{relatedPost.description}
								</p>
							</Link>
						))
					) : (
						<Link
							to="/blog"
							className="rounded-lg border border-border p-5 hover:bg-muted"
						>
							<p className="text-sm text-muted-foreground">More guides</p>
							<h3 className="mt-2 text-xl font-bold">
								Browse the Good Union Jobs blog
							</h3>
							<p className="mt-2 text-muted-foreground">
								New union job search guides will appear here as they are added.
							</p>
						</Link>
					)}
				</div>
			</section>
		</main>
	)
}
