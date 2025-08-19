
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';

import { login } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, User, ArrowRight } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing In...' : 'Sign In'}
      <ArrowRight className="ml-auto" />
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, undefined);

  useEffect(() => {
    if (state?.success) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('loggedInUserId', state.userId);
            if (state.role === 'admin') {
                window.location.href = '/admin/dashboard';
            } else {
                window.location.href = '/user/dashboard';
            }
        }
    }
  }, [state]);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome Back!</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="userId" name="userId" placeholder="e.g., user01" required className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="password" name="password" type="password" required className="pl-10" />
            </div>
          </div>
          <RadioGroup name="role" defaultValue="user" className="flex justify-around pt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="user" id="user-role" />
              <Label htmlFor="user-role">User</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="admin" id="admin-role" />
              <Label htmlFor="admin-role">Admin</Label>
            </div>
          </RadioGroup>
          {state?.error && <p className="text-sm text-center font-medium text-destructive">{state.error}</p>}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
