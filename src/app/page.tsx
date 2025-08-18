
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, User } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40">
      <div className="flex flex-col items-center space-y-6 max-w-md w-full">
        <Logo />
        <LoginForm />
         <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>Start Your Reading Journey</CardTitle>
            <CardDescription>Contact our admin to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
             <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-primary" />
                <span className="font-medium text-muted-foreground">Darshan Singh Bareta (Admin)</span>
            </div>
             <div className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-primary" />
                <a href="tel:9478635500" className="text-muted-foreground hover:text-primary">9478635500</a>
            </div>
             <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-primary" />
                <a href="mailto:dsbbareta@gmail.com" className="text-muted-foreground hover:text-primary">dsbbareta@gmail.com</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

    