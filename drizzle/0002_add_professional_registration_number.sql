ALTER TABLE "professionals"
ADD COLUMN IF NOT EXISTS "registration_number" text DEFAULT '';

UPDATE "professionals"
SET "registration_number" = COALESCE("registration_number", '')
WHERE "registration_number" IS NULL;

ALTER TABLE "professionals"
ALTER COLUMN "registration_number" DROP DEFAULT;

ALTER TABLE "professionals"
ALTER COLUMN "registration_number" SET NOT NULL;
