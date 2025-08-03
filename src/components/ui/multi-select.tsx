
import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface MultiSelectProps {
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
}

export function MultiSelect({
  value = [],
  onValueChange,
  placeholder,
  children,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = React.useCallback(
    (itemValue: string) => {
      if (!onValueChange) return;

      const newValue = value.includes(itemValue)
        ? value.filter((item) => item !== itemValue)
        : [...value, itemValue];

      onValueChange(newValue);
    },
    [value, onValueChange]
  );

  // Função para obter o texto do item pelo valor
  const getItemText = React.useCallback(
    (itemValue: string) => {
      const child = React.Children.toArray(children).find(
        (child) =>
          React.isValidElement(child) && child.props.value === itemValue
      );

      return React.isValidElement(child) ? child.props.children : itemValue;
    },
    [children]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {value.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(item);
                  }}
                >
                  {getItemText(item)}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Pesquisar..." />
          <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
          <CommandGroup>
            {React.Children.map(children, (child) => {
              if (!React.isValidElement(child)) return null;

              return (
                <MultiSelectItem
                  key={child.props.value}
                  value={child.props.value}
                  onSelect={() => handleSelect(child.props.value)}
                  aria-selected={value.includes(child.props.value)}
                >
                  {child.props.children}
                </MultiSelectItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export const MultiSelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CommandItem> & { value: string }
>(({ className, children, value, onSelect, ...props }, ref) => {
  return (
    <CommandItem
      ref={ref}
      className={cn(
        "aria-selected:bg-primary aria-selected:text-primary-foreground",
        className
      )}
      onSelect={onSelect}
      {...props}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4",
          props["aria-selected"] ? "opacity-100" : "opacity-0"
        )}
      />
      {children}
    </CommandItem>
  );
});
MultiSelectItem.displayName = "MultiSelectItem";
