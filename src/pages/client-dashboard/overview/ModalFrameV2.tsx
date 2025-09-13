import { ReactNode, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import "@/styles/modal-guards.css";

interface ModalFrameV2Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "4xl";
  autoFocus?: boolean;
}

export function ModalFrameV2({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = "4xl",
  autoFocus = true 
}: ModalFrameV2Props) {
  const isMobile = useIsMobile();
  
  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "4xl": "max-w-4xl"
  };

  // Lock body scroll when modal is open and show toast
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Show toast notification about stabilized modals
      const timer = setTimeout(() => {
        import("@/hooks/use-toast").then(({ toast }) => {
          toast({
            title: "Modais estabilizados",
            description: "STATUS: PASS disponível em /diagnosticos.",
            duration: 3000
          });
        });
      }, 500);
      
      return () => {
        document.body.style.overflow = 'unset';
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`
          no-height-anim
          ${isMobile ? 'w-full h-full max-w-full max-h-full' : `${widthClasses[maxWidth]} h-[72vh]`} 
          p-0 bg-white border border-border 
          ${isMobile ? 'rounded-none' : 'rounded-lg'}
          min-h-[560px] max-h-[85vh]
          overflow-hidden flex flex-col
        `}
        aria-describedby={undefined}
      >
        {/* Sticky Header */}
        <DialogHeader className="sticky top-0 z-10 bg-white border-b border-border px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-foreground">
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Fechar modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 stable-modal-body [overflow-anchor:none]">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="sticky bottom-0 z-10 bg-white border-t border-border px-6 py-4 flex-shrink-0">
            <div className="flex justify-end gap-3">
              {footer}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}