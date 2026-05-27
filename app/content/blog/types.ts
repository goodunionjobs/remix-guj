export type BlogSection = {
	id: string
	title: string
	eyebrow?: string
	paragraphs: string[]
	bullets?: string[]
}

export type BlogComparisonRow = {
	role: string
	unionPath: string
	remoteFit: string
	whatToCheck: string
}

export type BlogPost = {
	slug: string
	title: string
	description: string
	category: string
	author: string
	authorTitle: string
	date: string
	displayDate: string
	readMinutes: number
	featured: boolean
	heroAlt: string
	tags: string[]
	sections: BlogSection[]
	comparisonTitle: string
	comparisonRows: BlogComparisonRow[]
	closingTitle: string
	closingParagraphs: string[]
}
