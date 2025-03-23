import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

interface ConflictInfo {
  patientId: number;
  patientName: string;
  message: string;
}

interface ConflictDisplayProps {
  conflictInfo: ConflictInfo | undefined;
  onClose?: () => void;
  showViewPatientLink?: boolean;
}

export default function ConflictDisplay({ 
  conflictInfo, 
  onClose,
  showViewPatientLink = true
}: ConflictDisplayProps) {
  if (!conflictInfo) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <div className="flex justify-between items-start w-full">
        <div>
          <AlertTitle>Conflit de rendez-vous</AlertTitle>
          <AlertDescription>
            {conflictInfo.message}
            {showViewPatientLink && conflictInfo.patientId && (
              <div className="mt-2">
                <Link href={`/patients/${conflictInfo.patientId}`}>
                  <Button variant="outline" size="sm">
                    Voir la fiche patient
                  </Button>
                </Link>
              </div>
            )}
          </AlertDescription>
        </div>
        {onClose && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-destructive-foreground"
          >
            Fermer
          </Button>
        )}
      </div>
    </Alert>
  );
}