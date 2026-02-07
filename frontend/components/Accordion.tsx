'use client';

import { createContext, useContext, useId } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';

// Context to detect if Accordion is inside an AccordionGroup
const InGroupContext = createContext(false);

// AccordionGroup manages multiple accordions
interface AccordionGroupProps {
  children: React.ReactNode;
  allowMultiple?: boolean;
  defaultOpenId?: string | null;
}

export function AccordionGroup({
  children,
  allowMultiple = false,
  defaultOpenId = null
}: AccordionGroupProps) {
  if (allowMultiple) {
    return (
      <AccordionPrimitive.Root
        type="multiple"
        defaultValue={defaultOpenId ? [defaultOpenId] : []}
        className="space-y-2"
      >
        <InGroupContext.Provider value={true}>
          {children}
        </InGroupContext.Provider>
      </AccordionPrimitive.Root>
    );
  }

  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      defaultValue={defaultOpenId || undefined}
      className="space-y-2"
    >
      <InGroupContext.Provider value={true}>
        {children}
      </InGroupContext.Provider>
    </AccordionPrimitive.Root>
  );
}

// Individual Accordion item
interface AccordionProps {
  id?: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}

export function Accordion({
  id: providedId,
  title,
  children,
  defaultOpen = false,
  icon
}: AccordionProps) {
  const generatedId = useId();
  const itemValue = providedId || generatedId;
  const inGroup = useContext(InGroupContext);

  const item = (
    <AccordionPrimitive.Item
      value={itemValue}
      className="border border-[#3a3632] rounded-lg overflow-hidden bg-[#2a2825]"
    >
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger
          className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[#32302c] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a060] focus-visible:ring-inset group"
        >
          <div className="flex items-center gap-3">
            {icon && <span className="text-[#d4a060] flex-shrink-0">{icon}</span>}
            <h3 className="text-lg font-semibold text-[#d4a060]">{title}</h3>
          </div>
          <svg
            className="w-5 h-5 text-[#8a8478] transition-transform duration-200 group-data-[state=open]:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content
        className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up"
      >
        <div className="px-4 pb-4 text-[#8a8478] leading-relaxed border-t border-[#3a3632]/50">
          <div className="pt-4">
            {children}
          </div>
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );

  // If inside AccordionGroup, the Root already exists
  if (inGroup) {
    return item;
  }

  // Standalone: wrap in its own Root
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      defaultValue={defaultOpen ? itemValue : undefined}
    >
      {item}
    </AccordionPrimitive.Root>
  );
}

export default Accordion;
