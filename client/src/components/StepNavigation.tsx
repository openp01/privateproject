import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { BookingFormData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  formData: BookingFormData;
}

export default function StepNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  formData
}: StepNavigationProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Validation for "Next" button
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return !!formData.patient;
      case 2:
        return !!formData.therapist;
      case 3:
        return !!formData.date && !!formData.time;
      default:
        return true;
    }
  };
  
  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!formData.patient || !formData.therapist || !formData.date || !formData.time) {
        throw new Error("Informations manquantes pour créer le rendez-vous");
      }
      
      const appointmentData = {
        patientId: formData.patient.id,
        therapistId: formData.therapist.id,
        date: formData.date,
        time: formData.time,
        status: "confirmed",
        isRecurring: formData.isRecurring || false,
        recurringFrequency: formData.recurringFrequency,
        recurringCount: formData.recurringCount,
      };
      
      return await apiRequest("/api/appointments", "POST", appointmentData);
    },
    onSuccess: () => {
      toast({
        title: "Rendez-vous confirmé",
        description: "Votre rendez-vous a été créé avec succès",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      // Redirect to appointments list
      setTimeout(() => {
        setLocation("/appointments");
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du rendez-vous",
        variant: "destructive",
      });
    },
  });
  
  const handleConfirm = () => {
    createAppointmentMutation.mutate();
  };
  
  return (
    <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
      <div className="flex justify-between">
        {currentStep > 1 ? (
          <Button
            variant="outline"
            onClick={onPrevious}
            className="inline-flex items-center"
          >
            <span className="material-icons mr-2 text-sm">arrow_back</span>
            Précédent
          </Button>
        ) : (
          <div></div>
        )}
        
        <div>
          {currentStep < totalSteps ? (
            <Button
              onClick={onNext}
              disabled={!canGoNext()}
              className="inline-flex items-center bg-primary"
            >
              Suivant
              <span className="material-icons ml-2 text-sm">arrow_forward</span>
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={createAppointmentMutation.isPending}
              className="inline-flex items-center bg-green-600 hover:bg-green-700"
            >
              {createAppointmentMutation.isPending ? "Traitement..." : "Confirmer le rendez-vous"}
              <span className="material-icons ml-2 text-sm">check</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
