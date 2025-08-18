
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-8">
        <Logo />
        <LoginForm />
      </div>
    </main>
  );
}
