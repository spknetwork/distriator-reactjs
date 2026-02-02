import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface PaymentMethodSelectorProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  required?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  label,
  value,
  onChange,
  options,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter(item => item !== option)
      : [...value, option];
    onChange(newValue);
  };

  const displayText = value.length > 0 ? value.join(', ') : 'Select payment methods';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-left focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <span className={value.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
            {displayText}
          </span>
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg">
            {options.map((option, index) => (
              <label
                key={index}
                className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer first:rounded-t-lg last:rounded-b-lg"
              >
                <input
                  type="checkbox"
                  checked={value.includes(option)}
                  onChange={() => handleToggle(option)}
                  className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                />
                <span className="flex-1">{option}</span>
                {value.includes(option) && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </label>
            ))}
          </div>
        )}
      </div>
      
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};