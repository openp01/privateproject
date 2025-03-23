import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// Propriétés attendues pour le composant ProtectedRoute
interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  roles?: string[]; // Rôles autorisés pour accéder à cette route
}

export function ProtectedRoute({
  path,
  component: Component,
  roles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Lors du chargement, afficher un spinner
  if (isLoading) {
    return (
      <Route path={path}>
        {() => (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </Route>
    );
  }

  // Vérifier si l'utilisateur est authentifié
  if (!user) {
    console.log("ProtectedRoute: Utilisateur non authentifié, redirection vers /auth");
    return (
      <Route path={path}>
        {() => <Redirect to="/auth" />}
      </Route>
    );
  }
  
  console.log("ProtectedRoute: Utilisateur authentifié", user);

  // Vérifier les rôles si spécifiés
  if (roles && !roles.includes(user.role)) {
    return (
      <Route path={path}>
        {() => (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-2xl font-bold text-red-500 mb-4">
              Accès refusé
            </h1>
            <p className="text-center text-gray-600">
              Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
            </p>
          </div>
        )}
      </Route>
    );
  }

  // Si toutes les vérifications sont passées, rendre le composant
  return (
    <Route path={path}>
      {(params) => <Component {...params} />}
    </Route>
  );
}