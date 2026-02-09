"use client";

import * as React from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
    value: string; // ISO date string (YYYY-MM-DD) or datetime string (YYYY-MM-DD HH:mm)
    onChange: (value: string) => void;
    id?: string;
    required?: boolean;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
    modal?: boolean; // New prop to handle modal context
    showTime?: boolean; // New prop to enable time selection
}

export function DatePicker({
    value,
    onChange,
    id,
    required = false,
    className,
    disabled = false,
    placeholder = "اختر التاريخ",
    modal = false,
    showTime = false,
}: DatePickerProps) {
    // Convert ISO string to Date object
    const selectedDate = value ? new Date(value) : undefined;

    // State for month/year navigation
    const [month, setMonth] = React.useState<Date>(selectedDate || new Date());

    // State for time (hours and minutes)
    // State for time (hours and minutes)
    const [period, setPeriod] = React.useState<'AM' | 'PM'>(() => {
        if (value && showTime) {
            const date = new Date(value);
            return date.getHours() >= 12 ? 'PM' : 'AM';
        }
        return 'AM';
    });

    const [hours, setHours] = React.useState<string>(() => {
        if (value && showTime) {
            const date = new Date(value);
            let h = date.getHours();
            if (h === 0) h = 12;
            else if (h > 12) h -= 12;
            return h.toString().padStart(2, '0');
        }
        return '12';
    });

    const [minutes, setMinutes] = React.useState<string>(() => {
        if (value && showTime) {
            const date = new Date(value);
            return date.getMinutes().toString().padStart(2, '0');
        }
        return '00';
    });

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            if (showTime) {
                // Combine date with time
                const dateStr = format(date, "yyyy-MM-dd");
                
                let h = parseInt(hours);
                if (period === 'PM' && h < 12) h += 12;
                if (period === 'AM' && h === 12) h = 0;
                
                const timeStr = `${h.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                onChange(`${dateStr} ${timeStr}`);
            } else {
                // Convert Date to ISO string (YYYY-MM-DD)
                const isoDate = format(date, "yyyy-MM-dd");
                onChange(isoDate);
            }
        } else {
            onChange("");
        }
    };

    const handleTimeChange = (newHours: string, newMinutes: string, newPeriod: 'AM' | 'PM') => {
        if (selectedDate) {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            
            let h = parseInt(newHours);
            if (newPeriod === 'PM' && h < 12) h += 12;
            if (newPeriod === 'AM' && h === 12) h = 0;
            
            const timeStr = `${h.toString().padStart(2, '0')}:${newMinutes.padStart(2, '0')}`;
            onChange(`${dateStr} ${timeStr}`);
        }
    };

    // Generate years from 1900 to current year + 10
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1930 + 11 }, (_, i) => 1930 + i);

    // Arabic month names
    const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];

    const handleMonthChange = (monthIndex: string) => {
        const newDate = new Date(month);
        newDate.setMonth(parseInt(monthIndex));
        setMonth(newDate);
    };

    const handleYearChange = (year: string) => {
        const newDate = new Date(month);
        newDate.setFullYear(parseInt(year));
        setMonth(newDate);
    };

    return (
        <Popover modal={modal}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? (
                        showTime ? (
                            <span>
                                {format(selectedDate!, "PPP", { locale: ar })} {hours}:{minutes} {period === 'AM' ? 'صباحاً' : 'مساءً'}
                            </span>
                        ) : (
                            format(selectedDate!, "PPP", { locale: ar })
                        )
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                <div className="p-3 border-b">
                    <div className="flex gap-2" dir="rtl">
                        <Select
                            value={month.getMonth().toString()}
                            onValueChange={handleMonthChange}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                                {months.map((monthName, index) => (
                                    <SelectItem key={index} value={index.toString()}>
                                        {monthName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={month.getFullYear().toString()}
                            onValueChange={handleYearChange}
                        >
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] z-[10000]">
                                {years.reverse().map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleSelect}
                    month={month}
                    onMonthChange={setMonth}
                    initialFocus
                    locale={ar}
                    dir="rtl"
                />
                {showTime && (
                    <div className="p-3 border-t">
                        <div className="flex gap-2 items-center justify-center" dir="rtl">
                            <div className="flex flex-col gap-1 items-center">
                                <label className="text-xs text-muted-foreground text-center">الدقيقة</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={minutes}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setMinutes(val);
                                        if (val !== '' && parseInt(val) >= 0 && parseInt(val) <= 59) {
                                            handleTimeChange(hours, val, period);
                                        }
                                    }}
                                    className="w-14 px-2 py-1 text-center border rounded-md"
                                    placeholder="00"
                                />
                            </div>
                            <span className="text-xl font-bold mt-5">:</span>
                            <div className="flex flex-col gap-1 items-center">
                                <label className="text-xs text-muted-foreground text-center">الساعة</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={hours}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                            setHours(val);
                                            if (val !== '' && parseInt(val) >= 1 && parseInt(val) <= 12) {
                                                handleTimeChange(val, minutes, period);
                                            }
                                    }}
                                    className="w-14 px-2 py-1 text-center border rounded-md"
                                    placeholder="12"
                                />
                            </div>
                            <div className="flex flex-col gap-1 items-center ms-2">
                                <label className="text-xs text-muted-foreground text-center opacity-0">م</label>
                                <div className="flex border rounded-md overflow-hidden h-[34px]">
                                    <button
                                        type="button"
                                        className={cn("px-2 text-xs transition-colors", period === 'AM' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                                        onClick={() => { setPeriod('AM'); handleTimeChange(hours, minutes, 'AM'); }}
                                    >
                                        ص
                                    </button>
                                    <button
                                        type="button"
                                        className={cn("px-2 text-xs transition-colors", period === 'PM' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                                        onClick={() => { setPeriod('PM'); handleTimeChange(hours, minutes, 'PM'); }}
                                    >
                                        م
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
