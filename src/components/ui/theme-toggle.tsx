import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ThemeToggle({ 
  className, 
  variant = "ghost", 
  size = "icon" 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        "relative transition-all duration-300 hover:scale-105",
        "border border-border/50 hover:border-border",
        "bg-background/80 backdrop-blur-sm",
        "hover:bg-accent/80 hover:text-accent-foreground",
        className
      )}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <div className="relative flex items-center justify-center">
        <Sun
          className={cn(
            "h-4 w-4 transition-all duration-300",
            theme === 'dark' 
              ? "rotate-90 scale-0 opacity-0" 
              : "rotate-0 scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            theme === 'dark' 
              ? "rotate-0 scale-100 opacity-100" 
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </div>
    </Button>
  );
}