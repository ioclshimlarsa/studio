
'use client';

import { useState } from 'react';
import { books, histories } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, BookCheck, History, Library, User, Hand, PlusCircle, LogOut } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// This is a mock. In a real app, you'd get this from session/auth.
const MOCK_USER_ID = 'user01'; 
const user = { name: 'Alice' }; // Mock user

const myBooks = books.filter((book) => book.issuedTo === MOCK_USER_ID);
const myHistory = histories.find((h) => h.userId === MOCK_USER_ID)?.history || [];

export default function UserDashboard() {
    const [activeTab, setActiveTab] = useState('my_books');

    const handleLogout = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold font-headline text-primary-foreground">Welcome, {user.name}!</h1>
                    <p className="text-muted-foreground">Your personal library dashboard.</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </header>

            <main>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 max-w-xl mx-auto">
                        <TabsTrigger value="my_books">
                            <BookCheck className="mr-2 h-4 w-4" /> My Books
                        </TabsTrigger>
                        <TabsTrigger value="browse">
                            <Library className="mr-2 h-4 w-4" /> Browse
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            <History className="mr-2 h-4 w-4" /> History
                        </TabsTrigger>
                        <TabsTrigger value="demand">
                            <Hand className="mr-2 h-4 w-4" /> Demand a Book
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="my_books">
                        <Card>
                            <CardHeader>
                                <CardTitle>My Issued Books</CardTitle>
                                <CardDescription>Books you have currently checked out.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Author</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myBooks.length > 0 ? myBooks.map((book) => {
                                            const isOverdue = book.dueDate && differenceInDays(new Date(), parseISO(book.dueDate)) > 0;
                                            return (
                                            <TableRow key={book.id}>
                                                <TableCell className="font-medium">{book.title}</TableCell>
                                                <TableCell>{book.author}</TableCell>
                                                <TableCell>
                                                    <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                                                        {book.dueDate ? format(parseISO(book.dueDate), 'PPP') : 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm">Return Book</Button>
                                                </TableCell>
                                            </TableRow>
                                        )}) : (
                                            <TableRow><TableCell colSpan={4} className="text-center">You have no books checked out.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="browse">
                        <Card>
                            <CardHeader>
                                <CardTitle>Browse Library</CardTitle>
                                <CardDescription>Find your next read and request it.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Author</TableHead>
                                            <TableHead>Language</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {books.map((book) => (
                                            <TableRow key={book.id} className={book.status !== 'Available' ? 'text-muted-foreground' : ''}>
                                                <TableCell className="font-medium">{book.title}</TableCell>
                                                <TableCell>{book.author}</TableCell>
                                                <TableCell>{book.language}</TableCell>
                                                <TableCell className="text-right">
                                                    {book.status === 'Available' ? (
                                                        <Button size="sm">Request</Button>
                                                    ) : (
                                                        <span className="text-sm italic">Someone is reading it</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>My Borrowing History</CardTitle>
                                <CardDescription>A record of all the books you've borrowed.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Issue Date</TableHead>
                                            <TableHead>Return Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myHistory.length > 0 ? myHistory.map((item) => (
                                            <TableRow key={item.bookId + item.issueDate}>
                                                <TableCell className="font-medium">{item.title}</TableCell>
                                                <TableCell>{format(parseISO(item.issueDate), 'PPP')}</TableCell>
                                                <TableCell>{item.returnDate ? format(parseISO(item.returnDate), 'PPP') : 'Not Returned'}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={3} className="text-center">You have no borrowing history.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                     <TabsContent value="demand">
                        <Card className="max-w-2xl mx-auto">
                            <CardHeader>
                                <CardTitle>Demand a New Book</CardTitle>
                                <CardDescription>Can't find a book you're looking for? Request it here!</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="demand-title">Book Title</Label>
                                        <Input id="demand-title" placeholder="e.g., The Lord of the Rings" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="demand-author">Author</Label>
                                        <Input id="demand-author" placeholder="e.g., J.R.R. Tolkien" />
                                    </div>
                                    <Button type="submit" className="w-full">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Submit Demand
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
