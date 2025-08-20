
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addBooksFromCSV } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
        {pending ? 'Uploading...' : <><Upload className="mr-2 h-4 w-4" /> Upload & Add Books</>}
    </Button>
  );
}

interface BulkUploadFormProps {
    onUploadComplete: () => void;
}

export function BulkUploadForm({ onUploadComplete }: BulkUploadFormProps) {
  const [state, formAction] = useActionState(addBooksFromCSV, undefined);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      formRef.current?.reset();
      setFileName(null);
      onUploadComplete();
    } else if (state?.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast, onUploadComplete]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Upload</CardTitle>
        <CardDescription>Add multiple books from a CSV file.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col items-center justify-center space-y-4 h-full">
          <div 
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {fileName ? `Selected: ${fileName}` : 'Click or drag & drop a CSV file'}
            </p>
            <Input 
              ref={fileInputRef}
              id="csv-file" 
              name="csv-file" 
              type="file" 
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              required 
            />
          </div>
          <SubmitButton />
          <p className="text-xs text-muted-foreground">CSV format: title, author, language, type</p>
          {state?.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
