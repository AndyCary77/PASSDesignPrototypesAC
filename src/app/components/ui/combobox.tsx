"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "./utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Extra text the search also matches, e.g. a code, without showing it. */
  searchText?: string;
}

/**
 * A Select you can type into: the trigger looks like SelectTrigger, and opens a Popover holding a
 * Command (cmdk) search box over the options. Use it where a list is long enough that scrolling
 * is the wrong way to find something; a short list is still better as a plain Select.
 */
export function Combobox({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches found.",
  disabled,
  className,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find(o => o.value === value);

  return (
    // modal: without it, a Combobox inside a Dialog can't be scrolled with the wheel, because the
    // Dialog blocks scrolling outside its own content and the Popover is portalled out of it.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "border-input flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-left text-body transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="line-clamp-1">{selected ? selected.label : placeholder}</span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0 z-[60]"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="text-body" />
          <CommandList className="max-h-72">
            <CommandEmpty className="py-6 text-center text-body text-gray-700">{emptyText}</CommandEmpty>
            {options.map(o => (
              <CommandItem
                key={o.value}
                // cmdk filters on this string, so it carries the label plus the hidden search text.
                value={`${o.label} ${o.searchText ?? ""}`}
                onSelect={() => {
                  onValueChange(o.value);
                  setOpen(false);
                }}
                className="text-body items-start"
              >
                <CheckIcon
                  className={cn("mt-1 size-4 shrink-0 text-[rgb(154,38,214)]", o.value === value ? "opacity-100" : "opacity-0")}
                  aria-hidden="true"
                />
                <span>{o.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
