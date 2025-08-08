import PageContent from '@/components/PageContent'
import AuthGuard from '@/helpers/authGuard'

export default function Page() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/signin">
      <PageContent />
    </AuthGuard>
  )
}
