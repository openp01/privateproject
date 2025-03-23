import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Download, Printer, Mail } from 'lucide-react';
import InvoicePreviewDialog from './InvoicePreviewDialog';

interface InvoiceActionsProps {
  invoiceId: number;
  invoiceNumber: string;
}

export default function InvoiceActions({ invoiceId, invoiceNumber }: InvoiceActionsProps) {
  const handleDownload = () => {
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
  };

  const handlePrint = () => {
    // Ouvrir dans un nouvel onglet pour impression
    const printWindow = window.open(`/api/invoices/${invoiceId}/pdf?preview=true`, '_blank');
    if (printWindow) {
      // Attendre que le PDF soit chargé puis imprimer
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  const handleEmail = () => {
    // Cette fonctionnalité nécessiterait un endpoint spécifique
    // pour envoyer la facture par email directement
    window.open(`/api/invoices/${invoiceId}/send-email`, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <InvoicePreviewDialog invoiceId={invoiceId} invoiceNumber={invoiceNumber}>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          title={`Prévisualiser la facture ${invoiceNumber}`}
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Prévisualiser</span>
        </Button>
      </InvoicePreviewDialog>
      
      <Button
        variant="default"
        size="sm"
        className="flex items-center gap-1"
        onClick={handleDownload}
        title={`Télécharger la facture ${invoiceNumber}`}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Télécharger</span>
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Plus d'options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Envoyer par email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}