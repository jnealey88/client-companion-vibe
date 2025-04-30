import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusClass(status: string): string {
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    case 'discovery':
      return 'status-badge-discovery';
    case 'planning':
      return 'status-badge-planning';
    case 'design and development':
      return 'status-badge-design-and-development';
    case 'post launch management':
      return 'status-badge-post-launch-management';
    // Keep these for backward compatibility with projectStatus
    case 'active':
      return 'status-badge-active';
    case 'pending':
      return 'status-badge-pending';
    case 'completed':
      return 'status-badge-completed';
    case 'on hold':
      return 'status-badge-on-hold';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function generateClientLogo(clientName: string): string {
  // Generate initials for the client
  const words = clientName.split(' ');
  let initials = '';
  
  if (words.length >= 2) {
    initials = words[0][0] + words[1][0];
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].substring(0, 2);
  } else {
    initials = words[0][0];
  }
  
  return initials.toUpperCase();
}

export function generateAvatarFallback(name: string): string {
  const words = name.split(' ');
  
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
}

export function formatTimeSaved(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}
