import SignUpPage from './client'
import AuthGuard from '@/helpers/authGuard'

const page = () => {
  return (
    <AuthGuard requireAuth={false} redirectTo="/">
        <SignUpPage/>
    </AuthGuard>
  )
}

export default page