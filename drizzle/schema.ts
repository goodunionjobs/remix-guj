import { createId } from '@paralleldrive/cuid2'
import { relations, sql } from 'drizzle-orm'
import {
	pgTable,
	pgEnum,
	serial,
	smallint,
	varchar,
	integer,
	text,
	boolean,
	timestamp,
	uniqueIndex,
	index,
	primaryKey,
} from 'drizzle-orm/pg-core'

export const cities = pgTable('cities', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 50 }).notNull().unique(),
})

export const states = pgTable('states', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 50 }).notNull().unique(),
})

export const countries = pgTable('countries', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 25 }).notNull().unique(),
})

export const addresses = pgTable(
	'addresses',
	{
		id: serial('id').primaryKey(),
		street: varchar('street', { length: 50 }),
		cityId: integer('city_id').notNull(),
		stateId: integer('state_id').notNull(),
		countryId: integer('country_id').notNull(),
	},
	address => ({
		cityStateCountryUniqueIndex: uniqueIndex(
			'address_city_state_country_unique_index',
		).on(address.cityId, address.stateId, address.countryId),
		countryIdIndex: index('country_id_index').on(address.countryId),
		stateIdIndex: index('state_id_index').on(address.stateId),
	}),
)

export const addressesRelations = relations(addresses, ({ one }) => ({
	city: one(cities, {
		fields: [addresses.cityId],
		references: [cities.id],
	}),
	state: one(states, {
		fields: [addresses.stateId],
		references: [states.id],
	}),
	country: one(countries, {
		fields: [addresses.countryId],
		references: [countries.id],
	}),
}))

export const guilds = pgTable('guilds', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 100 }).notNull().unique(),
	searchType: text('search_type').notNull(),
	dateScraped: timestamp('date_scraped', { mode: 'date' }).notNull(),
})

export const employers = pgTable(
	'employer',
	{
		id: serial('id').primaryKey(),
		publicId: varchar('public_id', { length: 12 }),
		name: varchar('name', { length: 500 }).notNull(),
		guildId: integer('guild_id').notNull(),
		originalLink: text('originalLink'),
		s3Link: text('s3_link').notNull(),
	},
	employer => ({
		employersUniqueIndex: uniqueIndex('employers_unique_index').on(
			employer.name,
			employer.guildId,
		),
		guildIdIndex: index('guild_id_index').on(employer.guildId),
	}),
)

export const payTypeEnum = pgEnum('pay_type', ['hr', 'yr', 'mo'])
// How linkedin Job posts can show up
// $21.00/hr - $26.00/hr
// $90,000.00/yr - $120,000.00/yr

export const employmentTypeEnum = pgEnum('employment_type', [
	// TODO: Add in below possibly... look if they are used
	// internship, apprecenticheship, freelance
	'Full-time',
	'Part-time',
	'Contract',
	'Temporary',
	'Volunteer',
	'Other',
])

export const postLengthTypeEnum = pgEnum('postLengthType', ['week', 'month'])

export const seniorities = pgTable('seniorities', {
	id: serial('id').primaryKey(),
	name: text('name').unique(),
})

export const jobs = pgTable(
	'jobs',
	{
		id: serial('id').primaryKey(),
		publicId: varchar('public_id', { length: 20 }).unique(),
		title: text('title').notNull(),
		url: text('url').notNull().unique(),
		descripUrl: text('descrip_url').notNull(),
		//TODO: When check constraint comes to drizzle need to make it so
		// one value cannot be null and the other have a number
		minSalary: integer('min_salary'),
		maxSalary: integer('max_salary'),
		// TODO: Create 1-many table
		employmentType: employmentTypeEnum('employment_type').notNull(),
		color: integer('color'),
		payType: payTypeEnum('pay_type'),
		seniorityId: smallint('seniority_id'),
		employerId: integer('employer_id').notNull(),
		addressId: integer('address_id').notNull(),
		dateStamp: timestamp('date_stamp').notNull(),
		timeStamp: timestamp('time_stamp').defaultNow().notNull(),
		// TODO: Think about how you would remove a post from being paid for once it is updated?
		// Maybe timestamp is updated and if postLengthType is week then week from timestamp you remove?
		// But, you may allow people to change job postings so another paidTimestampo should be used
		postLength: postLengthTypeEnum('post_length'),
		postPaid: boolean('post_paid').default(false),
	},
	job => ({
		seniorityIdIndex: index('job_seniority_id_index').on(job.employerId),
		employerIdIndex: index('job_employer_id_index').on(job.employerId),
		addressIdIndex: index('job_address_id_index').on(job.addressId),
		timeStampIndex: index('job_time_stamp_index').on(job.timeStamp),
	}),
)

export const jobsRelations = relations(jobs, ({ one, many }) => ({
	jobFunctions: many(jobsToJobFunctions),
	industries: many(jobsToIndustries),
	address: one(addresses, {
		fields: [jobs.addressId],
		references: [addresses.id],
	}),
	employer: one(employers, {
		fields: [jobs.employerId],
		references: [employers.id],
	}),
}))

export const jobFunctions = pgTable('job_functions', {
	codeId: text('code_id').primaryKey(),
	description: text('description').notNull().unique(),
})

