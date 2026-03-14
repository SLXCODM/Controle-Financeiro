import { Input } from '@/components/ui/input';

interface PercentageInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function PercentageInput({ value, onChange, className = 'w-20 text-center' }: PercentageInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(0);
      return;
    }
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onChange(num);
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      min="0"
      max="100"
      className={className}
      value={value === 0 ? '' : value.toString()}
      onChange={handleChange}
      onBlur={() => {
        // Ensure we show 0 if empty on blur is handled by parent
      }}
      placeholder="0"
    />
  );
}
