import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  format, parse, addDays, addMonths, subMonths, 
  startOfWeek, eachDayOfInterval, endOfWeek, isSameDay, 
  startOfMonth, endOfMonth, getMonth, getYear 
} from "date-fns";
import { fr } from "date-fns/locale";
import { Appointment, AppointmentWithDetails, Therapist, UserRole } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export default function TherapistSchedule() {
  const [location, setLocation] = useLocation();
  const [selectedTherapist, setSelectedTherapist] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [monthDates, setMonthDates] = useState<Date[]>([]);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  
  // Obtenir les informations de l'utilisateur connecté
  const { user } = useAuth();
  
  // Time slots
  const timeSlots = [
    "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", 
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  // Week days in French
  const weekDaysFull = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  // Fetch therapists - pour un thérapeute, on filtre pour n'afficher que lui-même
  const { data: allTherapists, isLoading: isLoadingTherapists } = useQuery<Therapist[]>({
    queryKey: ['/api/therapists'],
  });
  
  // Filtrer la liste des thérapeutes en fonction du rôle utilisateur
  const therapists = useMemo(() => {
    if (user && user.role === UserRole.THERAPIST && user.therapistId && allTherapists) {
      // Pour un thérapeute, ne renvoyer que sa propre information
      return allTherapists.filter(therapist => therapist.id === user.therapistId);
    }
    return allTherapists;
  }, [allTherapists, user]);

  // Fetch appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<AppointmentWithDetails[]>({
    queryKey: ['/api/appointments'],
    enabled: selectedTherapist !== null,
  });

  useEffect(() => {
    // Si l'utilisateur est un thérapeute, on sélectionne automatiquement son ID
    if (user && user.role === UserRole.THERAPIST && user.therapistId) {
      setSelectedTherapist(user.therapistId);
    }
    // Sinon, on sélectionne le premier thérapeute disponible
    else if (therapists && therapists.length > 0 && !selectedTherapist) {
      setSelectedTherapist(therapists[0].id);
    }
  }, [therapists, user]);

  useEffect(() => {
    // Mettre à jour les dates de la semaine
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    setWeekDates(days);

    // Mettre à jour les dates du mois
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    let firstDay = startOfWeek(monthStart, { weekStartsOn: 1 });
    
    // Si le premier jour du mois est déjà un lundi, on prend la semaine précédente pour avoir un calendrier plus complet
    if (firstDay.getTime() === monthStart.getTime()) {
      firstDay = addDays(firstDay, -7);
    }
    
    // On s'assure d'avoir 6 semaines pour un affichage uniforme
    const lastDay = addDays(endOfWeek(monthEnd, { weekStartsOn: 1 }), 7);
    const monthDays = eachDayOfInterval({ start: firstDay, end: lastDay });
    setMonthDates(monthDays);
  }, [currentDate]);

  // Navigation par semaine
  const handlePrevWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };
  
  // Navigation par mois
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  // Changer le mode d'affichage (semaine ou mois)
  const handleViewModeChange = (mode: "week" | "month") => {
    setViewMode(mode);
  };

  const handleTherapistChange = (value: string) => {
    setSelectedTherapist(parseInt(value));
  };

  const handleNewAppointment = () => {
    setLocation("/");
  };

  const handleViewAppointments = () => {
    setLocation("/appointments");
  };

  const isAppointmentScheduled = (date: Date, time: string, therapistId: number) => {
    if (!appointments) return false;
    
    const formattedDate = format(date, 'dd/MM/yyyy');
    
    // Log pour débogage
    console.log("Vérification RDV pour: ", { date: formattedDate, time, therapistId });
    
    const scheduled = appointments.some(app => {
      const match = app.therapistId === therapistId && 
                    app.date === formattedDate && 
                    app.time === time;
      
      if (match) {
        console.log("RDV trouvé:", app.id, "pour thérapeute:", app.therapistId);
      }
      
      return match;
    });
    
    return scheduled;
  };

  const getAppointmentDetails = (date: Date, time: string, therapistId: number) => {
    if (!appointments) return null;
    
    const formattedDate = format(date, 'dd/MM/yyyy');
    
    return appointments.find(app => 
      app.therapistId === therapistId && 
      app.date === formattedDate && 
      app.time === time
    );
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Cabinet Paramédical de la Renaissance</h1>
            <div className="flex space-x-2">
              <button 
                onClick={handleNewAppointment}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="material-icons mr-2 text-sm">add</span>
                Nouveau rendez-vous
              </button>
              <button 
                onClick={handleViewAppointments}
                className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="material-icons mr-2 text-sm">calendar_today</span>
                Liste des rendez-vous
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
              <div className="flex justify-between items-center flex-wrap">
                <h2 className="text-lg font-medium text-gray-900">
                  {user?.role === UserRole.THERAPIST 
                    ? "Mon emploi du temps" 
                    : "Emploi du temps des thérapeutes"}
                </h2>
                {/* Therapist selector - visible only for admin and secretary */}
                {user?.role !== UserRole.THERAPIST && (
                  <div className="w-64 mt-2 sm:mt-0">
                    {isLoadingTherapists ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={selectedTherapist?.toString() || ""}
                        onValueChange={handleTherapistChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un thérapeute" />
                        </SelectTrigger>
                        <SelectContent>
                          {therapists?.map((therapist: Therapist) => (
                            <SelectItem key={therapist.id} value={therapist.id.toString()}>
                              {therapist.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              {/* View mode selector */}
              <div className="mb-6">
                <Tabs value={viewMode} onValueChange={(value) => handleViewModeChange(value as "week" | "month")}>
                  <TabsList className="grid grid-cols-2 w-[400px]">
                    <TabsTrigger value="week" className="flex items-center">
                      <span className="material-icons mr-2 text-sm">view_week</span>
                      Vue Semaine
                    </TabsTrigger>
                    <TabsTrigger value="month" className="flex items-center">
                      <span className="material-icons mr-2 text-sm">calendar_month</span>
                      Vue Mois
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Vue Semaine */}
                  <TabsContent value="week">
                    {/* Calendar Navigation - Week View */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          Semaine du {format(weekDates[0] || new Date(), 'dd MMMM', { locale: fr })}
                          {' au '}
                          {format(weekDates[6] || new Date(), 'dd MMMM yyyy', { locale: fr })}
                        </h4>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="p-2 rounded-full hover:bg-gray-100" 
                          onClick={handlePrevWeek}
                        >
                          <span className="material-icons">chevron_left</span>
                        </button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentDate(new Date())}
                          className="mx-1"
                        >
                          Aujourd'hui
                        </Button>
                        <button 
                          className="p-2 rounded-full hover:bg-gray-100"
                          onClick={handleNextWeek}
                        >
                          <span className="material-icons">chevron_right</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Weekly Calendar */}
                    {isLoadingAppointments ? (
                      <div className="space-y-4">
                        <Skeleton className="h-[600px] w-full" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Heures
                              </th>
                              {weekDates.map((date, index) => (
                                <th 
                                  key={index} 
                                  scope="col" 
                                  className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  style={{ minWidth: '100px' }}
                                >
                                  <div>{weekDaysFull[index]}</div>
                                  <div className="text-sm mt-1">{format(date, 'dd/MM', { locale: fr })}</div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {timeSlots.map((time, timeIndex) => (
                              <tr key={timeIndex} className={timeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {time}
                                </td>
                                {weekDates.map((date, dateIndex) => {
                                  const isScheduled = selectedTherapist ? 
                                    isAppointmentScheduled(date, time, selectedTherapist) : false;
                                  const appointment = selectedTherapist ? 
                                    getAppointmentDetails(date, time, selectedTherapist) : null;
                                  
                                  return (
                                    <td 
                                      key={dateIndex} 
                                      className="px-2 py-2 whitespace-nowrap text-xs border-l"
                                    >
                                      {isScheduled && appointment ? (
                                        <div className="bg-primary text-white p-1 rounded text-center overflow-hidden text-ellipsis">
                                          <div className="font-medium">{appointment.patientName}</div>
                                        </div>
                                      ) : (
                                        <div className="h-6"></div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Vue Mois */}
                  <TabsContent value="month">
                    {/* Calendar Navigation - Month View */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {format(currentDate, 'MMMM yyyy', { locale: fr }).charAt(0).toUpperCase() + 
                          format(currentDate, 'MMMM yyyy', { locale: fr }).slice(1)}
                        </h4>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="p-2 rounded-full hover:bg-gray-100" 
                          onClick={handlePrevMonth}
                        >
                          <span className="material-icons">chevron_left</span>
                        </button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentDate(new Date())}
                          className="mx-1"
                        >
                          Aujourd'hui
                        </Button>
                        <button 
                          className="p-2 rounded-full hover:bg-gray-100"
                          onClick={handleNextMonth}
                        >
                          <span className="material-icons">chevron_right</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Monthly Calendar */}
                    {isLoadingAppointments ? (
                      <div className="space-y-4">
                        <Skeleton className="h-[600px] w-full" />
                      </div>
                    ) : (
                      <div className="overflow-hidden">
                        <div className="grid grid-cols-7 gap-px bg-gray-200">
                          {/* En-têtes des jours de la semaine */}
                          {weekDaysFull.map((day, i) => (
                            <div key={i} className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                              {day.substring(0, 3)}
                            </div>
                          ))}
                          
                          {/* Cases du calendrier */}
                          {Array.from({ length: Math.ceil(monthDates.length / 7) }).map((_, weekIndex) => (
                            monthDates.slice(weekIndex * 7, weekIndex * 7 + 7).map((date, dayIndex) => {
                              const currentMonth = date.getMonth() === currentDate.getMonth();
                              const dayAppointments = appointments?.filter(app => {
                                if (!selectedTherapist) return false;
                                const appDate = parse(app.date, 'dd/MM/yyyy', new Date());
                                return app.therapistId === selectedTherapist && 
                                       isSameDay(appDate, date);
                              });
                              
                              return (
                                <div 
                                  key={`${weekIndex}-${dayIndex}`} 
                                  className={`bg-white h-28 p-1 overflow-hidden ${
                                    currentMonth ? 'text-gray-900' : 'text-gray-400 bg-gray-50'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium">
                                      {format(date, 'd')}
                                    </span>
                                    {isSameDay(date, new Date()) && (
                                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs">
                                        Auj.
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Liste des rendez-vous du jour */}
                                  <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                                    {dayAppointments && dayAppointments.length > 0 ? (
                                      dayAppointments.map((app, idx) => (
                                        <div 
                                          key={idx} 
                                          className="bg-primary text-white px-1 py-0.5 rounded text-xs overflow-hidden whitespace-nowrap text-ellipsis"
                                        >
                                          {app.time} - {app.patientName}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-xs text-gray-400">Aucun rendez-vous</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}