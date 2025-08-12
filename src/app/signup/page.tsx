import SignUpPage from './client'
import AuthGuard from '@/helpers/authGuard'

const page : React.FC = () => {
  return (
    <AuthGuard requireAuth={false} redirectTo="/">
        <SignUpPage/>
    </AuthGuard>
  )
}

export default page