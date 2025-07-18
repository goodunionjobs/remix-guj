- Texts sent to Jack
- change search based on input to use less values
- S3 storage for table
- S3 storage also for description
- Need to add customain. Dev branch for testing out changes that would go into
  cloudflare? -- Why, well because if you are seeding s3 values that will
  connect to this you need to see if these images show up... -- Also, along with
  that need another Algolia dev account since only way to create another indix
  is through admin. No bueno for security
- Go back and make sure to use new security keys when production is ready for
  the mainstream -- https://resend.com/blog/introducing-the-batch-emails-api use
  this for batch email sending

# To-Do

- Company query. It will aggregate all employers which is available in Algolia
- Should still make company page that displays image and all jobs found related
  to Algolia
- Should try to take information from company page on LinkedIn
- When doing goodunionjobs.com/company/name if the db finds more than one name
  than it brings out a list of companies to go to. From there use unique slugs
  like “microsoft-1” going forward?
- Company listings should have how many jobs they have in the last month that
  have been posted up like the one on remotive.com has “Actively hiring”
- Make a vacation on companies$ postings that works with hits so prisma data can
  look like Algolias
- Do the rss and sitemap of website
- Check if headers are different in V2
- Remove google index now api since it just don’t plain work
- Todo Change colors of prose
- Make env for website domain and localhost maybe. Or not ENV but CONST
- Think about removing jobs.tsx in jobs+. Because root.tsx already has nav?
- Make line around back to search button less bi
- Do post a job in white
- Think about removing orange from remix apply button
- GO THROUGH CHATGPT. ANYTHING WITH GUJ means to look at it
- Share this job pop out more
- learn to code

* Check CopyRight and change where needed in website

IN WEBSITE

# To-do

- !!!! Search for any TODO in project
- web.manifest change background color maybe?
- robots.txt change
- Icons squish more so appear large
- Theme color later
- me.tsx work again
- Check for any imports that are red or missing
- Fix where assets for root meta are loaded in from and test them! Use
  getSocialsMeta from Kent C. Dodds main website
- Todo fix logo.png width and height to be dynamic
- Later on when wanting to use some logos of companies we trust go to epic web
  dev stack. Marketing+ logos to see how he maps them into one box
- User border box where stars are to put in the search bar and all the search is
  below it
- Find way to animate hand to move. Find code from here to do it for his logo
  https://stripe-stack-dev.fly.dev/

Agenda:

- Minor:
  - Scraper low memory
- Big:
  - Company directory
  - SEO purposes company pages name for like construction and such
- NEED TO DO NOW:
  - Marketing once everything done
  - SES emails
  - Get the pay to post up
  - Accounts
  - Salary range slider

# GoodUnionJobs to-do

TO DO NOW AS SETTING UP STAGING AND PROD

- Make fly-log-shipper GitHub repo so you can create fly.toml with it

TO-DO LIST:

- Unsafe header ‘referrer’ from Algolia
- How to verify in JobChecker if elements are strings? Assert or through
  typeScript?
- Make benefits many to many. When getting benefits values order by alphabetical
  order in array…. Maybe in table only allow values to certain types. Like
  “Dental, Medical”. So we don’t have “Medical, Dental” as well?
- Add in industries in scraper const EMPLOYMENT =
  'ul.description\_\_job-criteria-list li:nth-child(2) span'; BUT DO AS 4th
  child
- Change logs in scraper so they have less info but more exact. Don’t need huge
  ass descriptions just that job came through
- For each job page maybe we need a coalesced keyword of keywords? Sometimes
  Teacher can have multiple keywords. For that reason another table that ties
  them together could work better so that I don’t have to manually add in all
  variations to the the filter index of Algoli.
- Check upserts of Prisma on Webscraper. Might be better to not go through if it
  already exists.
- Add wretch to fetch api for logger
  https://twitter.com/Steve8708/status/1611437686958739456?s=20
- Do staging for scraper project.
  - Add in exclusions
  - Fix up removing env from server once you leave
  - Maybe make ping that scraper is done doing shit. If program breaks then
    process.exit does some shit that sends ping before exiting
    https://nodejs.org/api/process.html#event-beforeexit
