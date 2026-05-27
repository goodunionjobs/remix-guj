import { legitimateWorkFromHomeUnionJobs } from './legitimate-work-from-home-union-jobs'

export const blogPosts = [legitimateWorkFromHomeUnionJobs]

export function getBlogPost(slug: string) {
	return blogPosts.find(post => post.slug === slug)
}

export function getFeaturedBlogPosts() {
	return blogPosts.filter(post => post.featured)
}

export function getRelatedBlogPosts(slug: string) {
	return blogPosts.filter(post => post.slug !== slug).slice(0, 3)
}
