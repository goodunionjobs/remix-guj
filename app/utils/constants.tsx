import { type Organization, WebSite, type WithContext } from 'schema-dts'

export const organizationSchema: WithContext<Organization> = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	name: 'Good Union Jobs',
	naics: '5613',
	url: 'https://goodunionjobs.com',
	logo: 'https://goodunionjobs.com/favicons/512x512.png',
	email: 'support@goodunionjobs.com',
	founder: 'Ivan Vukusic',
}

export const webSiteSchema: WithContext<WebSite> = {
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	name: 'Good Union Jobs',
	url: 'https://goodunionjobs.com/',
	potentialAction: {
		'@type': 'SearchAction',
		target: {
			'@type': 'EntryPoint',
			urlTemplate:
				'https://goodunionjobs.com/?q={search_term_string}&state={state}&jobtype={jobtype}&page={page}',
		},
		//@ts-ignore query-input is used
		//https://schema.org/docs/actions.html
		'query-input': 'required name=search_term_string',
	},
}

export const description =
	'GoodUnionJobs.com is your go-to platform for browsing union job postings across all industries nationwide. Stay updated with daily email alerts on the latest opportunities, ensuring you never miss a chance to find your next union job.'
