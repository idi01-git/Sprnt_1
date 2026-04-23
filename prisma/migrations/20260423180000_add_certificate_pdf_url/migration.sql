ALTER TABLE "certificates"
ADD COLUMN IF NOT EXISTS "certificate_pdf_url" TEXT;
