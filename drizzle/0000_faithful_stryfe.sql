-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
DO $$ BEGIN
 CREATE TYPE "public"."employment_type" AS ENUM('Full-time', 'Part-time', 'Contract', 'Temporary', 'Volunteer', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payType" AS ENUM('hr', 'yr');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."pay_type" AS ENUM('hr', 'yr');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."postLengthType" AS ENUM('week', 'month');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seniorities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	CONSTRAINT "seniorities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "states_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"street" varchar(50),
	"city_id" integer NOT NULL,
	"state_id" integer NOT NULL,
	"country_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "cities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(25) NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employer" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12),
	"name" varchar(500) NOT NULL,
	"guild_id" integer NOT NULL,
	"originalLink" text,
	"s3_link" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guilds" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"search_type" text NOT NULL,
	"date_scraped" timestamp NOT NULL,
	CONSTRAINT "guilds_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"name" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "industries" (
	"industry_id" smallint PRIMARY KEY NOT NULL,
	"node" text,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"category_name" text,
	CONSTRAINT "industries_label_unique" UNIQUE("label"),
	CONSTRAINT "industries_description_unique" UNIQUE("description")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(20),
	"title" text NOT NULL,
	"url" text NOT NULL,
	"descrip_url" text NOT NULL,
	"min_salary" integer,
	"max_salary" integer,
	"employment_type" "employment_type" NOT NULL,
	"color" integer,
	"pay_type" "pay_type",
	"seniority_id" smallint,
	"employer_id" integer NOT NULL,
	"address_id" integer NOT NULL,
	"date_stamp" timestamp NOT NULL,
	"time_stamp" timestamp DEFAULT now() NOT NULL,
	"post_length" "postLengthType",
	"post_paid" boolean DEFAULT false,
	CONSTRAINT "jobs_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "jobs_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_functions" (
	"code_id" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "job_functions_description_unique" UNIQUE("description")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"kinde_user_id" text,
	"email" text,
	"first_name" text,
	"last_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_kinde_user_id_unique" UNIQUE("kinde_user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expiration_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs_to_industries" (
	"job_id" integer NOT NULL,
	"industry_id" integer NOT NULL,
	CONSTRAINT "jobs_to_industries_job_id_industry_id_pk" PRIMARY KEY("job_id","industry_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs_to_job_functions" (
	"job_id" integer NOT NULL,
	"job_function_id" text NOT NULL,
	CONSTRAINT "jobs_to_job_functions_job_id_job_function_id_pk" PRIMARY KEY("job_id","job_function_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_to_categories" (
	"user_id" text NOT NULL,
	"category_name" text NOT NULL,
	CONSTRAINT "users_to_categories_user_id_category_name_pk" PRIMARY KEY("user_id","category_name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "industries" ADD CONSTRAINT "industries_category_name_categories_name_fk" FOREIGN KEY ("category_name") REFERENCES "public"."categories"("name") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs_to_industries" ADD CONSTRAINT "jobs_to_industries_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs_to_industries" ADD CONSTRAINT "jobs_to_industries_industry_id_industries_industry_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("industry_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs_to_job_functions" ADD CONSTRAINT "jobs_to_job_functions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs_to_job_functions" ADD CONSTRAINT "jobs_to_job_functions_job_function_id_job_functions_code_id_fk" FOREIGN KEY ("job_function_id") REFERENCES "public"."job_functions"("code_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_categories" ADD CONSTRAINT "users_to_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_categories" ADD CONSTRAINT "users_to_categories_category_name_categories_name_fk" FOREIGN KEY ("category_name") REFERENCES "public"."categories"("name") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "address_city_state_country_unique_index" ON "addresses" USING btree ("city_id" int4_ops,"state_id" int4_ops,"country_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "country_id_index" ON "addresses" USING btree ("country_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "state_id_index" ON "addresses" USING btree ("state_id" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "employers_unique_index" ON "employer" USING btree ("name" int4_ops,"guild_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guild_id_index" ON "employer" USING btree ("guild_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_address_id_index" ON "jobs" USING btree ("address_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_employer_id_index" ON "jobs" USING btree ("employer_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_seniority_id_index" ON "jobs" USING btree ("employer_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_time_stamp_index" ON "jobs" USING btree ("time_stamp" timestamp_ops);
*/