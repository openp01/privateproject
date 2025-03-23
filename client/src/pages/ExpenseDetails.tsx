import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftIcon, PencilIcon, TrashIcon, FileIcon, ExternalLinkIcon, ImageIcon, FileTextIcon } from "lucide-react";
import type { Expense } from "@shared/schema";
import { HomeButton } from "@/components/ui/home-button";
import { 
  getFileNameFromUrl, 
  isImageFile, 
  isPdfFile, 
  openPdfInNewTab, 
  getSafeDisplayUrl,
  isExternalUrl 
} from "@/lib/fileUploadService";

export default function ExpenseDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Récupération des détails de la dépense
  const { data: expense, isLoading } = useQuery({
    queryKey: ["/api/expenses", parseInt(id)],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/expenses/${id}`) as Expense;
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails de la dépense",
          variant: "destructive",
        });
        navigate("/expenses");
        return null;
      }
    },
  });

  // Suppression d'une dépense
  const deleteExpenseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/expenses/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Dépense supprimée",
        description: "La dépense a été supprimée avec succès",
      });
      navigate("/expenses");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la dépense",
        variant: "destructive",
      });
    },
  });

  const handleDeleteExpense = () => {
    deleteExpenseMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dépense non trouvée</h1>
          <Button onClick={() => navigate("/expenses")}>
            Retour à la liste des dépenses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <HomeButton variant="outline" />
          <Button
            variant="outline"
            onClick={() => navigate("/expenses")}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Détails de la Dépense</h1>
            <p className="text-muted-foreground">
              {expense.description}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate(`/expenses/edit/${expense.id}`)}>
              <PencilIcon className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action ne peut pas être annulée. Cette dépense sera définitivement supprimée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteExpense}>
                    {deleteExpenseMutation.isPending ? (
                      <span className="flex items-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Suppression...
                      </span>
                    ) : (
                      "Supprimer définitivement"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations de la Dépense</CardTitle>
              <CardDescription>Détails complets de la dépense</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="mt-1">{expense.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Montant</h3>
                  <p className="mt-1 text-xl font-bold">{parseFloat(expense.amount.toString()).toFixed(2)} €</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                  <p className="mt-1">
                    {format(new Date(expense.date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Catégorie</h3>
                  <Badge variant="outline" className="mt-1">
                    {expense.category}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Méthode de paiement</h3>
                  <p className="mt-1">{expense.paymentMethod}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date d'ajout</h3>
                  <p className="mt-1">
                    {format(new Date(expense.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>

              {expense.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    <p className="mt-1 whitespace-pre-line">{expense.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Justificatif</CardTitle>
              <CardDescription>Document associé à cette dépense</CardDescription>
            </CardHeader>
            <CardContent>
              {expense.receiptUrl ? (
                <div className="text-center">
                  <div className="border rounded-md p-4 mb-4">
                    {expense.receiptUrl && isExternalUrl(expense.receiptUrl) ? (
                      <ExternalLinkIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                    ) : expense.receiptUrl && isImageFile(getFileNameFromUrl(expense.receiptUrl)) ? (
                      <ImageIcon className="h-16 w-16 mx-auto text-primary" />
                    ) : expense.receiptUrl && isPdfFile(getFileNameFromUrl(expense.receiptUrl)) ? (
                      <FileTextIcon className="h-16 w-16 mx-auto text-primary" />
                    ) : (
                      <FileIcon className="h-16 w-16 mx-auto text-primary" />
                    )}
                    <p className="text-sm mt-2 font-medium">
                      {expense.receiptUrl && !isExternalUrl(expense.receiptUrl) 
                        ? getFileNameFromUrl(expense.receiptUrl) 
                        : expense.receiptUrl && isExternalUrl(expense.receiptUrl)
                        ? "Fichier externe (non disponible)"
                        : "Justificatif"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {expense.receiptUrl && isImageFile(getFileNameFromUrl(expense.receiptUrl)) && !isExternalUrl(expense.receiptUrl)
                        ? "Image" 
                        : expense.receiptUrl && isPdfFile(getFileNameFromUrl(expense.receiptUrl)) && !isExternalUrl(expense.receiptUrl)
                        ? "Document PDF"
                        : expense.receiptUrl && isExternalUrl(expense.receiptUrl)
                        ? "URL externe"
                        : "Document"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {expense.receiptUrl && 
                      isImageFile(getFileNameFromUrl(expense.receiptUrl)) && 
                      !isExternalUrl(expense.receiptUrl) && (
                      <div className="border rounded-md p-2 overflow-hidden">
                        <img 
                          src={getSafeDisplayUrl(expense.receiptUrl)} 
                          alt="Aperçu du justificatif" 
                          className="max-h-[200px] object-contain w-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    {expense.receiptUrl && isPdfFile(getFileNameFromUrl(expense.receiptUrl)) && (
                      <div className="border rounded-md p-2 text-center">
                        <p className="text-sm text-muted-foreground mb-2">Les PDF ne peuvent pas être prévisualisés ici</p>
                        <FileTextIcon className="h-10 w-10 mx-auto text-primary mb-2" />
                        <p className="text-xs text-muted-foreground">
                          Cliquez sur le bouton ci-dessous pour ouvrir le PDF dans un nouvel onglet
                        </p>
                      </div>
                    )}
                    {expense.receiptUrl && isPdfFile(getFileNameFromUrl(expense.receiptUrl)) && !isExternalUrl(expense.receiptUrl) ? (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => openPdfInNewTab(expense.receiptUrl!)}
                      >
                        <ExternalLinkIcon className="mr-2 h-4 w-4" />
                        Ouvrir le PDF
                      </Button>
                    ) : expense.receiptUrl && !isExternalUrl(expense.receiptUrl) ? (
                      <a
                        href={getSafeDisplayUrl(expense.receiptUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center w-full"
                      >
                        <Button variant="outline" className="w-full">
                          <ExternalLinkIcon className="mr-2 h-4 w-4" />
                          {expense.receiptUrl && isImageFile(getFileNameFromUrl(expense.receiptUrl))
                            ? "Voir l'image en taille réelle"
                            : "Voir le justificatif"}
                        </Button>
                      </a>
                    ) : expense.receiptUrl && isExternalUrl(expense.receiptUrl) ? (
                      <div className="text-center p-2 border rounded-md bg-muted/20">
                        <p className="text-sm text-muted-foreground mb-2">Le fichier original n'est plus disponible</p>
                        <p className="text-xs text-muted-foreground">
                          Vous pouvez ajouter un nouveau justificatif en modifiant cette dépense
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucun justificatif disponible</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ajoutez un justificatif en modifiant cette dépense
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}