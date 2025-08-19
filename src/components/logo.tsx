
import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Image
        src="https://placehold.co/128x128.png"
        alt="LibraryLite Logo"
        width={80}
        height={80}
        className="rounded-full shadow-md"
        data-ai-hint="mobile library"
      />
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
