import SignInPage from './client'
import AuthGuard from '@/helpers/authGuard'

const page = () => {
  return (
    <AuthGuard requireAuth={false} redirectTo="/">
        <SignInPage/>
    </AuthGuard>
  )
}

export default page
