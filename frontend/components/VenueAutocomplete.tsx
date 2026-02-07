'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { VALIDATION_LIMITS } from '@/lib/validation';
import * as Popover from '@radix-ui/react-popover';

interface VenueAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function VenueAutocomplete({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Search venue...',
  className = '',
  disabled = false,
}: VenueAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync inputValue with external value prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter suggestions based on input (only after 3+ characters)
  const filteredSuggestions = useMemo(() => {
    const trimmed = inputValue.trim();
    // Require at least 3 characters before showing suggestions
    if (trimmed.length < 3) return [];
    const searchLower = trimmed.toLowerCase();
    return suggestions
      .filter(venue => venue.toLowerCase().includes(searchLower))
      .slice(0, 10);
  }, [inputValue, suggestions]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const shouldShowPopover = isOpen && (filteredSuggestions.length > 0 || (inputValue.trim().length >= 3 && suggestions.length > 0));

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Limit input length to prevent abuse
    const newValue = e.target.value.slice(0, VALIDATION_LIMITS.VENUE_MAX);
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  }, [onChange]);

  const handleSelect = useCallback((venue: string) => {
    setInputValue(venue);
    onChange(venue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (filteredSuggestions.length > 0) {
          setHighlightedIndex(prev =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen && highlightedIndex > 0) {
          setHighlightedIndex(prev => prev - 1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          handleSelect(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }, [disabled, isOpen, highlightedIndex, filteredSuggestions, handleSelect]);

  const handleFocus = useCallback(() => {
    // Only open if we already have 3+ chars typed
    if (inputValue.trim().length >= 3 && suggestions.length > 0) {
      setIsOpen(true);
    }
  }, [inputValue, suggestions.length]);

  const handleClear = useCallback(() => {
    setInputValue('');
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // Highlight matching text in suggestion
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-[#d4a060]/30 text-[#d4a060]">{part}</mark>
        : part
    );
  };

  return (
    <Popover.Root open={shouldShowPopover} onOpenChange={setIsOpen}>
      <div className={`relative ${className}`}>
        <Popover.Anchor asChild>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={VALIDATION_LIMITS.VENUE_MAX}
              className={`
                w-full px-3 py-1.5 pr-8 rounded-full text-sm
                bg-[#2a2520] text-[#e8dcc8]
                border border-[#3a352f]
                transition-all duration-200
                placeholder-[#6a6050]
                ${!disabled && 'hover:border-[#d4a060]'}
                ${isOpen && 'border-[#d4a060] ring-1 ring-[#d4a060]/30'}
                ${disabled && 'opacity-50 cursor-not-allowed'}
                focus:outline-none focus:border-[#d4a060] focus:ring-1 focus:ring-[#d4a060]/30
              `}
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
            />

            {/* Clear button or search icon */}
            {inputValue ? (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6a6050] hover:text-[#d4a060] transition-colors"
                aria-label="Clear venue"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <svg
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6050] pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
        </Popover.Anchor>

        <Popover.Portal>
          <Popover.Content
            className="
              z-50 w-[var(--radix-popover-trigger-width)] min-w-[200px]
              bg-[#2a2520] border border-[#3a352f] rounded-lg
              shadow-lg shadow-black/40
              data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
              data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
            "
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {filteredSuggestions.length > 0 ? (
              <ul
                ref={listRef}
                className="py-1 max-h-60 overflow-y-auto"
                role="listbox"
              >
                {filteredSuggestions.map((venue, index) => (
                  <li
                    key={venue}
                    onClick={() => handleSelect(venue)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      flex items-center gap-2 px-3 py-2 text-sm cursor-pointer
                      transition-colors duration-100
                      ${venue === value
                        ? 'bg-[#d4a060]/20 text-[#d4a060]'
                        : highlightedIndex === index
                          ? 'bg-[#3a352f] text-[#e8dcc8]'
                          : 'text-[#c8c0b4] hover:bg-[#3a352f]'
                      }
                    `}
                    role="option"
                    aria-selected={venue === value}
                  >
                    <svg className="w-4 h-4 text-[#6a6050] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{highlightMatch(venue, inputValue)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-3 px-4 text-sm text-[#6a6050]">
                No venues match &quot;{inputValue}&quot;
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );
}

export default VenueAutocomplete;
