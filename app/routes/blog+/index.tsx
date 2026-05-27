import { type MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { blogPosts, getFeaturedBlogPosts } from '#app/content/blog'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'
import { organizationSchema } from '#app/utils/constants'

export const meta: MetaFunction = () => {
	const canonicalUrl = 'https://goodunionjobs.com/blog'

	return [
		{ title: 'Union Job Search Blog | Good Union Jobs' },
		{
			name: 'description',
			content:
				'Practical guides for finding union jobs, remote union roles, strong benefits, and fair-work career paths.',
		},
		{ property: 'robots', content: 'index,follow' },
		{ 'script:ld+json': organizationSchema },
		{ tagName: 'link', rel: 'canonical', href: canonicalUrl },
	]
}

export default function BlogIndexRoute() {
	const featuredPosts = getFeaturedBlogPosts()
	const latestPosts = [...blogPosts].sort((a, b) =>
		b.date.localeCompare(a.date),
	)

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
				<span>Blog</span>
			</nav>

			<section className="mb-12 border-b border-border pb-10">
				<p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
					Good Union Jobs Blog
				</p>
				<h1 className="max-w-3xl text-4xl font-bold tracking-normal sm:text-5xl">
					Union job search guides for better pay, benefits, and stability.
				</h1>
				<p className="mt-5 max-w-2xl text-lg text-muted-foreground">
					Practical advice for finding legitimate union jobs, understanding
					remote-friendly roles, and applying with confidence.
				</p>
			</section>

			<section aria-labelledby="featured-articles" className="mb-14">
				<div className="mb-6 flex items-center justify-between gap-4">
					<h2 id="featured-articles" className="text-2xl font-bold">
						Featured Articles
					</h2>
				</div>
				<div className="grid gap-5 md:grid-cols-2">
					{featuredPosts.map(post => (
						<ArticleCard key={post.slug} post={post} featured />
					))}
				</div>
			</section>

			<section aria-labelledby="latest-articles" className="mb-6">
				<div className="mb-6 flex items-center justify-between gap-4">
					<h2 id="latest-articles" className="text-2xl font-bold">
						Latest Articles
					</h2>
					<Button asChild variant="outline">
						<Link to="/">
							<Icon name="search" className="h-4 w-4">
								Search jobs
							</Icon>
						</Link>
					</Button>
				</div>
				<div className="grid gap-5">
					{latestPosts.map(post => (
						<ArticleCard key={post.slug} post={post} />
					))}
				</div>
			</section>
		</main>
	)
}

function ArticleCard({
	post,
	featured = false,
}: {
	post: (typeof blogPosts)[number]
	featured?: boolean
}) {
	return (
		<article className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
			<Link
				to={`/blog/${post.slug}`}
				className="block bg-gradient-to-br from-blue-700 via-slate-900 to-amber-400 p-6 text-white"
				aria-label={post.title}
			>
				<div className="flex min-h-44 flex-col justify-between">
					<p className="text-sm font-semibold uppercase tracking-wide text-amber-200">
						{post.category}
					</p>
					<div>
						<p className="text-sm text-blue-100">{post.heroAlt}</p>
						<h3
							className={
								featured ? 'mt-4 text-2xl font-bold' : 'mt-4 text-xl font-bold'
							}
						>
							{post.title}
						</h3>
					</div>
				</div>
			</Link>
			<div className="p-6">
				<p className="text-muted-foreground">{post.description}</p>
				<div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
					<span>{post.author}</span>
					<span aria-hidden="true">•</span>
					<time dateTime={post.date}>{post.displayDate}</time>
					<span aria-hidden="true">•</span>
					<span>{post.readMinutes} minutes read</span>
				</div>
			</div>
		</article>
	)
}
