
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getPersonalizedReminder } from '@/lib/actions';
import type { Book, UserBorrowingHistory } from '@/lib/types';
import { Send, Sparkles } from 'lucide-react';

interface ReminderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book;
  history: UserBorrowingHistory | undefined;
}

export function ReminderDialog({ isOpen, onOpenChange, book, history }: ReminderDialogProps) {
  const [reminderMessage, setReminderMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && book.issuedTo && book.dueDate) {
      const generateReminder = async () => {
        setIsLoading(true);
        setReminderMessage('');
        
        const borrowingHistoryText = history?.history
            .map(h => `${h.title} (Due: ${new Date(h.dueDate).toLocaleDateString()}, Returned: ${h.returnDate ? new Date(h.returnDate).toLocaleDateString() : 'Not yet'})`)
            .join('; ') || 'No previous borrowing history.';

        const input = {
          userId: book.issuedTo,
          bookTitle: book.title,
          dueDate: book.dueDate,
          borrowingHistory: borrowingHistoryText,
        };
        
        const result = await getPersonalizedReminder(input);
        if (result.success) {
          setReminderMessage(result.message);
        } else {
          setReminderMessage('Error: Could not generate a personalized reminder. Please try again.');
        }
        setIsLoading(false);
      };

      generateReminder();
    }
  }, [isOpen, book, history]);

  const handleSend = () => {
    toast({
      title: 'Reminder Sent!',
      description: `A reminder for "${book.title}" has been sent to ${book.userName}.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-accent" />
            AI-Powered Reminder
          </DialogTitle>
          <DialogDescription>
            A personalized reminder for {book.userName} regarding the overdue book: "{book.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <Textarea value={reminderMessage} readOnly rows={5} className="bg-secondary" />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSend} disabled={isLoading}>
            <Send className="mr-2 h-4 w-4" />
            Send Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
