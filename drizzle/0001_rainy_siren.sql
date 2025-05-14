DO $$ BEGIN
 CREATE TYPE "public"."email_frequency" AS ENUM('daily', 'weekly');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "pay_type" ADD VALUE 'mo';--> statement-breakpoint
DROP INDEX IF EXISTS "address_city_state_country_unique_index";--> statement-breakpoint
DROP INDEX IF EXISTS "country_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "state_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "employers_unique_index";--> statement-breakpoint
DROP INDEX IF EXISTS "guild_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "job_address_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "job_employer_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "job_seniority_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "job_time_stamp_index";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "updated_at" SET DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_frequency" "email_frequency" DEFAULT 'daily' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "address_city_state_country_unique_index" ON "addresses" USING btree ("city_id","state_id","country_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "country_id_index" ON "addresses" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "state_id_index" ON "addresses" USING btree ("state_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "employers_unique_index" ON "employer" USING btree ("name","guild_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guild_id_index" ON "employer" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_address_id_index" ON "jobs" USING btree ("address_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_employer_id_index" ON "jobs" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_seniority_id_index" ON "jobs" USING btree ("seniority_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_time_stamp_index" ON "jobs" USING btree ("time_stamp");