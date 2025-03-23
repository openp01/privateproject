import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Home } from "lucide-react";

interface HomeButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function HomeButton({ className, variant = "outline" }: HomeButtonProps) {
  const [_, setLocation] = useLocation();

  const handleHomeClick = () => {
    setLocation("/");
  };

  return (
    <Button
      variant={variant}
      onClick={handleHomeClick}
      className={className}
      size="sm"
    >
      <Home className="h-4 w-4 mr-2" />
      Accueil
    </Button>
  );
}