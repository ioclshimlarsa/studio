import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
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
