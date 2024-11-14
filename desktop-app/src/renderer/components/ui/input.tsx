import * as React from "react"

import { cn } from "./cn"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onChange, ...props }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        const target = event.currentTarget;
        target.value = '';

        // Create a custom event
        const customEvent = new CustomEvent('input', {
          bubbles: true,
          cancelable: true,
          detail: { value: '' }
        });

        // Dispatch the custom event
        target.dispatchEvent(customEvent);

        // Call the onChange handler with a synthesized React event
        onChange && onChange({
          target,
          currentTarget: target,
          type: 'input',
        } as React.ChangeEvent<HTMLInputElement>);
      }
      // Call the original onKeyDown if it exists
      props.onKeyDown?.(event);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
