import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { InvoiceWithDetails, Therapist } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import InvoiceActions from "@/components/InvoiceActions";
import InvoiceNotesDialog from "@/components/InvoiceNotesDialog";
import { HomeButton } from "@/components/ui/home-button";

export default function Invoices() {
  const [selectedTherapist, setSelectedTherapist] = useState<string>('all');
  const [, setLocation] = useLocation();
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Récupérer toutes les factures avec option de rafraîchissement
  const { data: invoices, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      // Ajout d'un timestamp pour éviter la mise en cache par le navigateur
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/invoices?_=${timestamp}`, {
        cache: "no-store"
      });
      if (!response.ok) throw new Error("Erreur lors du chargement des factures");
      return response.json() as Promise<InvoiceWithDetails[]>;
    },
    refetchOnWindowFocus: true
  });
  
  // Récupérer tous les thérapeutes pour le filtre
  const { data: therapists } = useQuery({
    queryKey: ["/api/therapists"],
    queryFn: async () => {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/therapists?_=${timestamp}`, {
        cache: "no-store"
      });
      if (!response.ok) throw new Error("Erreur lors du chargement des thérapeutes");
      return response.json() as Promise<Therapist[]>;
    }
  });
  
  // Mutation pour mettre à jour le statut de la facture
  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: number, status: string }) => {
      return apiRequest<any>(
        `/api/invoices/${invoiceId}`,
        "PUT",
        { status }
      );
    },
    onSuccess: async (_, variables) => {
      // Invalider le cache et forcer un rechargement des factures
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      // Si la facture est marquée comme payée, créer automatiquement un paiement
      if (variables.status === "Payée") {
        try {
          await createPaymentFromInvoice.mutateAsync({ invoiceId: variables.invoiceId });
        } catch (err) {
          console.error("Erreur lors de la création du paiement:", err);
          // On continue car la mise à jour du statut est réussie même si la création du paiement échoue
        }
      }
      
      // Effectuer un refetch manuel avec un indicateur visuel
      setIsRefreshing(true);
      setTimeout(async () => {
        try {
          await refetch();
        } catch (err) {
          console.error("Erreur lors du rechargement des factures:", err);
        } finally {
          setIsRefreshing(false);
        }
      }, 300); // Petit délai pour permettre à l'API de traiter la requête
      
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la facture a été mis à jour avec succès.",
        variant: "default",
      });
      setSelectedInvoice(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation pour créer un paiement à partir d'une facture
  const createPaymentFromInvoice = useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: number }) => {
      return apiRequest<any>(
        `/api/create-payment-from-invoice/${invoiceId}`,
        "POST"
      );
    },
    onSuccess: () => {
      // Invalider le cache des paiements pour les actualiser si la page des paiements est ouverte
      queryClient.invalidateQueries({ queryKey: ["/api/therapist-payments"] });
      
      toast({
        title: "Paiement créé",
        description: "Un paiement pour le thérapeute a été automatiquement créé.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Attention",
        description: "La facture a été marquée comme payée, mais la création du paiement a échoué.",
        // Utiliser destructive comme fallback pour les erreurs
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Factures</CardTitle>
            <CardDescription>Chargement des factures...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
            <CardDescription>Une erreur est survenue lors du chargement des factures</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Filtrer les factures par thérapeute si nécessaire
  const filteredInvoices = selectedTherapist === 'all' 
    ? invoices
    : invoices?.filter(invoice => invoice.therapistId === parseInt(selectedTherapist));

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Factures</CardTitle>
            <CardDescription>Gestion des factures pour les séances thérapeutiques</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await refetch();
                  toast({
                    title: "Actualisation",
                    description: "Les factures ont été rechargées.",
                  });
                } catch (err) {
                  toast({
                    title: "Erreur",
                    description: "Échec de l'actualisation des factures.",
                    variant: "destructive"
                  });
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualisation...
                </>
              ) : (
                "Actualiser"
              )}
            </Button>
            <HomeButton variant="default" />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Label htmlFor="therapist-filter">Filtrer par thérapeute:</Label>
              <Select
                value={selectedTherapist}
                onValueChange={setSelectedTherapist}
              >
                <SelectTrigger id="therapist-filter" className="w-[250px]">
                  <SelectValue placeholder="Tous les thérapeutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les thérapeutes</SelectItem>
                  {therapists?.map((therapist: Therapist) => (
                    <SelectItem key={therapist.id} value={therapist.id.toString()}>
                      {therapist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Table>
            <TableCaption>Liste des factures émises</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">N° Facture</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Thérapeute</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Aucune facture trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.issueDate}</TableCell>
                    <TableCell>{invoice.patientName}</TableCell>
                    <TableCell>{invoice.therapistName}</TableCell>
                    <TableCell>{invoice.totalAmount}€</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          invoice.status === "Payée" 
                            ? "success"
                            : invoice.status === "En attente" 
                              ? "outline" 
                              : "destructive"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <InvoiceActions 
                        invoiceId={invoice.id} 
                        invoiceNumber={invoice.invoiceNumber} 
                      />
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert(`Détails de la facture ${invoice.invoiceNumber} pour la séance du ${invoice.appointmentDate} à ${invoice.appointmentTime}`)}
                      >
                        Détails
                      </Button>

                      <InvoiceNotesDialog 
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoiceNumber}
                        currentNotes={invoice.notes || ""}
                      />
                      
                      {invoice.status === "En attente" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                              onClick={() => setSelectedInvoice(invoice)}
                            >
                              Marquer payée
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer le paiement</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir marquer la facture {invoice.invoiceNumber} comme payée ?
                                Cette action ne peut pas être annulée et créera automatiquement un paiement
                                pour le thérapeute {invoice.therapistName}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  updateInvoiceStatus.mutate({
                                    invoiceId: invoice.id,
                                    status: "Payée"
                                  });
                                }}
                                disabled={updateInvoiceStatus.isPending}
                              >
                                {updateInvoiceStatus.isPending && invoice.id === selectedInvoice?.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Traitement...
                                  </>
                                ) : "Confirmer"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Total: {filteredInvoices?.length || 0} facture(s)
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}