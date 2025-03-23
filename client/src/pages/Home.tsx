import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, FileText, WalletIcon, Plus, List, LineChart, ArrowLeft, CreditCard, LogOut, Pen, ScrollText } from "lucide-react";
import BookingForm from "@/components/BookingForm";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const { logoutMutation } = useAuth();
  const isAdmin = useIsAdmin();
  
  const handleNavigation = (path: string) => {
    setLocation(path);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
    // Redirection forcée après déconnexion
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fff9] to-[#e3f5e5]">
      {/* Date affichée en haut de la page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 text-right">
        <div className="text-sm text-[#266d2c]">
          {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>
      
      {/* Logo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6 flex flex-col items-center">
        <img src="/images/LaR_LOGO-Full.jpg" alt="Logo Cabinet Paramédical de la Renaissance" className="h-64 w-auto mb-4" />
        <p className="text-[#0d240f] mt-2 text-center font-medium">
          Système de gestion administratif
        </p>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showBookingForm ? (
          <div>
            <Button 
              variant="outline" 
              onClick={() => setShowBookingForm(false)}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
            <BookingForm />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Rendez-vous Card */}
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="bg-[#266d2c] text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Rendez-vous</CardTitle>
                    <CalendarDays className="h-8 w-8 text-white opacity-80" />
                  </div>
                  <CardDescription className="text-white opacity-90">
                    Gérer les rendez-vous des patients
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Planifiez de nouveaux rendez-vous et gérez le calendrier des consultations.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => setShowBookingForm(true)}
                    variant="default"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau rendez-vous
                  </Button>
                  <Button 
                    className="w-full" 
                    onClick={() => handleNavigation("/appointments")}
                    variant="outline"
                  >
                    <List className="h-4 w-4 mr-2" />
                    Liste des rendez-vous
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Emploi du temps Card */}
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="bg-[#266d2c] text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Emploi du temps</CardTitle>
                    <Clock className="h-8 w-8 text-white opacity-80" />
                  </div>
                  <CardDescription className="text-white opacity-90">
                    Planning des thérapeutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Consultez et organisez l'emploi du temps des thérapeutes du centre.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleNavigation("/schedule")}
                    variant="default"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Voir l'emploi du temps
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Factures Card */}
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="bg-[#266d2c] text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Factures</CardTitle>
                    <FileText className="h-8 w-8 text-white opacity-80" />
                  </div>
                  <CardDescription className="text-white opacity-90">
                    Gestion des factures clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Accédez aux factures, téléchargez-les au format PDF et envoyez-les par email.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleNavigation("/invoices")}
                    variant="default"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gérer les factures
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Dépenses Card */}
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="bg-[#266d2c] text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Dépenses</CardTitle>
                    <WalletIcon className="h-8 w-8 text-white opacity-80" />
                  </div>
                  <CardDescription className="text-white opacity-90">
                    Suivi des dépenses du cabinet
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Enregistrez et suivez les dépenses du cabinet avec justificatifs.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => handleNavigation("/expenses/new")}
                    variant="default"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle dépense
                  </Button>
                  <Button 
                    className="w-full" 
                    onClick={() => handleNavigation("/expenses")}
                    variant="outline"
                  >
                    <LineChart className="h-4 w-4 mr-2" />
                    Suivi des dépenses
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Paiements Card */}
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="bg-[#266d2c] text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Paiements</CardTitle>
                    <CreditCard className="h-8 w-8 text-white opacity-80" />
                  </div>
                  <CardDescription className="text-white opacity-90">
                    Suivi des paiements aux thérapeutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Suivez les paiements effectués aux thérapeutes et gérez leur rémunération.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleNavigation("/payments")}
                    variant="default"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Voir les paiements
                  </Button>
                </CardFooter>
              </Card>
              

              
              {/* Signatures Électroniques - visible uniquement pour les administrateurs */}
              {isAdmin && (
                <Card className="overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader className="bg-[#266d2c] text-white">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">Signatures Électroniques</CardTitle>
                      <Pen className="h-8 w-8 text-white opacity-80" />
                    </div>
                    <CardDescription className="text-white opacity-90">
                      Administration des signatures
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Gérez les signatures électroniques des thérapeutes pour les documents officiels.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleNavigation("/signatures")}
                      variant="default"
                    >
                      <Pen className="h-4 w-4 mr-2" />
                      Gérer les signatures
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
            
            <div className="mt-16 text-center text-sm text-[#266d2c]">
              <p>© 2025 Cabinet Paramédical de la Renaissance - Tous droits réservés</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
