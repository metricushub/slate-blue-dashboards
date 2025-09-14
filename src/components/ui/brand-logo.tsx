import React from 'react';
import { NavLink } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import logoIcon from "@/assets/logo-icon.png";

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
  showText?: boolean;
}

export function BrandLogo({ collapsed = false, className = "", showText = true }: BrandLogoProps) {
  const LogoContent = () => (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
        <img 
          src={logoIcon} 
          alt="Metricus Hub" 
          className="h-6 w-6 object-contain"
        />
      </div>
      {showText && !collapsed && (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm leading-tight">Metricus</span>
          <span className="text-xs text-muted-foreground leading-tight">Hub</span>
        </div>
      )}
    </div>
  );

  if (collapsed && showText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink to="/" className="block p-2 hover:bg-accent rounded-lg transition-colors">
              <LogoContent />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Metricus Hub</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <NavLink to="/" className="block p-2 hover:bg-accent rounded-lg transition-colors">
      <LogoContent />
    </NavLink>
  );
}