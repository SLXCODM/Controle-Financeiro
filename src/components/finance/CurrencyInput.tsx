import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function CurrencyInput({
  value,
  onChange,
  className,
  placeholder = '0,00',
  required,
  id,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Format number to Brazilian currency format
  const formatToCurrency = (numericValue: string): string => {
    // Remove all non-digits
    const digits = numericValue.replace(/\D/g, '');
    
    if (!digits) return '';
    
    // Convert to number (considering last 2 digits as decimals)
    const number = parseInt(digits, 10) / 100;
    
    // Format with Brazilian locale
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Parse formatted value back to number string
  const parseToNumber = (formattedValue: string): string => {
    const digits = formattedValue.replace(/\D/g, '');
    if (!digits) return '';
    return (parseInt(digits, 10) / 100).toString();
  };

  useEffect(() => {
    if (value) {
      // Convert initial value (number string) to formatted display
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        setDisplayValue(numericValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }));
      }
    } else {
      setDisplayValue('');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatToCurrency(inputValue);
    setDisplayValue(formatted);
    onChange(parseToNumber(formatted));
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        R$
      </span>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={cn('pl-10 text-lg font-semibold', className)}
      />
    </div>
  );
}
