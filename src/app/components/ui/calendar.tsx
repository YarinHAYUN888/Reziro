"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-5 bg-gradient-to-br from-[#0B0F0E] to-[#141A18] backdrop-blur-2xl", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4 w-full",
        caption: "flex justify-center pt-2 relative items-center w-full mb-3",
        caption_label: "text-lg font-bold text-primary tracking-wide",
        nav: "flex items-center gap-2",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-9 bg-transparent border-2 border-primary/40 hover:bg-primary/20 hover:border-primary p-0 transition-all duration-300 ",
        ),
        nav_button_previous: "absolute ltr:left-2 rtl:right-2",
        nav_button_next: "absolute ltr:right-2 rtl:left-2",
        table: "w-full border-collapse space-y-1 mt-2",
        head_row: "flex w-full justify-between",
        head_cell:
          "text-primary/80 rounded-md w-12 font-bold text-xs uppercase tracking-wider py-2 text-center",
        row: "flex w-full mt-1 justify-between",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-12 h-12",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "w-12 h-12 p-0 font-semibold text-base aria-selected:opacity-100 hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-black font-bold",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-black font-bold",
        day_selected:
          "bg-primary text-black hover:bg-primary hover:text-black focus:bg-primary focus:text-black font-bold  scale-110 border-2 border-primary",
        day_today: "bg-primary/30 text-primary font-bold ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        day_outside:
          "day-outside text-muted-foreground/30 opacity-40 aria-selected:text-muted-foreground/50",
        day_disabled: "text-muted-foreground/20 opacity-30 line-through cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-primary/30 aria-selected:text-primary",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-5 text-primary", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-5 text-primary", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };