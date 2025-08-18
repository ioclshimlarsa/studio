
'use client';

import { useState } from 'react';
import { books, histories, bookDemands, users } from '@/lib/data';
import type { Book, UserBorrowingHistory, User, BorrowingHistoryEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, BookCheck, BookUp, Check, Library, PlusCircle, Upload, X, Hand, LogOut, Users, UserPlus, ShieldOff, KeyRound, CheckCircle, CircleSlash, Ban, Trash2, FileDown, History } from 'lucide-react';
import { ReminderDialog } from '@/components/admin/reminder-dialog';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CreateUserForm } from '@/components/admin/create-user-form';
import { useToast } from '@/hooks/use-toast';
import { updateUserStatus, resetUserPassword, removeBook } from '@/lib/actions';
import { downloadCSV } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const bookRequests = books.filter((book) => book.status === 'Requested');
const overdueBooks = books.filter((book) => 
  book.status === 'Issued' && book.dueDate && differenceInDays(new Date(), parseISO(book.dueDate)) > 0
);


export default function AdminDashboard() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isReminderOpen, setReminderOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const { toast } = useToast();
  // Force a re-render when user/book data changes
  const [userVersion, setUserVersion] = useState(0); 
  const [bookVersion, setBookVersion] = useState(0); 
  const [selectedHistoryUserId, setSelectedHistoryUserId] = useState<string | null>(null);

  const allUsers = users;
  const allBooks = books;

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

  const handleStatusChange = async (userId: string, status: 'active' | 'inactive' | 'blocked') => {
    const result = await updateUserStatus(userId, status);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setUserVersion(v => v + 1); // Trigger re-render
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const handlePasswordReset = async (userId: string) => {
    if(confirm('Are you sure you want to reset the password for this user?')) {
        const result = await resetUserPassword(userId);
        if (result.success) {
            toast({ title: 'Password Reset', description: result.message });
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    }
  };
  
  const handleRemoveBook = async (bookId: string, bookTitle: string) => {
    if (confirm(`Are you sure you want to remove the book "${bookTitle}"? This action cannot be undone.`)) {
      const result = await removeBook(bookId);
      if (result.success) {
        toast({ title: 'Book Removed', description: result.message });
        setBookVersion(v => v + 1); // Trigger re-render
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    }
  };

  const handleDownloadReport = async (reportType: 'books' | 'transactions' | 'demands' | 'users') => {
    let data: any[] = [];
    let filename = '';
    
    switch (reportType) {
      case 'books':
        data = allBooks;
        filename = 'all_books_report.csv';
        break;
      case 'transactions':
        data = histories.flatMap(h => h.history.map(entry => ({ userId: h.userId, ...entry })));
        filename = 'all_transactions_report.csv';
        break;
      case 'demands':
        data = bookDemands;
        filename = 'book_demands_report.csv';
        break;
      case 'users':
        data = allUsers.map(({ password, ...user }) => user); // Exclude password from report
        filename = 'all_users_report.csv';
        break;
    }

    if (data.length > 0) {
      await downloadCSV(data, filename);
      toast({ title: 'Report Generated', description: `${filename} has been downloaded.` });
    } else {
      toast({ title: 'No Data', description: 'There is no data to generate a report.', variant: 'destructive' });
    }
  };
  
  const selectedUserHistory = selectedHistoryUserId ? getHistoryForUser(selectedHistoryUserId)?.history : [];


  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-8">
      <header className="mb-8 flex justify-between items-start">
        <div>
            <h1 className="text-4xl font-bold font-headline text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Sarb Sukh Sanjhi library - Bareta Mansa Punjab</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
      </header>
      
      <main>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 max-w-6xl mx-auto">
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
            <TabsTrigger value="manage_users">
              <Users className="mr-2 h-4 w-4" /> Manage Users
            </TabsTrigger>
            <TabsTrigger value="user_history">
                <History className="mr-2 h-4 w-4" /> User History
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileDown className="mr-2 h-4 w-4" /> Reports
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
                      <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell className="text-right">
                           <Button size="sm" variant="destructive" onClick={() => handleRemoveBook(book.id, book.title)}>
                            <Trash2 className="mr-1 h-3 w-3" /> Remove
                          </Button>
                        </TableCell>
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
          <TabsContent value="manage_users">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <CreateUserForm />
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>View and manage all registered users.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allUsers.filter(u => u.role === 'user').map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>
                              <Badge variant={user.status === 'active' ? 'secondary' : user.status === 'inactive' ? 'outline' : 'destructive'} className="capitalize">
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              {user.status === 'active' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(user.id, 'inactive')}><CircleSlash className="mr-1 h-3 w-3" /> Inactive</Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleStatusChange(user.id, 'blocked')}><Ban className="mr-1 h-3 w-3" /> Block</Button>
                                </>
                              )}
                              {(user.status === 'inactive' || user.status === 'blocked') && (
                                <Button size="sm" variant="outline" onClick={() => handleStatusChange(user.id, 'active')}><CheckCircle className="mr-1 h-3 w-3" /> Activate</Button>
                              )}
                              <Button size="sm" variant="secondary" onClick={() => handlePasswordReset(user.id)}><KeyRound className="mr-1 h-3 w-3" /> Reset Pass</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="user_history">
            <Card>
                <CardHeader>
                    <CardTitle>User Borrowing History</CardTitle>
                    <CardDescription>Select a user to view their complete transaction history.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="max-w-xs">
                        <Label htmlFor="user-select">Select User</Label>
                        <Select onValueChange={setSelectedHistoryUserId}>
                            <SelectTrigger id="user-select">
                                <SelectValue placeholder="Select a user..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allUsers.filter(u => u.role === 'user').map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.id})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedHistoryUserId && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Book Title</TableHead>
                                    <TableHead>Issue Date</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Return Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedUserHistory && selectedUserHistory.length > 0 ? (
                                    selectedUserHistory.map((entry: BorrowingHistoryEntry) => (
                                        <TableRow key={entry.bookId + entry.issueDate}>
                                            <TableCell className="font-medium">{entry.title}</TableCell>
                                            <TableCell>{format(parseISO(entry.issueDate), 'PPP')}</TableCell>
                                            <TableCell>{format(parseISO(entry.dueDate), 'PPP')}</TableCell>
                                            <TableCell>
                                                {entry.returnDate ? format(parseISO(entry.returnDate), 'PPP') : <Badge variant="outline">Not Returned</Badge>}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">No borrowing history for this user.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
                <CardHeader>
                    <CardTitle>Generate Reports</CardTitle>
                    <CardDescription>Download various library data reports in CSV format.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button variant="outline" onClick={() => handleDownloadReport('books')}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Download All Books
                    </Button>
                    <Button variant="outline" onClick={() => handleDownloadReport('transactions')}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Download Transactions
                    </Button>
                    <Button variant="outline" onClick={() => handleDownloadReport('demands')}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Download Book Demands
                    </Button>
                    <Button variant="outline" onClick={() => handleDownloadReport('users')}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Download User List
                    </Button>
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

    
