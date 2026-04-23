import crypto from 'node:crypto'
import type { CertGrade, Prisma } from '@/generated/prisma/client'

const CERTIFICATE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCertificateSegment(length: number): string {
  const bytes = crypto.randomBytes(length)

  return Array.from(bytes, (value) => CERTIFICATE_ALPHABET[value % CERTIFICATE_ALPHABET.length]).join('')
}

function createCandidateCertificateId(): string {
  return `CERT-${randomCertificateSegment(4)}-${randomCertificateSegment(4)}`
}

export async function generateUniqueCertificateId(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const certificateId = createCandidateCertificateId()
    const existing = await tx.certificate.findUnique({
      where: { certificateId },
      select: { id: true },
    })

    if (!existing) {
      return certificateId
    }
  }

  throw new Error('Failed to generate a unique certificate ID')
}

export function getCertificateGrade(finalGrade: number): CertGrade {
  if (finalGrade >= 4.5) return 'Distinction'
  if (finalGrade >= 3.0) return 'First_Class'
  return 'Pass'
}

export function formatCertificateGradeLabel(grade: CertGrade): string {
  if (grade === 'First_Class') return 'First Class'
  return grade
}

type SnapshotDbClient = Pick<Prisma.TransactionClient, '$queryRaw' | '$executeRaw'>

type CertificateDbClient = SnapshotDbClient

export type CertificateApprovalSnapshotInput = {
  fullName: string
  dob: string | null
  collegeName: string
  branch: string
  graduationYear: number
  collegeIdLink: string
}

export type CertificateApprovalSnapshot = {
  fullName: string | null
  dob: string | null
  collegeName: string
  branch: string | null
  graduationYear: number | null
  collegeIdLink: string | null
}

let certificateColumnCache: Set<string> | null = null

async function getCertificateColumns(db: CertificateDbClient): Promise<Set<string>> {
  if (certificateColumnCache !== null) {
    return certificateColumnCache
  }

  const columns = await db.$queryRaw<Array<{ column_name: string }>>`
    SELECT "column_name"
    FROM "information_schema"."columns"
    WHERE "table_schema" = 'public'
      AND "table_name" = 'certificates'
  `

  certificateColumnCache = new Set(columns.map((column) => column.column_name))
  return certificateColumnCache
}

async function hasCertificateColumns(
  db: CertificateDbClient,
  columns: string[],
): Promise<boolean> {
  const availableColumns = await getCertificateColumns(db)
  return columns.every((column) => availableColumns.has(column))
}

export async function writeCertificateApprovalSnapshot(
  db: CertificateDbClient,
  certificateId: string,
  snapshot: CertificateApprovalSnapshotInput,
): Promise<boolean> {
  if (!await hasCertificateColumns(db, ['full_name', 'dob', 'branch', 'graduation_year', 'college_id_link'])) {
    return false
  }

  await db.$executeRaw`
    UPDATE "certificates"
    SET
      "full_name" = ${snapshot.fullName},
      "dob" = ${snapshot.dob ? new Date(snapshot.dob) : null},
      "branch" = ${snapshot.branch},
      "graduation_year" = ${snapshot.graduationYear},
      "college_id_link" = ${snapshot.collegeIdLink}
    WHERE "id" = ${certificateId}
  `

  return true
}

export async function readCertificateApprovalSnapshot(
  db: CertificateDbClient,
  certificateId: string,
  fallback: Pick<CertificateApprovalSnapshot, 'collegeName'>,
): Promise<CertificateApprovalSnapshot> {
  if (!await hasCertificateColumns(db, ['full_name', 'dob', 'branch', 'graduation_year', 'college_id_link'])) {
    return {
      fullName: null,
      dob: null,
      collegeName: fallback.collegeName,
      branch: null,
      graduationYear: null,
      collegeIdLink: null,
    }
  }

  const rows = await db.$queryRaw<Array<{
    full_name: string | null
    dob: Date | null
    branch: string | null
    graduation_year: number | null
    college_id_link: string | null
  }>>`
    SELECT "full_name", "dob", "branch", "graduation_year", "college_id_link"
    FROM "certificates"
    WHERE "id" = ${certificateId}
    LIMIT 1
  `

  return {
    fullName: rows[0]?.full_name ?? null,
    dob: rows[0]?.dob?.toISOString() ?? null,
    collegeName: fallback.collegeName,
    branch: rows[0]?.branch ?? null,
    graduationYear: rows[0]?.graduation_year ?? null,
    collegeIdLink: rows[0]?.college_id_link ?? null,
  }
}

export async function writeCertificatePdfUrl(
  db: CertificateDbClient,
  certificateId: string,
  certificatePdfUrl: string,
): Promise<boolean> {
  if (!await hasCertificateColumns(db, ['certificate_pdf_url'])) {
    return false
  }

  await db.$executeRaw`
    UPDATE "certificates"
    SET "certificate_pdf_url" = ${certificatePdfUrl}
    WHERE "id" = ${certificateId}
  `

  return true
}

export async function readCertificatePdfUrl(
  db: CertificateDbClient,
  certificateId: string,
): Promise<string | null> {
  if (!await hasCertificateColumns(db, ['certificate_pdf_url'])) {
    return null
  }

  const rows = await db.$queryRaw<Array<{ certificate_pdf_url: string | null }>>`
    SELECT "certificate_pdf_url"
    FROM "certificates"
    WHERE "id" = ${certificateId}
    LIMIT 1
  `

  return rows[0]?.certificate_pdf_url ?? null
}
