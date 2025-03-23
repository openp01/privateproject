import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BookingFormData, TherapistSchedule } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface AppointmentConfirmationProps {
  formData: BookingFormData;
}

export default function AppointmentConfirmation({ formData }: AppointmentConfirmationProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { 
    patient, 
    therapist, 
    selectedTherapists, 
    date, 
    time, 
    isRecurring, 
    recurringFrequency, 
    recurringCount, 
    recurringDates,
    allowMultiplePerWeek,
    therapistSchedules,
    isMultipleTherapists: formMultipleTherapists,
    isMultipleTimeSlots,
    selectedTimeSlots
  } = formData;
  
  // Déterminer si nous sommes en mode multiple ou simple
  const isMultipleTherapists = allowMultiplePerWeek && selectedTherapists && selectedTherapists.length > 1;
  
  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!patient) {
        throw new Error("Informations du patient manquantes pour créer le rendez-vous");
      }
      
      // Mode créneaux multiples - un thérapeute, plusieurs créneaux horaires
      if (isMultipleTimeSlots && selectedTimeSlots && selectedTimeSlots.length > 0) {
        if (!therapist) {
          throw new Error("Thérapeute manquant pour créer le rendez-vous");
        }
        
        // Utiliser la nouvelle API pour créer plusieurs rendez-vous avec une seule facture
        const multipleAppointmentData = {
          patientId: patient.id,
          therapistId: therapist.id,
          slots: selectedTimeSlots,
        };
        
        // Appeler l'API pour créer plusieurs rendez-vous avec une seule facture
        return apiRequest("/api/appointments/multiple", "POST", multipleAppointmentData);
      }
      // Mode multi-thérapeutes - plusieurs thérapeutes, chacun avec son propre horaire
      else if (isMultipleTherapists && selectedTherapists) {
        // Créer tous les rendez-vous avec leurs horaires spécifiques
        const promises = selectedTherapists.map(therapist => {
          // Trouver l'horaire spécifique pour ce thérapeute
          const schedule = therapistSchedules?.find((s: TherapistSchedule) => s.therapistId === therapist.id);
          
          // Utiliser l'horaire spécifique s'il existe, sinon utiliser l'horaire par défaut
          const appointmentDate = schedule?.date || date;
          const appointmentTime = schedule?.time || time;
          
          // Vérifier que l'horaire est bien défini
          if (!appointmentDate || !appointmentTime) {
            console.warn(`Horaire manquant pour le thérapeute ${therapist.name}`);
            return Promise.resolve(null); // Ignorer ce thérapeute
          }
          
          // Nous devons gérer chaque thérapeute indépendamment pour les rendez-vous récurrents
          const appointmentData = {
            patientId: patient.id,
            therapistId: therapist.id,
            date: appointmentDate,
            time: appointmentTime,
            status: "confirmed",
            isRecurring: isRecurring || false,
            recurringFrequency: isRecurring ? recurringFrequency : undefined,
            recurringCount: isRecurring ? recurringCount : undefined,
          };
          
          return apiRequest("/api/appointments", "POST", appointmentData);
        });
        
        // Attendre que tous les rendez-vous soient créés
        return Promise.all(promises);
      } 
      // Mode standard - un seul thérapeute, un seul créneau
      else {
        if (!therapist || !date || !time) {
          throw new Error("Informations manquantes pour créer le rendez-vous");
        }
        
        const appointmentData = {
          patientId: patient.id,
          therapistId: therapist.id,
          date,
          time,
          status: "confirmed",
          isRecurring: isRecurring || false,
          recurringFrequency: recurringFrequency,
          recurringCount: recurringCount,
        };
        
        return await apiRequest("/api/appointments", "POST", appointmentData);
      }
    },
    onSuccess: () => {
      let title, description;
      
      // Mode créneaux multiples
      if (isMultipleTimeSlots && selectedTimeSlots && selectedTimeSlots.length > 0) {
        title = "Rendez-vous confirmés";
        description = `${selectedTimeSlots.length} créneaux horaires ont été réservés avec succès`;
      } 
      // Mode multi-thérapeutes
      else if (isMultipleTherapists && selectedTherapists && selectedTherapists.length > 1) {
        title = "Rendez-vous confirmés";
        description = `${selectedTherapists.length} rendez-vous ont été créés avec succès`;
      }
      // Mode standard
      else {
        title = "Rendez-vous confirmé";
        description = "Votre rendez-vous a été créé avec succès";
      }
      
      toast({
        title,
        description,
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
  
  // Vérification des informations requises en mode standard ou multiple
  const isMissingInfo = !patient || !date || !time || 
    (!isMultipleTherapists && !therapist) || 
    (isMultipleTherapists && (!selectedTherapists || selectedTherapists.length === 0));

  if (isMissingInfo) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="material-icons text-yellow-400">warning</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Informations manquantes. Veuillez remplir tous les champs requis.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="material-icons text-green-400">check_circle</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              {isMultipleTimeSlots && selectedTimeSlots && selectedTimeSlots.length > 0 ?
                `Vous êtes sur le point de réserver ${selectedTimeSlots.length} créneaux horaires.` :
                isMultipleTherapists && selectedTherapists ? 
                  `Vous êtes sur le point de créer ${selectedTherapists.length} rendez-vous simultanés.` :
                  "Vous êtes sur le point de confirmer votre rendez-vous."
              }
            </p>
          </div>
        </div>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-4">Résumé de votre rendez-vous</h3>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Détails du patient</h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Nom complet</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.firstName} {patient.lastName}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.email || "-"}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.phone || "-"}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Détails du rendez-vous</h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {isMultipleTherapists ? "Thérapeutes" : "Thérapeute"}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isMultipleTherapists && selectedTherapists ? (
                  <div>
                    <ul className="divide-y divide-gray-200">
                      {selectedTherapists.map((t, index) => (
                        <li key={t.id} className={index === 0 ? "" : "pt-2"}>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              t.color ? `bg-[${t.color}]` : 
                              index === 0 ? 'bg-primary' : 
                              index === 1 ? 'bg-blue-400' : 'bg-purple-500'
                            }`}></div>
                            {t.name}
                            {index === 0 && <span className="ml-2 text-xs font-medium text-gray-500">(principal)</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-amber-600 font-medium">
                      Mode multi-thérapeutes activé. Un rendez-vous sera créé pour chaque thérapeute.
                    </p>
                  </div>
                ) : (
                  <>{therapist && therapist.name}</>
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Date et heure</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isMultipleTherapists && selectedTherapists && therapistSchedules && therapistSchedules.some((s: TherapistSchedule) => s.date && s.time) ? (
                  <div className="space-y-2">
                    <p className="text-sm text-amber-600 font-semibold mb-3">Horaires spécifiques par thérapeute :</p>
                    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thérapeute</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedTherapists.map((therapist, index) => {
                            const schedule = therapistSchedules.find((s: TherapistSchedule) => s.therapistId === therapist.id);
                            const scheduleDate = schedule?.date || date;
                            const scheduleTime = schedule?.time || time;
                            
                            return (
                              <tr key={therapist.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-2 ${
                                      therapist.color ? `bg-[${therapist.color}]` : 'bg-primary'
                                    }`}></div>
                                    <span className="font-medium text-gray-900">{therapist.name}</span>
                                    {index === 0 && <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Principal</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {scheduleDate}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {scheduleTime}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center bg-blue-50 px-3 py-2 rounded-md">
                    <span className="material-icons text-blue-500 mr-2">event</span>
                    <span className="font-medium">{date} à {time}</span>
                  </div>
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isMultipleTimeSlots && selectedTimeSlots && selectedTimeSlots.length > 0
                  ? `Créneaux multiples (${selectedTimeSlots.length} créneaux)`
                  : isRecurring 
                    ? `Rendez-vous récurrent (${recurringCount} séances)`
                    : "Rendez-vous unique"
                }
              </dd>
            </div>
            
            {/* Affichage des créneaux multiples sélectionnés */}
            {isMultipleTimeSlots && selectedTimeSlots && selectedTimeSlots.length > 0 && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Créneaux sélectionnés</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedTimeSlots.map((slot, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 mr-2">
                                  <span className="text-xs font-semibold">{index + 1}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {slot.date}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {slot.time}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-green-600 font-medium">
                    Mode multi-créneaux activé. {selectedTimeSlots.length} rendez-vous seront créés pour le même thérapeute.
                  </p>
                </dd>
              </div>
            )}
            
            {isRecurring && recurringDates && recurringDates.length > 0 && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Séances planifiées</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Séance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date et heure</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recurringDates.map((dateTime, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 mr-2">
                                  <span className="text-xs font-semibold">{index + 1}</span>
                                </div>
                                <span className="text-sm text-gray-900">
                                  {index === 0 ? 'Première séance' : `Séance ${index + 1}`}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <span className="material-icons text-xs text-blue-500 mr-2">event</span>
                                <span>{dateTime}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      {/* Bouton de confirmation */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => createAppointmentMutation.mutate()}
          disabled={createAppointmentMutation.isPending}
        >
          {createAppointmentMutation.isPending ? (
            <>
              <span className="animate-spin inline-block h-4 w-4 border-t-2 border-white rounded-full mr-2"></span>
              Création en cours...
            </>
          ) : isMultipleTimeSlots && selectedTimeSlots && selectedTimeSlots.length > 0 ? (
            <>Confirmer {selectedTimeSlots.length} créneaux</>
          ) : isMultipleTherapists && selectedTherapists && selectedTherapists.length > 0 ? (
            <>Confirmer {selectedTherapists.length} rendez-vous</>
          ) : (
            <>Confirmer le rendez-vous</>
          )}
        </button>
      </div>
    </div>
  );
}
