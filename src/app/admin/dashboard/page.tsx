
'use client';

import { useState } from 'react';
import { books, histories, users } from '@/lib/data';
import type { Book, UserBorrowingHistory } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, BookCheck, BookUp, Check, Clock, Library, X } from 'lucide-react';
import { ReminderDialog } from '@/components/admin/reminder-dialog';
import { differenceInDays, parseISO } from 'date-fns';

const bookRequests = books.filter((book) => book.status === 'Requested');
const overdueBooks = books.filter((book) => 
  book.status === 'Issued' && book.dueDate && differenceInDays(new Date(), parseISO(book.dueDate)) > 0
);
const allBooks = books;

export default function AdminDashboard() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isReminderOpen, setReminderOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');

  const handleSendReminder = (book: Book) => {
    setSelectedBook(book);
    setReminderOpen(true);
  };

  const getHistoryForUser = (userId: string | undefined): UserBorrowingHistory | undefined => {
    return histories.find(h => h.userId === userId);
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your library with ease.</p>
      </header>
      
      <main>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
            <TabsTrigger value="requests">
              <BookUp className="mr-2 h-4 w-4" /> Requests <Badge variant="destructive" className="ml-2">{bookRequests.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue">
              <Bell className="mr-2 h-4 w-4" /> Overdue <Badge variant="destructive" className="ml-2">{overdueBooks.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all_books">
              <Library className="mr-2 h-4 w-4" /> All Books
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Book Issue Requests</CardTitle>
                <CardDescription>Approve or reject requests from users.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookRequests.length > 0 ? bookRequests.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>{book.userName}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline"><Check className="text-green-500" /></Button>
                          <Button size="sm" variant="outline"><X className="text-red-500" /></Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={4} className="text-center">No pending requests.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue">
            <Card>
              <CardHeader>
                <CardTitle>Overdue Books</CardTitle>
                <CardDescription>Send reminders to users for timely returns.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Issued To</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueBooks.length > 0 ? overdueBooks.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.userName}</TableCell>
                        <TableCell>{new Date(book.dueDate!).toLocaleDateString()}</TableCell>
                        <TableCell>
                            <Badge variant="destructive">{differenceInDays(new Date(), parseISO(book.dueDate!))} days</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="default" onClick={() => handleSendReminder(book)}>
                            Send Reminder
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                        <TableRow><TableCell colSpan={5} className="text-center">No overdue books.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all_books">
             <Card>
              <CardHeader>
                <CardTitle>Library Collection</CardTitle>
                <CardDescription>View all books and their current status.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBooks.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>
                          <Badge variant={book.status === 'Available' ? 'secondary' : book.status === 'Issued' ? 'default' : 'outline' } className="capitalize">
                            {book.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{book.userName || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {selectedBook && (
        <ReminderDialog 
          isOpen={isReminderOpen}
          onOpenChange={setReminderOpen}
          book={selectedBook}
          history={getHistoryForUser(selectedBook.issuedTo)}
        />
      )}
    </div>
  );
}
