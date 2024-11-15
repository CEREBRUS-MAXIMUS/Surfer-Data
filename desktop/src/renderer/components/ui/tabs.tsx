'use client';

import * as React from 'react';

import { cn } from './cn';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { type VariantProps, cva } from 'class-variance-authority';

const Tabs = TabsPrimitive.Root;

const TabsListVariants = cva('inline-flex items-center justify-center relative', {
  variants: {
    variant: {
      default: 'rounded-md bg-muted p-1 text-muted-foreground',
      underline: 'w-full border-b border-gray-200 bg-background gap-2 p-0 justify-start',
    },
    width: {
      full: 'w-full',
      fit: 'w-fit',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const TabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm transition-colors disabled:pointer-events-none data-[state=active]:text-foreground relative select-none",
  {
    variants: {
      variant: {
        default:
          "rounded-md px-3 py-1.5 ring-offset-background transition-all focus-visible:outline-none focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-bold hover:bg-muted/50",
        underline:
          "rounded-md px-3 py-1.5 mb-2 hover:bg-muted/50 focus-visible:outline-none focus:outline-none focus:bg-transparent active:bg-transparent data-[state=active]:font-bold after:content-[''] after:absolute after:bottom-[-9px] after:left-0 after:right-0 after:h-[3px] data-[state=active]:after:bg-orange-500",
      },
      width: {
        full: 'w-full',
        fit: 'w-fit',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof TabsListVariants> {
  asChild?: boolean;
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, width, asChild = false, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(TabsListVariants({ variant, width, className }))}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof TabsTriggerVariants> {
  asChild?: boolean;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, width, asChild = false, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      TabsTriggerVariants({ variant, width, className }),
      'relative',
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
