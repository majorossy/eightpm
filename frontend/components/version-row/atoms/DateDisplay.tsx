// DateDisplay — formatted show date (replaces 5+ copies of showDate.replace(/-/g, '/'))

interface DateDisplayProps {
  date?: string;
  format?: 'slash' | 'short' | 'year';
  className?: string;
}

function formatDate(date: string, format: 'slash' | 'short' | 'year'): string {
  switch (format) {
    case 'slash':
      return date.replace(/-/g, '/');
    case 'short': {
      // YYYY-MM-DD -> MM/DD/YY
      const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) return `${match[2]}/${match[3]}/${match[1].slice(-2)}`;
      return date.replace(/-/g, '/');
    }
    case 'year':
      return date.split('-')[0] || date;
  }
}

export default function DateDisplay({ date, format = 'slash', className = '' }: DateDisplayProps) {
  if (!date) return null;

  return (
    <span className={className}>
      {formatDate(date, format)}
    </span>
  );
}
