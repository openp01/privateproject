import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { UserRole, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, UserX, User as UserIcon, ShieldAlert, UserCog } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function UserAdminPage() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  // Récupération de la liste des utilisateurs
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/auth/users"],
    queryFn: () => apiRequest<User[]>("/api/auth/users"),
    enabled: !!isAdmin,
  });

  // Mutation pour désactiver un utilisateur
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest<{success: boolean; message: string}>(`/api/auth/deactivate-user/${userId}`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users"] });
      toast({
        title: "Compte désactivé",
        description: "Le compte utilisateur a été désactivé avec succès.",
        variant: "default",
      });
      setShowDeactivateDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la désactivation du compte.",
        variant: "destructive",
      });
    },
  });

  // Gérer l'ouverture du dialog de désactivation
  const handleDeactivateClick = (user: User) => {
    setUserToDeactivate(user);
    setShowDeactivateDialog(true);
  };

  // Gérer la désactivation effective
  const confirmDeactivate = () => {
    if (userToDeactivate) {
      deactivateUserMutation.mutate(userToDeactivate.id);
    }
  };

  // Formater l'affichage du rôle
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <Badge variant="destructive" className="flex items-center">
            <ShieldAlert className="mr-1 h-3 w-3" />
            Administrateur
          </Badge>
        );
      case UserRole.SECRETARIAT:
        return (
          <Badge variant="secondary" className="flex items-center">
            <UserCog className="mr-1 h-3 w-3" />
            Secrétariat
          </Badge>
        );
      case UserRole.THERAPIST:
        return (
          <Badge variant="outline" className="flex items-center">
            <UserIcon className="mr-1 h-3 w-3" />
            Thérapeute
          </Badge>
        );
      default:
        return role;
    }
  };

  // Si l'utilisateur n'est pas admin, afficher un message d'erreur
  if (!isAdmin) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Accès refusé</CardTitle>
            <CardDescription>
              Vous n'avez pas les droits nécessaires pour accéder à cette page. Seuls les administrateurs peuvent gérer les utilisateurs.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Gestion des utilisateurs</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            Gérez les comptes des utilisateurs de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleDisplay(user.role)}</TableCell>
                    <TableCell>
                      {user.lastLogin 
                        ? `Il y a ${formatDistanceToNow(new Date(user.lastLogin), { locale: fr })}`
                        : "Jamais connecté"}
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge className="bg-green-500">Actif</Badge>
                      ) : (
                        <Badge variant="destructive">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {user.isActive && (
                            <DropdownMenuItem 
                              onClick={() => handleDeactivateClick(user)}
                              className="text-red-500"
                              disabled={user.id === (window as any).currentUser?.id} // Empêcher de désactiver son propre compte
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Désactiver le compte
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation pour désactiver un utilisateur */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désactiver le compte utilisateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir désactiver le compte de {userToDeactivate?.username} ? 
              Cette action empêchera l'utilisateur de se connecter à la plateforme.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeactivateDialog(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeactivate}
              disabled={deactivateUserMutation.isPending}
            >
              {deactivateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Désactivation...
                </>
              ) : (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Désactiver le compte
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}