-- Add the website_url column and remove the logo column
ALTER TABLE "clients" ADD COLUMN "website_url" text;
ALTER TABLE "clients" DROP COLUMN IF EXISTS "logo";

-- Update the status default to "discovery" instead of "active"
ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'discovery';