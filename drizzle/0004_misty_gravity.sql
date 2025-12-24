ALTER TABLE "sessions" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "patient_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "professional_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "notes" SET DATA TYPE varchar(20000);--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_pk" PRIMARY KEY("id");
