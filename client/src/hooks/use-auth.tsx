import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, UserRole } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types pour les données d'authentification
type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  role: string;
  therapistId?: number;
};

// Type pour le contexte d'authentification
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

// Création du contexte d'authentification
export const AuthContext = createContext<AuthContextType | null>(null);

// Provider pour le contexte d'authentification
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Récupérer les informations de l'utilisateur connecté
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Mutation pour la connexion
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      return await apiRequest("/api/auth/login", "POST", credentials);
    },
    onSuccess: (user: User) => {
      console.log("Authentification réussie avec l'utilisateur:", user);
      
      // Forcer une requête pour obtenir les informations utilisateur après la connexion
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Stocker les données utilisateur dans le cache de React Query
      queryClient.setQueryData(["/api/auth/user"], user);
      console.log("Données utilisateur stockées dans le cache");
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${user.username}!`,
      });
      
      // Pause pour laisser le temps à l'interface de se mettre à jour
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Erreur de connexion:", error);
      toast({
        title: "Échec de la connexion",
        description: error.message || "Identifiants incorrects",
        variant: "destructive",
      });
    },
  });

  // Mutation pour l'inscription
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      return await apiRequest("/api/auth/register", "POST", userData);
    },
    onSuccess: (user: User) => {
      console.log("Inscription réussie avec l'utilisateur:", user);
      
      // Forcer une requête pour obtenir les informations utilisateur après l'inscription
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Stocker les données utilisateur dans le cache
      queryClient.setQueryData(["/api/auth/user"], user);
      
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès",
      });
      
      // Pause pour laisser le temps à l'interface de se mettre à jour
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Erreur d'inscription:", error);
      toast({
        title: "Échec de l'inscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour la déconnexion
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/auth/logout", "POST");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      // Rediriger vers la page d'authentification après la déconnexion
      window.location.href = "/auth";
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt!",
      });
    },
    onError: (error: Error) => {
      console.error("Erreur de déconnexion:", error);
      toast({
        title: "Échec de la déconnexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}

// Hook pour vérifier si l'utilisateur a un rôle spécifique
export function useHasRole(roles: string[]) {
  const { user } = useAuth();
  return user && roles.includes(user.role);
}

// Hook pour vérifier si l'utilisateur est un administrateur
export function useIsAdmin() {
  return useHasRole([UserRole.ADMIN]);
}

// Hook pour vérifier si l'utilisateur est un membre du personnel administratif
export function useIsAdminStaff() {
  return useHasRole([UserRole.ADMIN, UserRole.SECRETARIAT]);
}

// Hook pour vérifier si l'utilisateur est un thérapeute
export function useIsTherapist() {
  return useHasRole([UserRole.THERAPIST]);
}