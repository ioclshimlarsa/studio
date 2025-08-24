
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { addBook } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Book, User, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Adding Book...' : <> <PlusCircle className="mr-2 h-4 w-4" /> Add Book </>}
    </Button>
  );
}

interface CreateBookFormProps {
    onBookCreated: () => void;
}

export function CreateBookForm({ onBookCreated }: CreateBookFormProps) {
  const [state, formAction] = useActionState(addBook, undefined);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      formRef.current?.reset();
      onBookCreated();
    } else if (state?.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast, onBookCreated]);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Add a New Book</CardTitle>
            <CardDescription>Manually enter book details.</CardDescription>
        </CardHeader>
        <CardContent>
            <form ref={formRef} action={formAction} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <div className="relative">
                         <Book className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="title" name="title" placeholder="e.g., The Great Gatsby" required className="pl-10" />
                    </div>
                    {state?.fieldErrors?.title && <p className="text-sm font-medium text-destructive">{state.fieldErrors.title}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="author" name="author" placeholder="e.g., F. Scott Fitzgerald" required className="pl-10" />
                    </div>
                    {state?.fieldErrors?.author && <p className="text-sm font-medium text-destructive">{state.fieldErrors.author}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <div className="relative">
                        <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="language" name="language" placeholder="e.g., English" required className="pl-10" />
                    </div>
                     {state?.fieldErrors?.language && <p className="text-sm font-medium text-destructive">{state.fieldErrors.language}</p>}
                </div>
                <SubmitButton />
            </form>
        </CardContent>
    </Card>
  );
}
