
import { BookMarked } from 'lucide-react';
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2">
      <BookMarked className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold text-primary-foreground font-headline">
        LibraryLite
      </span>
    </div>
  );
}
