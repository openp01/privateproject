import React from 'react';
import { Card } from "@/components/ui/card";
import { InvoiceTemplate } from "@shared/schema";

interface InvoiceTemplatePreviewProps {
  template: InvoiceTemplate;
}

export default function InvoiceTemplatePreview({ template }: InvoiceTemplatePreviewProps) {
  const {
    name,
    headerContent,
    footerContent,
    primaryColor,
    secondaryColor,
    fontFamily,
    logoUrl
  } = template;

  const previewStyle = {
    fontFamily: fontFamily || 'Arial, sans-serif',
    '--primary-color': primaryColor || '#4f46e5',
    '--secondary-color': secondaryColor || '#6366f1',
  } as React.CSSProperties;

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium mb-3">Aperçu du template : {name}</h3>
      
      <Card className="overflow-hidden border shadow-md">
        <div 
          className="p-6" 
          style={previewStyle}
        >
          {/* Header */}
          <div 
            className="border-b pb-4 mb-4"
            style={{ borderColor: 'var(--primary-color)' }}
          >
            <div className="flex justify-between items-start">
              {logoUrl && (
                <div className="w-40 h-auto mb-4">
                  <img src={logoUrl} alt="Logo" className="max-w-full" />
                </div>
              )}
              <div className="text-right">
                <div 
                  className="text-2xl font-bold mb-2" 
                  style={{ color: 'var(--primary-color)' }}
                >
                  FACTURE
                </div>
                <div className="text-gray-600">Numéro : ###</div>
                <div className="text-gray-600">Date : 13/03/2025</div>
              </div>
            </div>
            <div 
              className="mt-4 p-3 rounded-md" 
              style={{ backgroundColor: 'rgba(var(--primary-color-rgb), 0.05)' }}
              dangerouslySetInnerHTML={{ __html: headerContent }}
            />
          </div>
          
          {/* Content */}
          <div className="mb-6">
            <div className="flex justify-between mb-4">
              <div>
                <h3 className="font-bold mb-1">Patient</h3>
                <div>Nom du Patient</div>
                <div>123 Rue du Patient</div>
                <div>75000 Paris</div>
                <div>contact@patient.com</div>
              </div>
              <div>
                <h3 className="font-bold mb-1">Thérapeute</h3>
                <div>Dr. Thérapeute</div>
                <div>456 Avenue du Cabinet</div>
                <div>75000 Paris</div>
                <div>contact@therapeute.com</div>
              </div>
            </div>
            
            <table className="w-full border-collapse mt-6">
              <thead>
                <tr 
                  style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}
                >
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-center">Date</th>
                  <th className="p-2 text-center">Durée</th>
                  <th className="p-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 text-left">Séance thérapeutique</td>
                  <td className="p-2 text-center">13/03/2025</td>
                  <td className="p-2 text-center">45 min</td>
                  <td className="p-2 text-right">50,00 €</td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-2 text-right font-bold">Total</td>
                  <td className="p-2 text-right font-bold">50,00 €</td>
                </tr>
              </tbody>
            </table>
            
            <div className="mt-6 flex justify-end">
              {template.showTherapistSignature && (
                <div className="text-center">
                  <div className="w-40 h-20 border border-dashed mb-2 flex items-center justify-center text-gray-400">
                    Signature
                  </div>
                  <div>Dr. Thérapeute</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div 
            className="mt-6 pt-4 border-t text-sm text-gray-600"
            style={{ borderColor: 'var(--primary-color)' }}
            dangerouslySetInnerHTML={{ __html: footerContent }}
          />
        </div>
      </Card>
    </div>
  );
}