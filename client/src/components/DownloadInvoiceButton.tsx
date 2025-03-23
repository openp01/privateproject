import React from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';

interface DownloadInvoiceButtonProps {
  invoiceId: number;
  invoiceNumber: string;
}

export default function DownloadInvoiceButton({ invoiceId, invoiceNumber }: DownloadInvoiceButtonProps) {
  const handleDownload = () => {
    // Ouvrir l'URL dans un nouvel onglet pour télécharger le PDF
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-1"
      onClick={handleDownload}
      title={`Télécharger la facture ${invoiceNumber}`}
    >
      <DownloadIcon className="h-4 w-4" />
      <span>PDF</span>
    </Button>
  );
}