export const jobFunctionsRelations = relations(jobFunctions, ({ many }) => ({
	jobJobs: many(jobsToJobFunctions),
}))

export const jobsToJobFunctions = pgTable(
	'jobs_to_job_functions',
	{
		jobId: integer('job_id')
			.notNull()
			.references(() => jobs.id),
		jobFunctionId: text('job_function_id')
			.notNull()
			.references(() => jobFunctions.codeId),
	},
	t => ({
		pk: primaryKey({ columns: [t.jobId, t.jobFunctionId] }),
	}),
)

export const jobsToJobFunctionsRelations = relations(
	jobsToJobFunctions,
	({ one }) => ({
		job: one(jobs, {
			fields: [jobsToJobFunctions.jobId],
			references: [jobs.id],
		}),
		jobFunction: one(jobFunctions, {
			fields: [jobsToJobFunctions.jobFunctionId],
			references: [jobFunctions.codeId],
		}),
	}),
)

export const emailFrequencyEnum = pgEnum('email_frequency', ['daily', 'weekly'])

export const users = pgTable('users', {
	id: text('id')
		.$defaultFn(() => createId())
		.primaryKey()
		.notNull(),
	kindeUserId: text('kinde_user_id').unique(),
	email: text('email').unique(),
	firstName: text('first_name'),
	lastName: text('last_name'),
	emailFrequency: emailFrequencyEnum('email_frequency')
		.notNull()
		.default('daily'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	//TODO: Fix, causes errors
	updatedAt: timestamp('updated_at')
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
})

export const usersRelations = relations(users, ({ many }) => ({
	usersCategories: many(usersToCategories),
	sessions: many(sessions),
}))

export const sessions = pgTable('sessions', {
	id: text('id')
		.$defaultFn(() => createId())
		.primaryKey()
		.notNull(),
	expirationDate: timestamp('expiration_date').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}))

export const categories = pgTable('categories', {
	name: text('name').primaryKey(),
})

export const categoriesRelations = relations(categories, ({ many }) => ({
	industries: many(industries),
	usersCategories: many(usersToCategories),
}))

export const guildsRelations = relations(guilds, ({ many }) => ({
	employers: many(employers),
}))

export const employersRelations = relations(employers, ({ one, many }) => ({
	jobs: many(jobs),
	guild: one(guilds, {
		fields: [employers.guildId],
		references: [guilds.id],
	}),
}))

export const usersToCategories = pgTable(
	'users_to_categories',
	{
		userId: text('user_id')
			.$defaultFn(() => createId())
			.notNull()
			.references(() => users.id),
		categoryName: text('category_name')
			.notNull()
			.references(() => categories.name),
	},
	t => ({
		pk: primaryKey({ columns: [t.userId, t.categoryName] }),
	}),
)

export const usersToCategoriesRelations = relations(
	usersToCategories,
	({ one }) => ({
		user: one(users, {
			fields: [usersToCategories.userId],
			references: [users.id],
		}),
		category: one(categories, {
			fields: [usersToCategories.categoryName],
			references: [categories.name],
		}),
	}),
)

export const industries = pgTable('industries', {
	industryId: smallint('industry_id').primaryKey(),
	node: text('node'),
	label: text('label').notNull().unique(),
	description: text('description').notNull().unique(),
	categoryName: text('category_name').references(() => categories.name),
})

export const industriesRelations = relations(industries, ({ one, many }) => ({
	jobsIndustries: many(jobsToIndustries),
	category: one(categories, {
		fields: [industries.categoryName],
		references: [categories.name],
	}),
}))

export const jobsToIndustries = pgTable(
	'jobs_to_industries',
	{
		jobId: integer('job_id')
			.notNull()
			.references(() => jobs.id),
		industryId: integer('industry_id')
			.notNull()
			.references(() => industries.industryId),
	},
	t => ({
		pk: primaryKey({ columns: [t.jobId, t.industryId] }),
	}),
)

export const jobsToIndustriesRelations = relations(
	jobsToIndustries,
	({ one }) => ({
		job: one(jobs, {
			fields: [jobsToIndustries.jobId],
			references: [jobs.id],
		}),
		industry: one(industries, {
			fields: [jobsToIndustries.industryId],
			references: [industries.industryId],
		}),
	}),
)

// TODO: Start inserting benefits
//
// export const benefit = pgTable("Benefit", {
//   id: serial("id").primaryKey(),
//   // name: varchar("name", { length: 100 }).notNull().unique(),
// });
//
// export const searchesOnBenefits = pgTable(
//   "SearchesOnBenefits",
//   {
//     id: serial("id").primaryKey(),
//     searchId: integer("searchId").notNull(),
//     benefitId: integer("benefitId").notNull(),
//   },
//   (searchesOnBenefits) => ({
//     searchBenefitUnique: uniqueIndex(
//       "searches_on_benefits_search_benefit_unique",
//     ).on(searchesOnBenefits.searchId, searchesOnBenefits.benefitId),
//     benefitIdIndex: index("searches_on_benefits_benefit_id_index").on(
//       searchesOnBenefits.benefitId,
//     ),
//     searchIdIndex: index("searches_on_benefits_search_id_index").on(
//       searchesOnBenefits.searchId,
//     ),
//   }),
// );
//
