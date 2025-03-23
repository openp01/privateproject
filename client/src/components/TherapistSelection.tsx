import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Therapist, BookingFormData } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label"; 
import { Check } from "lucide-react";

interface TherapistSelectionProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export default function TherapistSelection({ formData, updateFormData }: TherapistSelectionProps) {
  const { data: therapists, isLoading, error } = useQuery<Therapist[]>({
    queryKey: ['/api/therapists'],
  });
  
  // État local pour gérer la sélection multiple
  const [multipleSelection, setMultipleSelection] = useState(false);
  const selectedTherapists = formData.selectedTherapists || [];

  const handleSelectTherapist = (therapist: Therapist) => {
    if (!multipleSelection) {
      // Mode sélection unique - comportement original
      updateFormData({ 
        therapist, 
        selectedTherapists: [therapist],
        isMultipleTherapists: false
      });
    } else {
      // Mode sélection multiple
      const isAlreadySelected = selectedTherapists.some(t => t.id === therapist.id);
      let updatedSelection;
      
      if (isAlreadySelected) {
        // Retirer de la sélection
        updatedSelection = selectedTherapists.filter(t => t.id !== therapist.id);
      } else {
        // Ajouter à la sélection
        updatedSelection = [...selectedTherapists, therapist];
      }
      
      updateFormData({ 
        selectedTherapists: updatedSelection,
        // Définir le thérapeute principal comme le premier sélectionné
        therapist: updatedSelection.length > 0 ? updatedSelection[0] : undefined,
        isMultipleTherapists: true
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Choisir un thérapeute</h3>
      <p className="text-sm text-gray-500 mb-2">Sélectionnez le thérapeute avec lequel vous souhaitez prendre rendez-vous</p>
      
      <div className="flex items-center space-x-2 mb-6">
        <Switch 
          id="multipleSelection" 
          checked={multipleSelection}
          onCheckedChange={(checked) => {
            setMultipleSelection(checked);
            if (!checked && selectedTherapists.length > 1) {
              // Si on désactive la sélection multiple et qu'il y a plusieurs sélections,
              // on garde uniquement la première
              updateFormData({
                therapist: selectedTherapists[0],
                selectedTherapists: [selectedTherapists[0]],
                allowMultiplePerWeek: checked
              });
            }
            // Mise à jour de l'option pour permettre plusieurs rendez-vous par semaine
            updateFormData({ allowMultiplePerWeek: checked });
          }}
        />
        <Label htmlFor="multipleSelection" className="text-sm font-medium">
          Assigner plusieurs thérapeutes (suivi multiple)
        </Label>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, index) => (
            <Skeleton key={index} className="h-52 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-700">
          Erreur lors du chargement des thérapeutes. Veuillez réessayer plus tard.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {therapists?.map((therapist) => {
            // Vérifier si ce thérapeute est déjà sélectionné
            const isSelected = multipleSelection 
              ? selectedTherapists.some(t => t.id === therapist.id)
              : formData.therapist?.id === therapist.id;
              
            return (
              <div 
                key={therapist.id}
                className={`bg-white overflow-hidden shadow rounded-lg border hover:shadow-md transition-all cursor-pointer relative ${
                  isSelected ? 'border-primary ring-2 ring-primary/25' : 'border-gray-200'
                }`}
                onClick={() => handleSelectTherapist(therapist)}
              >
                {/* Badge de sélection */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-full p-3 ${
                      therapist.color ? `bg-[${therapist.color}]` : 
                      therapist.id === 1 ? 'bg-primary' : 
                      therapist.id === 2 ? 'bg-blue-400' : 'bg-purple-500'
                    }`}>
                      <span className="material-icons text-white">person</span>
                    </div>
                    <div className="ml-5">
                      <h4 className="text-lg font-medium text-gray-900">{therapist.name}</h4>
                      <p className="text-sm text-gray-500">Spécialité: {therapist.specialty}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Disponible: {therapist.availableDays}</p>
                    <p>Horaires: {therapist.workHours}</p>
                  </div>
                  <div className="mt-5">
                    <button 
                      className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                        isSelected ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-indigo-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      {isSelected ? (multipleSelection ? 'Sélectionné' : 'Sélectionné') : 'Sélectionner'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
