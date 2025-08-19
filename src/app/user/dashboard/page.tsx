
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserDashboardData, returnBook, requestBook, demandBook } from '@/lib/actions';
import type { Book, User, BorrowingHistoryEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book as BookIcon, BookCheck, History, Library, User as UserIcon, Hand, PlusCircle, LogOut } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';
import { Skeleton } from '@/components/ui/skeleton';

function getLoggedInUserId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('loggedInUserId');
}

export default function UserDashboard() {
    const [activeTab, setActiveTab] = useState('my_books');
    const { toast } = useToast();
    
    const [user, setUser] = useState<User | undefined | null>(undefined);
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    const [myHistory, setMyHistory] = useState<BorrowingHistoryEntry[]>([]);
    const [myBooks, setMyBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const forceRerender = useCallback(async () => {
        setIsLoading(true);
        const userId = getLoggedInUserId();
        if (!userId) {
            if (typeof window !== 'undefined') window.location.href = '/';
            return;
        }

        try {
            const data = await getUserDashboardData(userId);
            if (!data.user) {
                toast({ title: 'Error', description: 'Could not find user data.', variant: 'destructive'});
                if (typeof window !== 'undefined') window.location.href = '/';
                return;
            }
            setUser(data.user);
            setAllBooks(data.allBooks);
            setMyHistory(data.myHistory);
            setMyBooks(data.myBooks);
        } catch (error) {
             toast({ title: 'Error', description: 'Failed to load dashboard data.', variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }

    }, [toast]);

    useEffect(() => {
        forceRerender();
    }, [forceRerender]);
    
    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('loggedInUserId');
            window.location.href = '/';
        }
    };
    
    const handleReturnBook = async (bookId: string) => {
        if (!user) return;
        const result = await returnBook(bookId, user.id);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            forceRerender();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };
    
    const handleRequestBook = async (bookId: string) => {
        if (!user) return;
        const result = await requestBook(bookId, user.id, user.name);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            forceRerender();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted/40 p-4 md:p-8">
                 <header className="mb-8 flex justify-between items-start">
                    <div>
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                </header>
                <main>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="border rounded-md p-4">
                                <Skeleton className="h-6 w-full mb-4" />
                                <Skeleton className="h-6 w-full mb-4" />
                                <Skeleton className="h-6 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }
    
    if (!user) {
         return (
            <div className="flex min-h-screen items-center justify-center">
                <p>Redirecting to login...</p>
            </div>
        );
    }
    
    function DemandSubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" className="w-full" disabled={pending}>
                {pending ? 'Submitting...' : <> <PlusCircle className="mr-2 h-4 w-4" /> Submit Demand </>}
            </Button>
        );
    }

    return (
        <div className="min-h-screen bg-muted/40 p-4 md:p-8">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold font-headline text-foreground">Welcome, {user.name}!</h1>
                    <p className="text-muted-foreground">Your personal library dashboard.</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </header>

            <main>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-xl mx-auto h-auto">
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
                                                    <Button size="sm" onClick={() => handleReturnBook(book.id)}>Return Book</Button>
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
                            </Header>
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
                                        {allBooks.map((book) => (
                                            <TableRow key={book.id} className={book.status !== 'Available' ? 'text-muted-foreground' : ''}>
                                                <TableCell className="font-medium">{book.title}</TableCell>
                                                <TableCell>{book.author}</TableCell>
                                                <TableCell>{book.language}</TableCell>
                                                <TableCell className="text-right">
                                                    {book.status === 'Available' ? (
                                                        <Button size="sm" onClick={() => handleRequestBook(book.id)}>Request</Button>
                                                    ) : (
                                                        <span className="text-sm italic">{book.status === 'Requested' && book.issuedTo === user.id ? 'Requested by you' : 'Unavailable'}</span>
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
                                <form action={async (formData) => {
                                    if (!user) return;
                                    const form = formData.get('title') && formData.get('author');
                                    if (!form) return;
                                    
                                    const result = await demandBook(user.name, formData);
                                     if (result.success) {
                                        toast({ title: 'Success', description: result.message });
                                        // Reset form manually if needed
                                        const formElement = document.querySelector('form');
                                        formElement?.reset();
                                    } else {
                                        toast({ title: 'Error', description: result.error, variant: 'destructive' });
                                    }
                                }} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="demand-title">Book Title</Label>
                                        <Input name="title" id="demand-title" placeholder="e.g., The Lord of the Rings" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="demand-author">Author</Label>
                                        <Input name="author" id="demand-author" placeholder="e.g., J.R.R. Tolkien" required />
                                    </div>
                                    <DemandSubmitButton />
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
