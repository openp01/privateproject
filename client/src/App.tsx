import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/ui/navbar"; // Importation de la barre de navigation
import Home from "./pages/Home";
import AppointmentList from "./pages/AppointmentList";
import TherapistSchedule from "./pages/TherapistSchedule";
import AllTherapistsSchedule from "./pages/AllTherapistsSchedule";
import Invoices from "./pages/Invoices";
import ElectronicSignatures from "./pages/ElectronicSignatures";
import Expenses from "./pages/Expenses";
import ExpenseForm from "./pages/ExpenseForm";
import ExpenseDetails from "./pages/ExpenseDetails";
import EditExpenseForm from "./pages/EditExpenseForm";
import Payments from "./pages/Payments";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import LogoutPage from "./pages/logout-page";
import ProfilePage from "./pages/profile";
import UserAdminPage from "./pages/admin/users";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { UserRole } from "@shared/schema";

function Router() {
  return (
    <Switch>
      {/* Routes d'authentification - accessibles à tous */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/logout" component={LogoutPage} />
      
      {/* Routes protégées - requiert authentification */}
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/appointments" component={AppointmentList} />
      
      {/* Routes pour les thérapeutes et le personnel administratif */}
      <ProtectedRoute 
        path="/therapist-schedule" 
        component={TherapistSchedule} 
        roles={[UserRole.THERAPIST, UserRole.SECRETARIAT, UserRole.ADMIN]} 
      />
      <ProtectedRoute 
        path="/schedule" 
        component={AllTherapistsSchedule} 
        roles={[UserRole.THERAPIST, UserRole.SECRETARIAT, UserRole.ADMIN]} 
      />
      
      {/* Routes pour le personnel administratif uniquement */}
      <ProtectedRoute 
        path="/invoices" 
        component={Invoices} 
        roles={[UserRole.SECRETARIAT, UserRole.ADMIN]} 
      />

      <ProtectedRoute 
        path="/expenses" 
        component={Expenses} 
        roles={[UserRole.SECRETARIAT, UserRole.ADMIN]} 
      />
      <ProtectedRoute 
        path="/expenses/new" 
        component={ExpenseForm} 
        roles={[UserRole.SECRETARIAT, UserRole.ADMIN]} 
      />
      <ProtectedRoute 
        path="/expenses/edit/:id" 
        component={EditExpenseForm} 
        roles={[UserRole.SECRETARIAT, UserRole.ADMIN]} 
      />
      <ProtectedRoute 
        path="/expenses/:id" 
        component={ExpenseDetails} 
        roles={[UserRole.SECRETARIAT, UserRole.ADMIN]} 
      />
      <ProtectedRoute 
        path="/payments" 
        component={Payments} 
        roles={[UserRole.SECRETARIAT, UserRole.ADMIN]} 
      />
      {/* Route accessible uniquement à l'administrateur */}
      <ProtectedRoute 
        path="/signatures" 
        component={ElectronicSignatures} 
        roles={[UserRole.ADMIN]} 
      />
      
      {/* Route pour le profil utilisateur - Accessible à tous les utilisateurs authentifiés */}
      <ProtectedRoute 
        path="/profile" 
        component={ProfilePage} 
      />
      
      {/* Route pour la gestion des utilisateurs - Admin uniquement */}
      <ProtectedRoute 
        path="/admin/users" 
        component={UserAdminPage} 
        roles={[UserRole.ADMIN]} 
      />
      
      {/* Route 404 - accessible à tous */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col font-sans bg-gray-50">
        <Navbar /> {/* Ajout de la barre de navigation */}
        <div className="px-4 pt-16"> {/* Réduction du padding pour moins d'espace après la barre */}
          <Router />
        </div>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;
