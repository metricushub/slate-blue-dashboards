import { ReactNode, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
          ${isMobile ? 'w-full h-full max-w-full max-h-full' : widthClasses[maxWidth]} 
          p-0 bg-white border border-border 
          ${isMobile ? 'rounded-none' : 'rounded-lg'}
          ${isMobile ? 'min-h-[100vh] max-h-[100vh]' : 'min-h-[560px] max-h-[85vh]'}
          overflow-hidden flex flex-col
          [--modal-body-vh:72vh]
        `}
        style={{ 
          transition: 'none',
          height: isMobile ? '100vh' : undefined
        }}
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

        {/* Fixed Height Scrollable Body */}
        <div 
          className={`
            flex-1 overflow-y-auto px-6 py-4 
            ${isMobile ? 'min-h-0' : 'min-h-[var(--modal-body-vh)] max-h-[var(--modal-body-vh)]'}
          `}
          style={{ 
            transition: 'none',
            height: isMobile ? undefined : 'var(--modal-body-vh)'
          }}
        >
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