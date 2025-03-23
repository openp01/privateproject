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

interface InvoicePreviewDialogProps {
  invoiceId: number;
  invoiceNumber: string;
  children?: React.ReactNode;
}

export default function InvoicePreviewDialog({ 
  invoiceId, 
  invoiceNumber,
  children 
}: InvoicePreviewDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Nettoyage de l'URL du PDF quand on ferme le dialogue
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    } else if (!pdfUrl) {
      // Charger le PDF quand on ouvre le dialogue
      loadPdfPreview();
    }
  };

  const loadPdfPreview = async () => {
    setIsLoading(true);
    try {
      // URL de l'API avec 'preview=true' pour indiquer que c'est une prévisualisation
      const response = await fetch(`/api/invoices/${invoiceId}/pdf?preview=true`);
      
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement de la facture: ${response.statusText}`);
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
        description: "Impossible de charger la prévisualisation de la facture.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    // Ouvrir l'URL dans un nouvel onglet pour télécharger le PDF
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            title={`Prévisualiser la facture ${invoiceNumber}`}
          >
            <Eye className="h-4 w-4" />
            <span>Prévisualiser</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Facture {invoiceNumber}</DialogTitle>
          <DialogDescription>
            Prévisualisation du document avant téléchargement
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-muted/20 rounded-md relative min-h-[500px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Chargement de la facture...</span>
            </div>
          ) : pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full border-0" 
              title={`Prévisualisation de la facture ${invoiceNumber}`}
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
          
          <Button 
            onClick={handleDownload} 
            variant="default"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Télécharger la facture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}