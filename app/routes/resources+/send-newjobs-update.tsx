// // app/routes/resources+/send-newjobs-update.tsx
// // TODO: SET THIS TO WORK
// import { Resend } from 'resend'
// import { drizzle } from 'drizzle-orm/node-postgres'
// import { Pool } from 'pg'
// import {
// 	users,
// 	usersToCategories,
// 	categories,
// 	jobs,
// 	industries,
// 	jobsToIndustries,
// } from './schema'
// import { eq, inArray, and, gte } from 'drizzle-orm'
//
// // Initialize database connection
// const pool = new Pool({
// 	connectionString: process.env.DATABASE_URL,
// })
// const db = drizzle(pool)
//
// // Initialize Resend
// const resend = new Resend(process.env.RESEND_API_KEY)
//
// interface UserWithCategories {
// 	id: string
// 	email: string
// 	firstName: string
// 	lastName: string
// 	categories: string[]
// }
//
// interface JobInfo {
// 	id: number
// 	title: string
// 	url: string
// 	employerName: string
// }
//
// interface CategoryJobs {
// 	[category: string]: JobInfo[]
// }
//
// async function getUsersWithCategories(): Promise<UserWithCategories[]> {
// 	// ... (same as before)
// }
//
// function groupUsersByCategories(
// 	users: UserWithCategories[],
// ): Map<string, UserWithCategories[]> {
// 	// ... (same as before)
// }
//
// async function getJobsForCategories(
// 	categories: string[],
// ): Promise<CategoryJobs> {
// 	const today = new Date()
// 	today.setHours(0, 0, 0, 0)
//
// 	const jobsData = await db
// 		.select({
// 			jobId: jobs.id,
// 			jobTitle: jobs.title,
// 			jobUrl: jobs.url,
// 			employerName: employers.name,
// 			categoryName: categories.name,
// 		})
// 		.from(jobs)
// 		.innerJoin(jobsToIndustries, eq(jobs.id, jobsToIndustries.jobId))
// 		.innerJoin(
// 			industries,
// 			eq(jobsToIndustries.industryId, industries.industryId),
// 		)
// 		.innerJoin(categories, eq(industries.categoryName, categories.name))
// 		.innerJoin(employers, eq(jobs.employerId, employers.id))
// 		.where(
// 			and(inArray(categories.name, categories), gte(jobs.dateStamp, today)),
// 		)
//
// 	const categoryJobs: CategoryJobs = {}
//
// 	jobsData.forEach(job => {
// 		if (!categoryJobs[job.categoryName]) {
// 			categoryJobs[job.categoryName] = []
// 		}
// 		categoryJobs[job.categoryName].push({
// 			id: job.jobId,
// 			title: job.jobTitle,
// 			url: job.jobUrl,
// 			employerName: job.employerName,
// 		})
// 	})
//
// 	return categoryJobs
// }
//
// function generateEmailContent(
// 	categories: string[],
// 	categoryJobs: CategoryJobs,
// ): string | null {
// 	let hasContent = false
// 	let emailContent = `
//     <h1>New Job Listings in Your Subscribed Categories</h1>
//   `
//
// 	for (const category of categories) {
// 		const jobs = categoryJobs[category] || []
// 		if (jobs.length > 0) {
// 			hasContent = true
// 			emailContent += `
//         <h2>${category}</h2>
//         <ul>
//       `
//
// 			const displayJobs = jobs.slice(0, 5)
// 			displayJobs.forEach(job => {
// 				emailContent += `
//           <li>
//             <a href="${job.url}">${job.title}</a> at ${job.employerName}
//           </li>
//         `
// 			})
//
// 			emailContent += `</ul>`
//
// 			if (jobs.length > 5) {
// 				const remainingJobs = jobs.length - 5
// 				emailContent += `
//           <p><a href="YOUR_WEBSITE_URL/jobs?category=${encodeURIComponent(category)}">
//             Click here for ${remainingJobs} more job${remainingJobs > 1 ? 's' : ''}
//           </a></p>
//         `
// 			}
// 		}
// 	}
//
// 	return hasContent ? emailContent : null
// }
//
// async function sendBatchEmails(groups: Map<string, UserWithCategories[]>) {
// 	for (const [categories, users] of groups) {
// 		const categoryList = categories.split(',')
// 		const categoryJobs = await getJobsForCategories(categoryList)
// 		const emailContent = generateEmailContent(categoryList, categoryJobs)
//
// 		if (emailContent) {
// 			const batch = users.map(user => ({
// 				from: 'Your Company <noreply@yourcompany.com>',
// 				to: user.email,
// 				subject: 'New Job Listings in Your Subscribed Categories',
// 				html: emailContent,
// 			}))
//
// 			try {
// 				await resend.batch.send(batch)
// 				console.log(
// 					`Sent emails to ${users.length} users subscribed to ${categories}`,
// 				)
// 			} catch (error) {
// 				console.error(
// 					`Error sending emails for categories ${categories}:`,
// 					error,
// 				)
// 			}
// 		} else {
// 			console.log(
// 				`No new jobs for users subscribed to ${categories}. Skipping email.`,
// 			)
// 		}
// 	}
// }
//
// async function main() {
// 	try {
// 		const users = await getUsersWithCategories()
// 		const groups = groupUsersByCategories(users)
// 		await sendBatchEmails(groups)
// 	} catch (error) {
// 		console.error('Error in main function:', error)
// 	} finally {
// 		await pool.end()
// 	}
// }
//
// main()
