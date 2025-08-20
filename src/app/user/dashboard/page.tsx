
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserDashboardData, returnBook, requestBook, demandBook } from '@/lib/actions';
import type { Book, User, BorrowingHistoryEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book as BookIcon, BookCheck, History, Library, User as UserIcon, Hand, PlusCircle, LogOut, AlertTriangle, Languages, Type } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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
    const [languageFilter, setLanguageFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

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
    
    const overdueBooks = myBooks.filter(book => 
        book.dueDate && differenceInDays(new Date(), parseISO(book.dueDate)) > 0
    );

    const uniqueLanguages = ['all', ...Array.from(new Set(allBooks.map(book => book.language)))];
    const uniqueTypes = ['all', ...Array.from(new Set(allBooks.map(book => book.type)))];

    const filteredBooksByLanguage = languageFilter === 'all' 
        ? allBooks 
        : allBooks.filter(book => book.language === languageFilter);
        
    const filteredBooksByType = typeFilter === 'all' 
        ? allBooks 
        : allBooks.filter(book => book.type === typeFilter);

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

            {overdueBooks.length > 0 && (
                <Alert variant="destructive" className="mb-8">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Overdue Books Alert!</AlertTitle>
                    <AlertDescription>
                        You have {overdueBooks.length} book(s) overdue. Please return them as soon as possible to avoid fines.
                    </AlertDescription>
                </Alert>
            )}

            <main>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 max-w-3xl mx-auto h-auto">
                        <TabsTrigger value="my_books">
                            <BookCheck className="mr-2 h-4 w-4" /> My Books
                        </TabsTrigger>
                        <TabsTrigger value="browse">
                            <Library className="mr-2 h-4 w-4" /> Browse
                        </TabsTrigger>
                         <TabsTrigger value="filter_by_language">
                            <Languages className="mr-2 h-4 w-4" /> Filter by Language
                        </TabsTrigger>
                        <TabsTrigger value="filter_by_type">
                            <Type className="mr-2 h-4 w-4" /> Filter by Type
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
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Author</TableHead>
                                            <TableHead>Language</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allBooks.map((book) => (
                                            <TableRow key={book.id} className={book.status !== 'Available' ? 'text-muted-foreground' : ''}>
                                                <TableCell className="font-medium">{book.title}</TableCell>
                                                <TableCell>{book.author}</TableCell>
                                                <TableCell>{book.language}</TableCell>
                                                <TableCell>{book.type}</TableCell>
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
                    
                     <TabsContent value="filter_by_language">
                        <Card>
                            <CardHeader>
                                <CardTitle>Filter by Language</CardTitle>
                                <CardDescription>Select a language to view books and request them.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="max-w-xs">
                                <Label htmlFor="language-select-user">Select Language</Label>
                                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                                    <SelectTrigger id="language-select-user">
                                    <SelectValue placeholder="Select a language..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {uniqueLanguages.map(lang => (
                                        <SelectItem key={lang} value={lang}>
                                        {lang === 'all' ? 'All Languages' : lang}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                </div>
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBooksByLanguage.length > 0 ? (
                                    filteredBooksByLanguage.map(book => (
                                        <TableRow key={book.id} className={book.status !== 'Available' ? 'text-muted-foreground' : ''}>
                                        <TableCell className="font-medium">{book.title}</TableCell>
                                        <TableCell>{book.author}</TableCell>
                                        <TableCell>
                                            <Badge variant={book.status === 'Available' ? 'secondary' : book.status === 'Issued' ? 'default' : 'outline'} className="capitalize">
                                                {book.status === 'Requested' && book.issuedTo === user.id ? 'Requested by you' : book.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {book.status === 'Available' ? (
                                            <Button size="sm" onClick={() => handleRequestBook(book.id)}>Request</Button>
                                            ) : (
                                            <span className="text-sm italic">Unavailable</span>
                                            )}
                                        </TableCell>
                                        </TableRow>
                                    ))
                                    ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">No books found for this language.</TableCell>
                                    </TableRow>
                                    )}
                                </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="filter_by_type">
                        <Card>
                            <CardHeader>
                                <CardTitle>Filter by Type</CardTitle>
                                <CardDescription>Select a book type to view books and request them.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="max-w-xs">
                                <Label htmlFor="type-select-user">Select Type</Label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger id="type-select-user">
                                    <SelectValue placeholder="Select a type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {uniqueTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                        {type === 'all' ? 'All Types' : type}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                </div>
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBooksByType.length > 0 ? (
                                    filteredBooksByType.map(book => (
                                        <TableRow key={book.id} className={book.status !== 'Available' ? 'text-muted-foreground' : ''}>
                                        <TableCell className="font-medium">{book.title}</TableCell>
                                        <TableCell>{book.author}</TableCell>
                                        <TableCell>
                                            <Badge variant={book.status === 'Available' ? 'secondary' : book.status === 'Issued' ? 'default' : 'outline'} className="capitalize">
                                                {book.status === 'Requested' && book.issuedTo === user.id ? 'Requested by you' : book.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {book.status === 'Available' ? (
                                            <Button size="sm" onClick={() => handleRequestBook(book.id)}>Request</Button>
                                            ) : (
                                            <span className="text-sm italic">Unavailable</span>
                                            )}
                                        </TableCell>
                                        </TableRow>
                                    ))
                                    ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">No books found for this type.</TableCell>
                                    </TableRow>
                                    )}
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
