
'use client';

import { useState } from 'react';
import { books, histories, bookDemands } from '@/lib/data';
import type { Book, UserBorrowingHistory } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, BookCheck, BookUp, Check, Library, PlusCircle, Upload, X, Hand, LogOut } from 'lucide-react';
import { ReminderDialog } from '@/components/admin/reminder-dialog';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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

  const handleLogout = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8 flex justify-between items-start">
        <div>
            <h1 className="text-4xl font-bold font-headline text-primary-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your library with ease.</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
      </header>
      
      <main>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 max-w-4xl mx-auto">
            <TabsTrigger value="requests">
              <BookUp className="mr-2 h-4 w-4" /> Requests <Badge variant="destructive" className="ml-2">{bookRequests.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue">
              <Bell className="mr-2 h-4 w-4" /> Overdue <Badge variant="destructive" className="ml-2">{overdueBooks.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="demands">
                <Hand className="mr-2 h-4 w-4" /> Demands <Badge variant="destructive" className="ml-2">{bookDemands.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all_books">
              <Library className="mr-2 h-4 w-4" /> All Books
            </TabsTrigger>
            <TabsTrigger value="add_books">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Books
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

          <TabsContent value="demands">
            <Card>
              <CardHeader>
                <CardTitle>New Book Demands</CardTitle>
                <CardDescription>Users have requested these books to be added to the library.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookDemands.length > 0 ? bookDemands.map((demand) => (
                      <TableRow key={demand.id}>
                        <TableCell className="font-medium">{demand.title}</TableCell>
                        <TableCell>{demand.author}</TableCell>
                        <TableCell>{demand.requestedBy}</TableCell>
                        <TableCell>{format(parseISO(demand.date), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => {
                            setActiveTab('add_books');
                          }}>
                            Add Book
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                        <TableRow><TableCell colSpan={5} className="text-center">No new book demands.</TableCell></TableRow>
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

          <TabsContent value="add_books">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Add a New Book</CardTitle>
                        <CardDescription>Manually enter book details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" placeholder="e.g., The Great Gatsby" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="author">Author</Label>
                                <Input id="author" placeholder="e.g., F. Scott Fitzgerald" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="language">Language</Label>
                                <Input id="language" placeholder="e.g., English" />
                            </div>
                            <Button type="submit" className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Book
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Bulk Upload</CardTitle>
                        <CardDescription>Add multiple books from a CSV file.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center space-y-4 h-full">
                        <div className="flex flex-col items-center space-y-2 text-center">
                            <Upload className="h-12 w-12 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Drag & drop a CSV file here, or click to select a file.</p>
                        </div>
                         <Button variant="outline">
                           <Upload className="mr-2 h-4 w-4" /> Choose File
                        </Button>
                        <p className="text-xs text-muted-foreground">CSV format: title, author, language</p>
                    </CardContent>
                </Card>
            </div>
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
