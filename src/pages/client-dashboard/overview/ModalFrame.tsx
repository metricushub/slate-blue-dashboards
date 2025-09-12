import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ModalFrameProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "4xl";
}

export function ModalFrame({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = "4xl" 
}: ModalFrameProps) {
  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "4xl": "max-w-4xl"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${widthClasses[maxWidth]} w-full p-0 bg-white border border-border`}>
        {/* Sticky Header */}
        <DialogHeader className="sticky top-0 bg-white border-b border-border px-6 py-4 md:px-8">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-foreground">
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-4 md:px-8 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 md:px-8">
            <div className="flex justify-end gap-3">
              {footer}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}