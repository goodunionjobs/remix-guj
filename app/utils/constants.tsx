import { type Organization, type WithContext } from 'schema-dts'

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

export const description =
	'GoodUnionJobs.com is your go-to platform for browsing union job postings across all industries nationwide. Stay updated with daily email alerts on the latest opportunities, ensuring you never miss a chance to find your next union job.'
