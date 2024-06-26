import type { Hit as InstantSearchHit, BaseHit } from 'instantsearch.js'
import { type InstantSearchServerState } from 'react-instantsearch'
import type {
	City,
	Country,
	EmployerImage,
	Search,
	SearchPayload,
} from '@prisma/client'

interface Job {
	position: string
	image: string
	employmentType: string
	salary: string
	benefits: string[]
	url: string
	description: string
	company: string
	city: string
	state: string
	country: string
	color: string
}

interface SessionImage {
	type: string
	data: number[]
}

type Subscribed = 'true' | 'false'
type State = 'success' | 'idle' | 'error'

type Footerprops = {
	formDismissed: boolean
	state: State
}

type JobCardItems = {
	objectID: string
	url: string
	job: string
	datestamp: number
	description: string
	color: number | undefined
	city: string
	state: string
	salary: string
	employment: string
	employmentType: string
	employer: string
	image: string[]
}

interface JobCardItemsPostForm
	extends Omit<
		JobCardItems,
		'objectID' | 'url' | 'datestamp' | 'description' | 'image'
	> {
	image: File | Blob
	description: string | undefined
}

type MainLoaderData = {
	TERM: string | null
	SUBSCRIBED: boolean
	serverUrl: string
	serverState?: InstantSearchServerState
}

type CategoriesLoaderData = {
	TERM: string | null
	SUBSCRIBED: boolean
	serverUrl: string
	serverState?: InstantSearchServerState
	categoryName: string
}

type formDismissed = { formDismissed?: boolean }
type SearchProps = Pick<MainLoaderData, 'serverUrl' | 'serverState'> &
	formDismissed

interface TitleMeta {
	title: string
}

interface Meta {
	name: string
	content: string
}

type OGProps =
	| 'title'
	| 'type'
	| 'image'
	| 'image:alt'
	| 'image:type'
	| 'url'
	| 'description'
interface OGMeta<T extends OGProps> {
	property: `og:${T}`
	content: string
}

// ! Not usually needed if opengraph is available
// type TwitterProps = 'title' | 'image' | 'image:alt' | 'url' | 'description';
// interface TwitterMeta<T extends TwitterProps> {
//   property: `twitter:${T}`;
//   content: string;
// }

type Company = {
	id: number
	EmployerImage: EmployerImage
	description: string
	Address: {
		street: string | null
		City: City
		State: State
		Country: Country
	}
}

export type CompanyLoaderData = {
	companyName: string
	company: Company
	jobs: Company[]
	links: string[]
}

type DefaultMetaProps = [
	TitleMeta,
	Meta,
	OGMeta<'title'>,
	OGMeta<'url'>,
	OGMeta<'description'>,
	OGMeta<'image'>,
	OGMeta<'image:alt'>,
	OGMeta<'image:type'>,
]

type AlgoliaHit<T extends Record<string, any>> = T & {
	// Add any additional fields that are common to all AlgoliaHits, if any
	// For example:
	// commonField: string;
}

export type HitProps = {
	hit: InstantSearchHit<
		AlgoliaHit<{
			objectID: string
			url: string
			job: string
			datestamp: number
			description: string
			color: number | undefined
			city: string
			state: string
			salary: string
			employment: string
			employmentType: string
			employer: string
			image: string[]
		}>
	>
}

type PrismaHitProps = {
	hit: Search & {
		employer: string
		image: string[]
		// Add additional fields specific to Prisma data
		// ...
	}
}

export type {
	Job,
	SessionImage,
	Subscribed,
	State,
	Footerprops,
	JobCardItems,
	JobCardItemsPostForm,
	SearchProps,
	MainLoaderData,
	CategoriesLoaderData,
	DefaultMetaProps,
	HitProps,
	PrismaHitProps,
}
