import React from "react";
import { X, AlertCircle } from "lucide-react";

interface BusinessFormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  type?: string;
  readOnly?: boolean;
  onClear?: () => void;
  onClick?: () => void;
  prefix?: React.ReactNode;
  error?: string;
}

export const BusinessFormField: React.FC<BusinessFormFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  multiline = false,
  type = "text",
  readOnly = false,
  onClear,
  onClick,
  prefix,
  error,
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(e.target.value);
  };

  const Component = multiline ? "textarea" : "input";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 flex items-center justify-center w-8 h-8">
            {prefix}
          </div>
        )}

        <Component
          type={multiline ? undefined : type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={readOnly || !!onClick}
          onClick={onClick}
          className={`
            w-full pr-10 py-2
            bg-background border border-border rounded-lg
            focus:ring-2 focus:ring-primary focus:border-transparent
            placeholder-muted-foreground text-foreground
            ${onClick ? "cursor-pointer" : ""}
            ${readOnly ? "bg-muted" : ""}
            ${multiline ? "min-h-[100px] resize-vertical whitespace-pre-wrap" : "h-10"}
            ${prefix ? "pl-14" : "pl-3"}
          `}
          rows={multiline ? 3 : undefined}
        />

        {value && onClear && !readOnly && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 mt-1">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}
    </div>
  );
};
