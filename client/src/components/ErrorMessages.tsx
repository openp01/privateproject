import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

interface ErrorMessagesProps {
  message: string;
  title?: string;
  variant?: "destructive" | "default";
}

export default function ErrorMessage({ 
  message, 
  title = "Erreur", 
  variant = "destructive" 
}: ErrorMessagesProps) {
  return (
    <Alert variant={variant} className="mb-4">
      {variant === "destructive" ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Info className="h-4 w-4" />
      )}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Composant spécifique pour les erreurs de suppression de rendez-vous
 */
export function AppointmentDeleteError({ message }: { message: string }) {
  return (
    <ErrorMessage
      title="Suppression impossible"
      message={message || "Ce rendez-vous ne peut pas être supprimé."}
    />
  );
}

/**
 * Composant spécifique pour les erreurs de conflit d'horaire
 */
export function ScheduleConflictError({ message }: { message: string }) {
  return (
    <ErrorMessage
      title="Conflit d'horaire"
      message={message || "Ce créneau est déjà réservé."}
    />
  );
}

/**
 * Composant spécifique pour les messages d'information
 */
export function InfoMessage({ message, title = "Information" }: { message: string, title?: string }) {
  return (
    <ErrorMessage
      title={title}
      message={message}
      variant="default"
    />
  );
}