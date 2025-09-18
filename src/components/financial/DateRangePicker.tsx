import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react";
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

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  onDateRangeChange: (range: DateRange) => void;
  initialRange?: DateRange;
}

export function DateRangePicker({ onDateRangeChange, initialRange }: DateRangePickerProps) {
  const [dateRange, setDateRange] = useState<DateRange>(
    initialRange || {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }
  );
  const [tempDateRange, setTempDateRange] = useState<DateRange>(dateRange);
  const [selectedPreset, setSelectedPreset] = useState("current-month");
  const [isCustom, setIsCustom] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const presets = [
    {
      label: "Este mês",
      value: "current-month",
      range: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      },
    },
    {
      label: "Mês passado",
      value: "last-month",
      range: {
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1)),
      },
    },
    {
      label: "Últimos 3 meses",
      value: "last-3-months",
      range: {
        from: startOfMonth(subMonths(new Date(), 2)),
        to: endOfMonth(new Date()),
      },
    },
    {
      label: "Últimos 6 meses",
      value: "last-6-months",
      range: {
        from: startOfMonth(subMonths(new Date(), 5)),
        to: endOfMonth(new Date()),
      },
    },
    {
      label: "Este ano",
      value: "current-year",
      range: {
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(new Date().getFullYear(), 11, 31),
      },
    },
    {
      label: "Período personalizado",
      value: "custom",
      range: dateRange,
    },
  ];

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value === "custom") {
      setIsCustom(true);
      setTempDateRange(dateRange);
      return;
    }

    setIsCustom(false);
    setIsPopoverOpen(false);
    const preset = presets.find(p => p.value === value);
    if (preset) {
      setDateRange(preset.range);
      setTempDateRange(preset.range);
      onDateRangeChange(preset.range);
    }
  };

  const handleApplyCustomRange = () => {
    setDateRange(tempDateRange);
    onDateRangeChange(tempDateRange);
    setIsPopoverOpen(false);
  };

  const handleCancelCustomRange = () => {
    setTempDateRange(dateRange);
    setIsPopoverOpen(false);
  };

  const isRangeChanged = tempDateRange.from?.getTime() !== dateRange.from?.getTime() || 
                        tempDateRange.to?.getTime() !== dateRange.to?.getTime();

  const formatDateRange = (range: DateRange) => {
    if (selectedPreset !== "custom") {
      const preset = presets.find(p => p.value === selectedPreset);
      return preset?.label || "";
    }
    return `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustom && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange ? formatDateRange(dateRange) : "Selecione o período"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempDateRange?.from}
                selected={{
                  from: tempDateRange?.from,
                  to: tempDateRange?.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setTempDateRange({ from: range.from, to: range.to });
                  } else if (range?.from && !range?.to) {
                    setTempDateRange({ from: range.from, to: range.from });
                  }
                }}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t">
                <div className="text-sm text-muted-foreground">
                  {tempDateRange.from && tempDateRange.to ? 
                    `${format(tempDateRange.from, "dd/MM/yyyy")} - ${format(tempDateRange.to, "dd/MM/yyyy")}` 
                    : "Selecione as datas"
                  }
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelCustomRange}>
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleApplyCustomRange}
                    disabled={!tempDateRange.from || !tempDateRange.to}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {!isCustom && selectedPreset !== "custom" && (
        <div className="text-sm text-muted-foreground px-3 py-2 border rounded-md bg-muted">
          {formatDateRange(dateRange)}
        </div>
      )}
    </div>
  );
}