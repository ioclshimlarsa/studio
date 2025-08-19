
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { utils, writeFile } from "xlsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadCSV(data: any[], filename: string) {
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  writeFile(workbook, filename);
}
