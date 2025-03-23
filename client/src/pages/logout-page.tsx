import { useEffect } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const { user, logoutMutation } = useAuth();

  useEffect(() => {
    if (user) {
      logoutMutation.mutate();
    }
  }, [user, logoutMutation]);

  if (logoutMutation.isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Déconnexion en cours...</p>
        </div>
      </div>
    );
  }

  return <Redirect to="/auth" />;
}