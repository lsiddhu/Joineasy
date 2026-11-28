CREATE TYPE "SubmissionType" AS ENUM ('INDIVIDUAL', 'GROUP');

CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "professorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseEnrollment" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroupSubmission" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "startedById" INTEGER NOT NULL,
    "confirmedById" INTEGER,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    CONSTRAINT "GroupSubmission_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Assignment"
    ADD COLUMN "submissionType" "SubmissionType" NOT NULL DEFAULT 'INDIVIDUAL',
    ADD COLUMN "courseId" INTEGER;

CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
CREATE INDEX "Course_professorId_idx" ON "Course"("professorId");
CREATE UNIQUE INDEX "CourseEnrollment_courseId_studentId_key" ON "CourseEnrollment"("courseId", "studentId");
CREATE INDEX "CourseEnrollment_studentId_idx" ON "CourseEnrollment"("studentId");
CREATE UNIQUE INDEX "GroupSubmission_assignmentId_groupId_key" ON "GroupSubmission"("assignmentId", "groupId");
CREATE INDEX "GroupSubmission_groupId_idx" ON "GroupSubmission"("groupId");
CREATE INDEX "Assignment_courseId_idx" ON "Assignment"("courseId");
CREATE INDEX "Assignment_professorId_idx" ON "Assignment"("professorId");
CREATE INDEX "AssignmentGroup_groupId_idx" ON "AssignmentGroup"("groupId");
CREATE INDEX "SubmissionConfirmation_studentId_idx" ON "SubmissionConfirmation"("studentId");

ALTER TABLE "Course" ADD CONSTRAINT "Course_professorId_fkey"
    FOREIGN KEY ("professorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroupSubmission" ADD CONSTRAINT "GroupSubmission_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupSubmission" ADD CONSTRAINT "GroupSubmission_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupSubmission" ADD CONSTRAINT "GroupSubmission_startedById_fkey"
    FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GroupSubmission" ADD CONSTRAINT "GroupSubmission_confirmedById_fkey"
    FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
