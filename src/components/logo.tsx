
import { BookMarked } from 'lucide-react';
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <BookMarked className="h-12 w-12 text-primary" />
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-foreground font-headline">
          Sarb Sukh Sanjhi library
        </span>
        <span className="text-lg font-medium text-muted-foreground">
          Bareta, Mansa (Punjab)
        </span>
      </div>
    </div>
  );
}
