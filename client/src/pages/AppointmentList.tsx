import { useState, useMemo } from "react";
import React from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppointmentWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeButton } from "@/components/ui/home-button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, useIsAdmin, useIsAdminStaff, useIsTherapist } from "@/hooks/use-auth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AppointmentList() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdminOrStaff = useIsAdminStaff();
  const isTherapistUser = useIsTherapist();
  const [selectedAppointments, setSelectedAppointments] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("date"); // "date", "therapist", "type"
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedAppointments, setExpandedAppointments] = useState<string[]>([]);

  // Fetch appointments
  const { data: allAppointments, isLoading, error } = useQuery<AppointmentWithDetails[]>({
    queryKey: ['/api/appointments'],
  });
  
  // Filtrer les rendez-vous en fonction du rôle de l'utilisateur
  const appointments = useMemo(() => {
    if (!allAppointments) return undefined;
    
    // Si l'utilisateur est un thérapeute, on ne montre que ses propres rendez-vous
    if (user && user.role === 'therapist' && user.therapistId) {
      console.log("Filtrage des rendez-vous pour le thérapeute ID:", user.therapistId);
      return allAppointments.filter(appointment => {
        const match = appointment.therapistId === user.therapistId;
        // Log pour débogage
        if (match) {
          console.log("Rendez-vous inclus:", appointment.id, "therapistId:", appointment.therapistId);
        }
        return match;
      });
    }
    
    // Sinon (pour admin et secrétariat), on montre tous les rendez-vous
    return allAppointments;
  }, [allAppointments, user]);

  // Delete single appointment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/appointments/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Rendez-vous annulé",
        description: "Le rendez-vous a été annulé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le rendez-vous. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    },
  });
  
  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return await apiRequest(`/api/appointments/${id}`, "PUT", { status });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Statut mis à jour",
        description: `Le statut du rendez-vous a été modifié avec succès en "${getStatusLabel(data.status)}".`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut du rendez-vous. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    }
  });

  // Delete multiple appointments mutation
  const deleteMultipleMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest('/api/appointments', "DELETE", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Rendez-vous annulés",
        description: `${selectedAppointments.length} rendez-vous ont été annulés avec succès.`,
      });
      setSelectedAppointments([]);
      setSelectMode(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler les rendez-vous sélectionnés. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    },
  });

  const handleNewAppointment = () => {
    setLocation("/");
  };
  
  const handleViewSchedule = () => {
    setLocation("/schedule");
  };

  const handleCancelAppointment = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) {
      deleteMutation.mutate(id);
    }
  };
  
  // Fonction pour changer le statut d'un rendez-vous
  // Mutation pour la mise à jour automatique des statuts
  const statusChangeMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number, status: string }) => {
      return await apiRequest(`/api/appointments/${appointmentId}`, "PUT", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour automatique du statut:", error);
    }
  });

  // Vérifier et mettre à jour automatiquement les statuts des rendez-vous passés
  React.useEffect(() => {
    if (appointments) {
      const now = new Date();
      const appointmentsToUpdate = appointments.filter(appointment => {
        // Vérifie si le rendez-vous est "En attente" et si sa date/heure est déjà passée
        if (appointment.status !== "pending") return false;
        
        const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
        return appointmentDateTime < now;
      });
      
      // Mise à jour automatique des statuts pour les rendez-vous passés
      appointmentsToUpdate.forEach(appointment => {
        statusChangeMutation.mutate({ 
          appointmentId: appointment.id, 
          status: "completed"
        });
      });
    }
  }, [appointments]);

  const handleStatusChange = (id: number, status: string) => {
    // Récupère l'appointment concerné
    const appointment = appointments?.find(a => a.id === id);
    if (!appointment) return;
    
    // Vérifier si le rendez-vous est lié à une récurrence
    const isRecurringChild = appointment.parentAppointmentId !== null;
    const isRecurringParent = appointment.isRecurring && appointment.relatedAppointments && appointment.relatedAppointments.length > 0;
    
    // Procéder avec la mise à jour du statut
    updateStatusMutation.mutate({ id, status });
  };

  const toggleAppointmentSelection = (id: number) => {
    if (selectedAppointments.includes(id)) {
      setSelectedAppointments(selectedAppointments.filter(appointmentId => appointmentId !== id));
    } else {
      setSelectedAppointments([...selectedAppointments, id]);
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      // Si on quitte le mode sélection, on efface les sélections
      setSelectedAppointments([]);
    }
  };

  const selectAllAppointments = () => {
    if (appointments && appointments.length > 0) {
      if (selectedAppointments.length === appointments.length) {
        // Si tous sont déjà sélectionnés, désélectionner tout
        setSelectedAppointments([]);
      } else {
        // Sinon, sélectionner tous
        setSelectedAppointments(appointments.map(a => a.id));
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedAppointments.length === 0) {
      toast({
        title: "Attention",
        description: "Veuillez sélectionner au moins un rendez-vous à annuler.",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir annuler ${selectedAppointments.length} rendez-vous ?`)) {
      deleteMultipleMutation.mutate(selectedAppointments);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
      case "Confirmé":
        return "bg-green-100 text-green-800";
      case "pending":
      case "En attente":
        return "bg-green-100 text-green-800"; // Uniformisé en vert pour "En attente"
      case "cancelled":
      case "Annulé":
        return "bg-red-100 text-red-800";
      case "completed":
      case "Terminé":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmé";
      case "pending":
        return "En attente";
      case "cancelled":
        return "Annulé";
      case "completed":
        return "Terminé";
      default:
        return status;
    }
  };
  
  // Fonction pour déterminer le type de rendez-vous
  const getAppointmentType = (appointment: AppointmentWithDetails) => {
    if (appointment.isRecurring) {
      return "recurring";
    } else if (appointment.relatedAppointments && appointment.relatedAppointments.length > 0) {
      return "multiple";
    } else {
      return "single";
    }
  };
  
  // Fonction pour obtenir le libellé du type de rendez-vous
  const getAppointmentTypeLabel = (type: string) => {
    switch (type) {
      case "recurring":
        return "Récurrent";
      case "multiple":
        return "Multiple";
      case "single":
        return "Ponctuel";
      default:
        return type;
    }
  };
  
  // Grouper les rendez-vous récurrents
  const groupedAppointments = useMemo(() => {
    if (!appointments) return [];
    
    // Créer une map des parents et leurs enfants
    const parentMap = new Map<number, AppointmentWithDetails[]>();
    
    // Collecter tous les rendez-vous qui ont un parentAppointmentId
    appointments.forEach(appointment => {
      if (appointment.parentAppointmentId) {
        const parentId = appointment.parentAppointmentId;
        if (!parentMap.has(parentId)) {
          parentMap.set(parentId, []);
        }
        parentMap.get(parentId)?.push(appointment);
      }
    });
    
    // Filtrer les rendez-vous pour n'inclure que les parents ou les rendez-vous sans parent
    const filteredAppointments = appointments.filter(appointment => 
      !appointment.parentAppointmentId || 
      (appointment.parentAppointmentId && !appointments.some(a => a.id === appointment.parentAppointmentId))
    );
    
    // Ajouter les enfants à leurs parents respectifs
    filteredAppointments.forEach(appointment => {
      if (parentMap.has(appointment.id)) {
        appointment.relatedAppointments = parentMap.get(appointment.id)?.map(child => ({
          id: child.id,
          therapistName: child.therapistName,
          date: child.date,
          time: child.time,
          status: child.status
        }));
      }
    });
    
    return filteredAppointments;
  }, [appointments]);
  
  // Fonction pour trier les rendez-vous
  const sortAppointments = (appointments: AppointmentWithDetails[]) => {
    if (!appointments) return [];
    
    return [...appointments].sort((a, b) => {
      if (sortBy === "date") {
        // Convertir les dates en objets Date pour comparaison
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return sortOrder === "asc" 
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      } else if (sortBy === "therapist") {
        // Trier par nom du thérapeute
        return sortOrder === "asc"
          ? a.therapistName.localeCompare(b.therapistName)
          : b.therapistName.localeCompare(a.therapistName);
      } else if (sortBy === "type") {
        // Trier par type de rendez-vous
        const typeA = getAppointmentType(a);
        const typeB = getAppointmentType(b);
        return sortOrder === "asc"
          ? typeA.localeCompare(typeB)
          : typeB.localeCompare(typeA);
      }
      // Par défaut, trier par date de création
      return sortOrder === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <HomeButton />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cabinet Paramédical de la Renaissance</h1>
                {isTherapistUser && (
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                    Vue Thérapeute
                  </span>
                )}
                {isAdminOrStaff && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {user?.role === 'admin' ? 'Administrateur' : 'Secrétariat'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handleViewSchedule}
                className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="material-icons mr-2 text-sm">schedule</span>
                Emploi du temps
              </button>
              <button 
                onClick={handleNewAppointment}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="material-icons mr-2 text-sm">add</span>
                Nouveau rendez-vous
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  {isTherapistUser 
                    ? "Mes rendez-vous" 
                    : "Tous les rendez-vous"}
                </h2>
                <div className="flex space-x-2">
                  {selectMode && selectedAppointments.length > 0 && (
                    <button 
                      onClick={handleDeleteSelected}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      disabled={deleteMultipleMutation.isPending}
                    >
                      <span className="material-icons mr-2 text-sm">delete</span>
                      Annuler ({selectedAppointments.length})
                    </button>
                  )}
                  <button 
                    onClick={toggleSelectMode}
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      selectMode 
                        ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500" 
                        : "border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:ring-indigo-500"
                    }`}
                  >
                    <span className="material-icons mr-2 text-sm">{selectMode ? "cancel" : "checklist"}</span>
                    {selectMode ? "Annuler la sélection" : "Mode sélection"}
                  </button>
                  <button 
                    onClick={handleNewAppointment}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="material-icons mr-2 text-sm">add</span>
                    Nouveau rendez-vous
                  </button>
                </div>
              </div>
              
              {/* Options de tri */}
              {appointments && appointments.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-gray-700">Trier par :</span>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSortBy("date");
                        setSortOrder(sortOrder === "asc" && sortBy === "date" ? "desc" : "asc");
                      }}
                      className={`px-3 py-1 rounded-md text-sm flex items-center ${
                        sortBy === "date" ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      Date
                      {sortBy === "date" && (
                        <span className="material-icons ml-1 text-sm">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </button>
                    
                    {/* Afficher le filtre de thérapeute uniquement pour les administrateurs et le secrétariat */}
                    {isAdminOrStaff && (
                      <button 
                        onClick={() => {
                          setSortBy("therapist");
                          setSortOrder(sortOrder === "asc" && sortBy === "therapist" ? "desc" : "asc");
                        }}
                        className={`px-3 py-1 rounded-md text-sm flex items-center ${
                          sortBy === "therapist" ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        Thérapeute
                        {sortBy === "therapist" && (
                          <span className="material-icons ml-1 text-sm">
                            {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                          </span>
                        )}
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        setSortBy("type");
                        setSortOrder(sortOrder === "asc" && sortBy === "type" ? "desc" : "asc");
                      }}
                      className={`px-3 py-1 rounded-md text-sm flex items-center ${
                        sortBy === "type" ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      Type de rendez-vous
                      {sortBy === "type" && (
                        <span className="material-icons ml-1 text-sm">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-4 py-6 sm:px-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, idx) => (
                    <div key={idx} className="flex flex-col space-y-2">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                  Erreur lors du chargement des rendez-vous. Veuillez réessayer plus tard.
                </div>
              ) : groupedAppointments && groupedAppointments.length > 0 ? (
                <div className="flex flex-col">
                  <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {selectMode && (
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  <div className="flex items-center">
                                    <Checkbox 
                                      id="select-all" 
                                      checked={selectedAppointments.length > 0 && appointments && selectedAppointments.length === appointments.length}
                                      onCheckedChange={selectAllAppointments} 
                                      className="cursor-pointer" 
                                    />
                                  </div>
                                </th>
                              )}
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Patient
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thérapeute
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Heure
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Statut
                              </th>
                              <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sortAppointments(groupedAppointments).map((appointment) => {
                              const isRecurringParent = appointment.relatedAppointments && appointment.relatedAppointments.length > 0;
                              
                              return (
                                <React.Fragment key={appointment.id}>
                                  <tr className={selectedAppointments.includes(appointment.id) ? "bg-indigo-50" : ""}>
                                    {selectMode && (
                                      <td className="px-3 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <Checkbox 
                                            id={`select-appointment-${appointment.id}`} 
                                            checked={selectedAppointments.includes(appointment.id)} 
                                            onCheckedChange={() => toggleAppointmentSelection(appointment.id)}
                                            className="cursor-pointer"
                                          />
                                        </div>
                                      </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                          {appointment.patientName.split(" ").map(n => n[0]).join("").toUpperCase()}
                                        </div>
                                        <div className="ml-3">
                                          <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                                        <div className="text-sm font-medium text-gray-900">{appointment.therapistName}</div>
                                      </div>
                                      {appointment.notes && (
                                        <div className="text-xs text-gray-500 mt-1 italic">{appointment.notes}</div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <span className="material-icons text-blue-500 mr-1 text-sm">event</span>
                                        <div className="text-sm text-gray-900">{appointment.date}</div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <span className="material-icons text-green-500 mr-1 text-sm">schedule</span>
                                        <div className="text-sm text-gray-900">{appointment.time}</div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {(() => {
                                        const appointmentType = getAppointmentType(appointment);
                                        const badgeClass = 
                                          appointmentType === "recurring" 
                                            ? "bg-purple-100 text-purple-800"
                                            : appointmentType === "multiple"
                                              ? "bg-blue-100 text-blue-800"
                                              : "bg-gray-100 text-gray-800";
                                        
                                        return (
                                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
                                            {getAppointmentTypeLabel(appointmentType)}
                                          </span>
                                        );
                                      })()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {selectMode ? (
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                                          {getStatusLabel(appointment.status)}
                                        </span>
                                      ) : (
                                        <select
                                          value={appointment.status}
                                          onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${getStatusBadgeClass(appointment.status)}`}
                                        >
                                          <option value="pending" className="bg-white text-yellow-800">En attente</option>
                                          <option value="completed" className="bg-white text-blue-800">Terminé</option>
                                          <option value="cancelled" className="bg-white text-red-800">Annulé</option>
                                        </select>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      {selectMode ? (
                                        <button 
                                          onClick={() => toggleAppointmentSelection(appointment.id)}
                                          className={`text-sm font-medium ${selectedAppointments.includes(appointment.id) ? "text-indigo-600 hover:text-indigo-900" : "text-gray-600 hover:text-gray-900"}`}
                                        >
                                          {selectedAppointments.includes(appointment.id) ? "Désélectionner" : "Sélectionner"}
                                        </button>
                                      ) : (
                                        <div className="flex items-center justify-end">
                                          {isRecurringParent && (
                                            <span className="mr-3 px-2 py-1 bg-blue-50 text-blue-800 text-xs rounded-full">
                                              {appointment.relatedAppointments?.length || 0} liés
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                  
                                  {isRecurringParent && (
                                    <tr>
                                      <td colSpan={selectMode ? 8 : 7} className="p-0">
                                        <Accordion 
                                          type="single" 
                                          collapsible 
                                          className="border-0"
                                          value={expandedAppointments.includes(`appointment-${appointment.id}`) ? `appointment-${appointment.id}` : ""}
                                          onValueChange={(value) => {
                                            if (value) {
                                              setExpandedAppointments([...expandedAppointments, value]);
                                            } else {
                                              setExpandedAppointments(expandedAppointments.filter(id => id !== `appointment-${appointment.id}`));
                                            }
                                          }}
                                        >
                                          <AccordionItem value={`appointment-${appointment.id}`} className="border-0">
                                            <AccordionTrigger className="py-2 px-6 text-sm font-medium bg-gray-50 hover:bg-gray-100 hover:no-underline text-gray-800">
                                              {expandedAppointments.includes(`appointment-${appointment.id}`) ? 'Masquer' : 'Afficher'} les rendez-vous liés ({appointment.relatedAppointments?.length || 0})
                                            </AccordionTrigger>
                                            <AccordionContent className="px-6 py-2 bg-gray-50">
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                                {appointment.relatedAppointments?.map((related) => (
                                                  <div key={related.id} className="p-2 bg-white rounded border border-gray-200 flex justify-between items-center">
                                                    <div>
                                                      <div className="font-medium">{related.therapistName}</div>
                                                      <div className="text-xs text-gray-500">{related.date} - {related.time}</div>
                                                    </div>
                                                    <select
                                                      value={related.status || "pending"}
                                                      onChange={(e) => handleStatusChange(related.id, e.target.value)}
                                                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${getStatusBadgeClass(related.status || "pending")}`}
                                                    >
                                                      <option value="pending" className="bg-white text-yellow-800">En attente</option>
                                                      <option value="completed" className="bg-white text-blue-800">Terminé</option>
                                                      <option value="cancelled" className="bg-white text-red-800">Annulé</option>
                                                    </select>
                                                  </div>
                                                ))}
                                              </div>
                                            </AccordionContent>
                                          </AccordionItem>
                                        </Accordion>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Aucun rendez-vous trouvé</p>
                  <Button onClick={handleNewAppointment} className="bg-primary">
                    <span className="material-icons mr-2 text-sm">add</span>
                    Prendre un rendez-vous
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
