import { generateSitemap } from '@nasa-gcn/remix-seo'
import { type ServerBuild, type LoaderFunctionArgs } from '@remix-run/node'
import { getDomainUrl } from '#app/utils/misc.tsx'

export async function loader({ request, context }: LoaderFunctionArgs) {
	const serverBuild = (await context.serverBuild) as ServerBuild
	return generateSitemap(request, serverBuild.routes, {
		siteUrl: getDomainUrl(request),
		headers: {
			'Cache-Control': `public, max-age=${60 * 5}`,
		},
	})
}

// TODO: Need to add dynamic sitemap for each job page itself. 
// Also, need for algolia seo pages


// To generate sitemap for dynamic routes
// routes/blog/$blogslug.tsx

// export const handle: SEOHandle = {
//   getSitemapEntries: async (request) => {
//     const blogs = await db.blog.findMany();
//     return blogs.map((blog) => {
//       return { route: `/blog/${blog.slug}`, priority: 0.7 };
//     });
//   },
// };
