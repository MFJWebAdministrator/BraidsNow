export function formatPhoneNumber(value: string): string {
  if (!value) return '+1 (';
  
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // Format the number
  let formatted = '+1 (';
  if (numbers.length > 0) {
    formatted += numbers.slice(0, 3);
    if (numbers.length > 3) {
      formatted += ') ' + numbers.slice(3, 6);
      if (numbers.length > 6) {
        formatted += '-' + numbers.slice(6, 10);
      }
    }
  }
  
  return formatted;
}