-- Add as nullable first so existing enrollments can be populated from their student records.
ALTER TABLE "CourseEnrollment" ADD COLUMN "name" TEXT;

UPDATE "CourseEnrollment" AS enrollment
SET "name" = student."name"
FROM "User" AS student
WHERE enrollment."studentId" = student."id";

ALTER TABLE "CourseEnrollment" ALTER COLUMN "name" SET NOT NULL;
