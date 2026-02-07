'use client';

import * as Select from '@radix-ui/react-select';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
}: CustomSelectProps) {
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        className={`
          flex items-center justify-between gap-2 w-full
          px-3 py-1.5 rounded-full text-sm
          bg-[#2a2520] text-[#e8dcc8]
          border border-[#3a352f]
          transition-all duration-200
          ${!disabled && 'hover:border-[#d4a060] cursor-pointer'}
          data-[state=open]:border-[#d4a060] data-[state=open]:ring-1 data-[state=open]:ring-[#d4a060]/30
          ${disabled && 'opacity-50 cursor-not-allowed'}
          focus:outline-none focus:border-[#d4a060] focus:ring-1 focus:ring-[#d4a060]/30
          ${className}
        `}
      >
        <Select.Value placeholder={<span className="text-[#6a6050]">{placeholder}</span>}>
          {selectedOption && (
            <span className="flex items-center gap-2 text-[#e8dcc8]">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          )}
        </Select.Value>
        <Select.Icon>
          <svg
            className="w-4 h-4 text-[#8a7a68]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="
            z-50 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]
            bg-[#2a2520] border border-[#3a352f] rounded-lg
            shadow-lg shadow-black/40
            overflow-hidden
            data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
          "
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="py-1 max-h-60">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="
                  flex items-center gap-2 px-3 py-2 text-sm cursor-pointer
                  transition-colors duration-100 outline-none
                  text-[#c8c0b4]
                  data-[highlighted]:bg-[#3a352f] data-[highlighted]:text-[#e8dcc8]
                  data-[state=checked]:bg-[#d4a060]/20 data-[state=checked]:text-[#d4a060]
                "
              >
                {option.icon}
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="ml-auto">
                  <svg className="w-4 h-4 text-[#d4a060]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

export default CustomSelect;
