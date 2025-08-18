
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { createUser } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Mail, User, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Creating User...' : <> <UserPlus className="mr-2 h-4 w-4" /> Create User </>}
    </Button>
  );
}

export function CreateUserForm() {
  const [state, formAction] = useActionState(createUser, undefined);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      formRef.current?.reset();
    } else if (state?.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>Add a new user to the library system.</CardDescription>
        </CardHeader>
        <CardContent>
            <form ref={formRef} action={formAction} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="name" name="name" placeholder="e.g., John Doe" required className="pl-10" />
                    </div>
                    {state?.fieldErrors?.name && <p className="text-sm font-medium text-destructive">{state.fieldErrors.name}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="email" name="email" type="email" placeholder="e.g., john.doe@example.com" required className="pl-10" />
                    </div>
                    {state?.fieldErrors?.email && <p className="text-sm font-medium text-destructive">{state.fieldErrors.email}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="userId">User ID</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="userId" name="userId" placeholder="e.g., user05" required className="pl-10" />
                    </div>
                     {state?.fieldErrors?.userId && <p className="text-sm font-medium text-destructive">{state.fieldErrors.userId}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="password" name="password" type="password" required className="pl-10" />
                    </div>
                    {state?.fieldErrors?.password && <p className="text-sm font-medium text-destructive">{state.fieldErrors.password}</p>}
                </div>
                <SubmitButton />
            </form>
        </CardContent>
    </Card>
  );
}
