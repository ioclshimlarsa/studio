
import { BookMarked } from 'lucide-react';
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-3 text-center">
      <BookMarked className="h-10 w-10 text-primary" />
      <span className="text-3xl font-bold text-foreground font-headline">
        Bareta Mobile Library
      </span>
    </div>
  );
}

    