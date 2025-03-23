import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Therapist } from '@shared/schema';

interface PaymentsPreviewDialogProps {
  startDate?: string;
  endDate?: string;
  therapistId?: string;
  customTitle?: string;
  children?: React.ReactNode;
}

export default function PaymentsPreviewDialog({ 
  startDate,
  endDate,
  therapistId,
  customTitle = 'RELEVÉ DES PAIEMENTS AUX THÉRAPEUTES',
  children 
}: PaymentsPreviewDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Nettoyage de l'URL du PDF quand on ferme le dialogue
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      setError(null);
    } else if (!pdfUrl) {
      // Charger le PDF quand on ouvre le dialogue
      loadPdfPreview();
    }
  };

  const loadPdfPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Construire l'URL avec les paramètres
      let url = "/api/therapist-payments/preview/pdf";
      const params = new URLSearchParams();
      
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (therapistId && therapistId !== 'all') params.append("therapistId", therapistId);
      if (customTitle) params.append("title", customTitle);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Aucun paiement trouvé pour les critères sélectionnés.");
          setIsLoading(false);
          return;
        }
        throw new Error(`Erreur lors du chargement du relevé: ${response.statusText}`);
      }
      
      // Récupérer le PDF comme Blob
      const pdfBlob = await response.blob();
      
      // Créer une URL pour le blob
      const pdfObjectUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfObjectUrl);
    } catch (error) {
      console.error('Erreur lors du chargement de la prévisualisation:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger la prévisualisation du relevé de paiements.",
        variant: "destructive"
      });
      setError("Impossible de charger la prévisualisation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    // Construire l'URL avec les paramètres pour le téléchargement
    let url = "/api/therapist-payments/export/pdf";
    const params = new URLSearchParams();
    
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (therapistId && therapistId !== 'all') params.append("therapistId", therapistId);
    if (customTitle) params.append("title", customTitle);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    // Ouvrir l'URL dans un nouvel onglet pour télécharger le PDF
    window.open(url, '_blank');
  };

  // Générer un titre pour la boîte de dialogue
  const getDialogTitle = () => {
    if (customTitle !== 'RELEVÉ DES PAIEMENTS AUX THÉRAPEUTES') {
      return customTitle;
    }
    
    if (startDate && endDate) {
      return `Relevé des paiements du ${formatDate(startDate)} au ${formatDate(endDate)}`;
    }
    
    return "Relevé des paiements aux thérapeutes";
  };

  // Formater une date pour l'affichage
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            title="Prévisualiser le relevé de paiements"
          >
            <Eye className="h-4 w-4" />
            <span>Prévisualiser</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            Prévisualisation du relevé de paiements avant téléchargement
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-muted/20 rounded-md relative min-h-[500px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Chargement du relevé...</span>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-16 w-16 mb-4" />
              <p>{error}</p>
            </div>
          ) : pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full border-0" 
              title="Prévisualisation du relevé de paiements"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-16 w-16 mb-4" />
              <p>Impossible de charger la prévisualisation</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex items-center justify-between mt-4">
          <DialogClose asChild>
            <Button variant="outline">Fermer</Button>
          </DialogClose>
          
          {!error && (
            <Button 
              onClick={handleDownload} 
              variant="default"
              className="flex items-center gap-2"
              disabled={isLoading || !!error}
            >
              <Download className="h-4 w-4" />
              Télécharger le relevé
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}