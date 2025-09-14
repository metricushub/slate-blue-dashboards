import { Link } from "react-router-dom";
import logoImage from "@/assets/metricus-logo.png";

interface BrandLogoProps {
  showText?: boolean;
  className?: string;
  textClassName?: string;
  linkTo?: string;
}

export function BrandLogo({ 
  showText = true, 
  className = "", 
  textClassName = "",
  linkTo = "/"
}: BrandLogoProps) {
  const appName = "Metricus Hub";

  const content = (
    <div className={`flex items-center gap-3 transition-colors hover:opacity-80 ${className}`}>
      <img 
        src={logoImage} 
        alt={`${appName} logo`}
        className="h-8 w-8 shrink-0"
      />
      {showText && (
        <span className={`font-semibold text-foreground ${textClassName}`}>
          {appName}
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link 
        to={linkTo} 
        className="inline-flex"
        aria-label={`Ir para ${linkTo === "/" ? "página inicial" : linkTo}`}
      >
        {content}
      </Link>
    );
  }

  return content;
}