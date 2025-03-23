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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AllTherapistsSchedule() {
  const [location, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [monthDates, setMonthDates] = useState<Date[]>([]);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const { toast } = useToast();
  
  // Obtenir les informations de l'utilisateur connecté
  const { user } = useAuth();
  
  // Time slots
  const timeSlots = [
    "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", 
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  // Week days in French
  const weekDaysFull = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  // Fetch therapists
  const { data: therapists, isLoading: isLoadingTherapists } = useQuery<Therapist[]>({
    queryKey: ['/api/therapists'],
  });

  // Fetch all appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<AppointmentWithDetails[]>({
    queryKey: ['/api/appointments'],
  });

  // Couleurs pour chaque thérapeute (palette verte)
  const therapistColors = useMemo(() => {
    const baseColors = [
      "#3fb549", // Vert principal
      "#266d2c", // Vert foncé
      "#8cd392", // Vert clair
      "#0d240f", // Vert très foncé
      "#60c268", // Vert moyen
      "#a3dca8", // Vert très clair
      "#1e5923", // Vert foncé alternatif
      "#4bc555", // Vert vif
    ];
    
    const colors: Record<number, string> = {};
    
    if (therapists) {
      therapists.forEach((therapist, index) => {
        colors[therapist.id] = baseColors[index % baseColors.length];
      });
    }
    
    return colors;
  }, [therapists]);

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

  const handleNewAppointment = () => {
    setLocation("/");
  };

  const handleViewAppointments = () => {
    setLocation("/appointments");
  };

  const handleViewTherapistSchedule = () => {
    setLocation("/therapist-schedule");
  };

  // Obtenir tous les rendez-vous pour une date et heure spécifiques
  const getAppointmentsForTimeSlot = (date: Date, time: string) => {
    if (!appointments) return [];
    
    const formattedDate = format(date, 'dd/MM/yyyy');
    
    return appointments.filter(app => 
      app.date === formattedDate && 
      app.time === time
    );
  };

  // Générer une légende des thérapeutes avec leurs couleurs associées
  const renderTherapistLegend = () => {
    if (!therapists || therapists.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mb-4 mt-2">
        {therapists.map(therapist => (
          <Badge 
            key={therapist.id}
            className="text-white"
            style={{ backgroundColor: therapistColors[therapist.id] }}
          >
            {therapist.name}
          </Badge>
        ))}
      </div>
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
                onClick={handleViewTherapistSchedule}
                className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="material-icons mr-2 text-sm">person</span>
                Vue par thérapeute
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
                  Planning complet du cabinet (tous les thérapeutes)
                </h2>
              </div>
              {renderTherapistLegend()}
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
                    {isLoadingAppointments || isLoadingTherapists ? (
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
                                  const slotAppointments = getAppointmentsForTimeSlot(date, time);
                                  
                                  return (
                                    <td 
                                      key={dateIndex} 
                                      className="px-2 py-2 whitespace-nowrap text-xs border-l"
                                    >
                                      <div className="flex flex-col space-y-1">
                                        {slotAppointments.length > 0 ? (
                                          slotAppointments.map(appointment => (
                                            <TooltipProvider key={appointment.id}>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <div 
                                                    className="text-white p-1 rounded text-center overflow-hidden text-ellipsis"
                                                    style={{ backgroundColor: therapistColors[appointment.therapistId] }}
                                                  >
                                                    <div className="font-medium truncate">{appointment.patientName}</div>
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <div>
                                                    <div><strong>Patient:</strong> {appointment.patientName}</div>
                                                    <div><strong>Thérapeute:</strong> {appointment.therapistName}</div>
                                                    <div><strong>Date:</strong> {appointment.date}</div>
                                                    <div><strong>Heure:</strong> {appointment.time}</div>
                                                  </div>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          ))
                                        ) : (
                                          <div className="h-6"></div>
                                        )}
                                      </div>
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
                    {isLoadingAppointments || isLoadingTherapists ? (
                      <div className="space-y-4">
                        <Skeleton className="h-[600px] w-full" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <div className="grid grid-cols-7 gap-px bg-gray-200">
                          {/* Calendar header - Jours de la semaine */}
                          {weekDaysFull.map((day, i) => (
                            <div key={i} className="bg-gray-50 p-2 text-center">
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{day}</div>
                            </div>
                          ))}
                          
                          {/* Calendar body - Jours du mois */}
                          {monthDates.map((date, i) => {
                            const isOtherMonth = getMonth(date) !== getMonth(currentDate);
                            const isToday = isSameDay(date, new Date());
                            
                            // Récupérer tous les rendez-vous pour cette date
                            const dateAppointments = !appointments ? [] : appointments.filter(app => {
                              const [day, month, year] = app.date.split('/').map(Number);
                              const appDate = new Date(year, month - 1, day);
                              return isSameDay(appDate, date);
                            });
                            
                            // Grouper les RDV par thérapeute pour cette date
                            const therapistAppointments: Record<number, number> = {};
                            dateAppointments.forEach(app => {
                              therapistAppointments[app.therapistId] = (therapistAppointments[app.therapistId] || 0) + 1;
                            });
                            
                            return (
                              <div 
                                key={i} 
                                className={`
                                  bg-white min-h-[100px] p-1 border-b border-r
                                  ${isOtherMonth ? 'bg-gray-50 text-gray-400' : ''}
                                  ${isToday ? 'bg-blue-50' : ''}
                                `}
                              >
                                <div className="flex justify-between items-start">
                                  <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : ''}`}>
                                    {format(date, 'd')}
                                  </span>
                                </div>
                                
                                {/* Rendez-vous du jour */}
                                <div className="mt-1 space-y-1">
                                  {Object.entries(therapistAppointments).map(([therapistId, count]) => {
                                    const therapist = therapists?.find(t => t.id === Number(therapistId));
                                    if (!therapist) return null;
                                    
                                    return (
                                      <TooltipProvider key={therapistId}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div 
                                              className="text-white text-xs p-1 rounded text-center"
                                              style={{ backgroundColor: therapistColors[Number(therapistId)] }}
                                            >
                                              <div className="font-medium truncate">
                                                {therapist.name}: {count} RDV
                                              </div>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div>
                                              <strong>{therapist.name}</strong>: {count} rendez-vous
                                              <ul className="mt-1">
                                                {dateAppointments
                                                  .filter(app => app.therapistId === Number(therapistId))
                                                  .map(app => (
                                                    <li key={app.id} className="text-xs">
                                                      {app.time} - {app.patientName}
                                                    </li>
                                                  ))
                                                }
                                              </ul>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
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