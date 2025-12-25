import { LoginForm } from '@/components/auth/login-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | AI Commerce Lead Generator',
  description: 'Sign in to your AI Commerce Lead Generator account',
}

export default function LoginPage() {
  return <LoginForm />
}
