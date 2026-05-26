import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function removeEmptyFields(obj: Record<string, any>): Record<string, any> {
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== "" && obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}