- Cron job to delete job data from 3 months ago possibly
- Do company pages that link to jobs
- Subscription form add honeypot field
- How should we do staging for stuff like S3 and Algolia? Maybe just connect to
  our primary stuff since we aren’t deleting?
- Idea for google. Only scrape and allow certain links. But, for every job grab
  the links and put it in the database somewhere that will be looked into for
  the future to see what links we should allow and shouldn’t.
- Cookies should have secrets from env
- Deepl for translating
  - https://www.smashingmagazine.com/2023/02/internationalization-i18n-right-remix-headless-cms-storyblok/
- CMS with
  https://www.smashingmagazine.com/2023/02/internationalization-i18n-right-remix-headless-cms-storyblok/
- I had to check if salary is null for $jobs route. Fix it up a little and make
  sure if NULL then stuff comes out alright
- Cjs to esm

Lambda Email System:

- Setup lambda that in is invoked somehow and goes through database to divy data
  to be handled by other lamba
- So, there will be a lambda function url that other lambda will have. Our first
  lambda will past different parameters to each one. This is how the data is
  divided up.
- Maybe idea is to see how many emails there are in the list. So then, with that
  number divided into the amount of concurrent lambda instances that are allowed
- Make sure to use subdomain not main domain
- Ok, so there will be a poller based on this
  https://aws.amazon.com/blogs/messaging-and-targeting/prevent-email-throttling-concurrency-limit/
  - Confirmation emails have priority. What we will do is if a rate limit is
    found in 1) The campaign emails then we pause the campaign for 30
    seconds. 2) The confirmation email keeps trying immediately if there is an
    error. More functions can be invoked and that is okay. They will keep
    trying. Some could keep getting rejected. That is fine you keep going.
  - The lambda campaign email will need to be limited to only one concurrent
    instance so that more aren’t made when it is invoked by the amazon
    scheduler. The scheduler just needs to be rejected if calls it while it is
    running.
  - Make sure to have response to each type of email success or error
    https://aws.amazon.com/blogs/aws/mailbox-simulator-for-the-amazon-simple-email-service/
- Code so that people who haven’t looked at emails for 6 months are changed into
  monthly email receivers. After 1 year and no opens then get rid of them and
  give them a warning.
- Have warning set up for bounce rate that goes to your phone
  https://docs.aws.amazon.com/ses/latest/dg/reputationdashboard-cloudwatch-alarm.html
- Review https://www.replyup.com/blog/amazon-ses-best-practices/
- Setup so on website when person is signing up the webpage lets them know they
  received or didn’t receive a confirmation email!
  - Either email does not exist or that there was a technical error… but I don’t
    think the latter will happen because if rate limiter fails it will keep
    trying.
- Since I will likely be switching scraper to 4am will have to include new jobs
  from yesterday as part of new jobs

Valuation Ok we need basis point to establish what each person should get
percentage. To some extent it shouldn’t be amount of time put in. This depends
on what will output. I could put 1 hour in but output $1000. You could do 10
hours but only make $500.

We can still debate what people will get in the end because of something useful
that someone contributed. That would be bonus. But, the basis of percentage
still needs to be done. I need to give those people I promised my money.

- Tell Jack to make up his work and what he will be doing
- Tell him about the AWS credit that can be included, but you will take a
  finders fee.
  - He won’t get all of the AWS only what we would actually use in those 3 years

Later To-Do OG Image generation

- Maybe make logo of company. Put something like union certified? Then from
  there have salary show up along with tags they include, title… whatever fits

Reddit post

Sup guys,

[Good Union Jobs.com](https://goodunionjobs.com)

We haven't seen a niche job board site that only lists Union affiliated jobs.
We're looking to change that and give people a a place where they can find new
union jobs listed daily.

Future things in the work:

- Email signup to get job posts to your site
- Verified Union listings. We scrape for our jobs so there will be some
  hit/misses here and there. But, with a verified tag you will be guaranteed
  100% the job listing was for a union job. Currently working on the payment
  form that will be up soon!
- Profiles for people looking to get hired for a union job.

Why I'm posting here:

- Want ya'll to **roast anything and everything** from the color scheme, design,
  implementation, etc. Looking to improve all aspects of the site! ​ P.S. I am
  the developer of the site. You can check the console log of the website and
  see "Hi Reddit/roastmystartup!" up there.
