import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HomeButton } from "@/components/ui/home-button";
import { TherapistPaymentWithDetails, Therapist } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Printer, Calendar, Eye } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import PaymentsPreviewDialog from "@/components/PaymentsPreviewDialog";

export default function Payments() {
  // Récupération de tous les paiements
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/therapist-payments"],
    queryFn: () => apiRequest<TherapistPaymentWithDetails[]>("/api/therapist-payments")
  });

  // Récupération de tous les thérapeutes pour le filtre
  const { data: therapists } = useQuery({
    queryKey: ["/api/therapists"],
    queryFn: () => apiRequest<Therapist[]>("/api/therapists")
  });

  // État pour filtrer par thérapeute
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null);

  // Filtrer les paiements par thérapeute si un thérapeute est sélectionné
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    if (!selectedTherapistId || selectedTherapistId === 'all') return payments;
    return payments.filter(payment => payment.therapistId.toString() === selectedTherapistId);
  }, [payments, selectedTherapistId]);

  // Calcul du montant total des paiements
  const totalAmount = useMemo(() => {
    if (!filteredPayments.length) return 0;
    return filteredPayments.reduce((total, payment) => total + Number(payment.amount), 0);
  }, [filteredPayments]);

  // Formater un montant en euros
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numAmount);
  };

  // Formater une date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };

  // États pour le filtre de date
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("RELEVÉ DES PAIEMENTS AUX THÉRAPEUTES");
  
  // État pour le thérapeute sélectionné dans la fenêtre d'exportation
  const [exportTherapistId, setExportTherapistId] = useState<string | null>(null);
  
  // Fonction pour exporter les paiements en PDF
  const exportPaymentsToPDF = () => {
    // Construire l'URL avec les paramètres
    let url = "/api/therapist-payments/export/pdf";
    const params = new URLSearchParams();
    
    // Paramètres de date
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    
    // Paramètre du thérapeute (priorité à la sélection dans la boîte de dialogue d'exportation)
    const therapistIdToUse = exportTherapistId || (selectedTherapistId !== "all" ? selectedTherapistId : null);
    
    if (therapistIdToUse) {
      params.append("therapistId", therapistIdToUse);
      
      // Si nous avons un nom de thérapeute disponible, l'ajouter au titre
      const therapist = therapists?.find(t => t.id.toString() === therapistIdToUse);
      if (therapist) {
        params.append("title", `RELEVÉ DES PAIEMENTS - ${therapist.name}`);
      }
    } else if (customTitle !== "RELEVÉ DES PAIEMENTS AUX THÉRAPEUTES") {
      // Utiliser le titre personnalisé si aucun thérapeute n'est sélectionné
      params.append("title", customTitle);
    }
    
    // Ajouter les paramètres à l'URL
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    // Ouvrir une nouvelle fenêtre pour télécharger le PDF
    window.open(url, "_blank");
    
    // Réinitialiser la sélection pour la prochaine exportation
    setExportTherapistId(null);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Paiements aux Thérapeutes</h1>
          <p className="text-muted-foreground">
            Suivi des paiements effectués aux thérapeutes
          </p>
        </div>
        <div className="flex gap-2">
          {/* Bouton de prévisualisation */}
          <PaymentsPreviewDialog 
            startDate={startDate} 
            endDate={endDate} 
            therapistId={selectedTherapistId || undefined}
            customTitle={selectedTherapistId && therapists ? 
              `RELEVÉ DES PAIEMENTS - ${therapists.find(t => t.id.toString() === selectedTherapistId)?.name || ''}` : 
              undefined
            }
          >
            <Button variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Prévisualiser
            </Button>
          </PaymentsPreviewDialog>
          
          {/* Bouton d'export PDF */}
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Exporter PDF
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exporter les paiements en PDF</DialogTitle>
                <DialogDescription>
                  Personnalisez votre export pour le comptable
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Titre:</label>
                  <Input 
                    className="col-span-3" 
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Thérapeute:</label>
                  <div className="col-span-3">
                    <Select 
                      onValueChange={(value) => setExportTherapistId(value === "all" ? null : value)}
                      value={exportTherapistId || "all"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tous les thérapeutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les thérapeutes</SelectItem>
                        {therapists?.map((therapist) => (
                          <SelectItem key={therapist.id} value={therapist.id.toString()}>
                            {therapist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Date début:</label>
                  <Input 
                    className="col-span-3" 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Date fin:</label>
                  <Input 
                    className="col-span-3" 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => {
                    exportPaymentsToPDF();
                    setIsExportDialogOpen(false);
                  }}
                >
                  Exporter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <HomeButton />
        </div>
      </div>

      <div className="grid gap-6 mb-8">
        {/* Carte du total des paiements */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total des paiements</CardTitle>
            <CardDescription>
              Montant total des paiements {selectedTherapistId ? "pour ce thérapeute" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalAmount)}</div>
          </CardContent>
        </Card>

        {/* Filtre par thérapeute */}
        <div className="flex gap-4 items-center">
          <span className="font-medium">Filtrer par thérapeute:</span>
          <Select 
            onValueChange={(value) => setSelectedTherapistId(value)}
            value={selectedTherapistId || "all"}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Tous les thérapeutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les thérapeutes</SelectItem>
              {therapists?.map((therapist) => (
                <SelectItem key={therapist.id} value={therapist.id.toString()}>
                  {therapist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tableau des paiements */}
        <Card>
          <CardContent className="pt-6">
            {paymentsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun paiement trouvé
              </div>
            ) : (
              <Table>
                <TableCaption>Liste des paiements aux thérapeutes</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro de facture</TableHead>
                    <TableHead>Thérapeute</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date de paiement</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Référence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <Badge variant="outline">{payment.invoiceNumber}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{payment.therapistName}</TableCell>
                      <TableCell>{payment.patientName}</TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>{payment.paymentReference || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Ajouter les imports manquants
import { useState, useMemo } from "react";