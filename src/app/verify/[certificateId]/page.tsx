import { VerifyCertificateView } from '@/components/certificates/VerifyCertificateView'

export const dynamic = 'force-dynamic'

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>
}) {
  const { certificateId } = await params

  return <VerifyCertificateView initialCertificateId={certificateId} />
}
