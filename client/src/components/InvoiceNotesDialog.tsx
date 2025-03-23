import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

interface InvoiceNotesDialogProps {
  invoiceId: number;
  invoiceNumber: string;
  currentNotes?: string;
}

export default function InvoiceNotesDialog({
  invoiceId,
  invoiceNumber,
  currentNotes = "",
}: InvoiceNotesDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(currentNotes);
  const [isGroupedInvoice, setIsGroupedInvoice] = useState(
    currentNotes?.includes("Facture groupée") || false
  );
  const [additionalNotes, setAdditionalNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extraction des notes supplémentaires des factures groupées
  useEffect(() => {
    if (currentNotes && currentNotes.includes("Facture groupée")) {
      const parts = currentNotes.split(" - ");
      if (parts.length > 1) {
        // Si le format est "Facture groupée - Notes supplémentaires"
        setAdditionalNotes(parts.slice(1).join(" - ").trim());
      } else {
        setAdditionalNotes("");
      }
    } else {
      setAdditionalNotes("");
      setNotes(currentNotes);
    }
  }, [currentNotes]);

  // Combine les notes selon si c'est une facture groupée ou non
  const prepareNotes = () => {
    if (isGroupedInvoice) {
      return additionalNotes 
        ? `Facture groupée - ${additionalNotes}`
        : "Facture groupée";
    }
    return notes;
  };

  // Mutation pour mettre à jour les notes
  const updateInvoiceNotes = useMutation({
    mutationFn: async (notes: string) => {
      return apiRequest<any>(
        `/api/invoices/${invoiceId}`,
        "PUT",
        { notes }
      );
    },
    onSuccess: () => {
      // Invalider le cache et forcer un rechargement des factures
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      toast({
        title: "Notes mises à jour",
        description: "Les notes pour la facture ont été mises à jour avec succès.",
        variant: "default",
      });
      
      // Fermer le dialogue
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour des notes.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvoiceNotes.mutate(prepareNotes());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
        >
          <Pencil className="mr-1 h-3 w-3" />
          Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Notes pour la facture</DialogTitle>
          <DialogDescription>
            Ajouter ou modifier les notes pour la facture {invoiceNumber}.
            Ces notes apparaîtront sur la facture, sous le motif de consultation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2 pb-2">
              <Checkbox 
                id="isGroupedInvoice" 
                checked={isGroupedInvoice}
                onCheckedChange={(checked) => {
                  setIsGroupedInvoice(checked === true);
                }}
              />
              <Label htmlFor="isGroupedInvoice" className="font-medium">
                Il s'agit d'une facture groupée
              </Label>
            </div>

            {isGroupedInvoice ? (
              <div className="grid gap-2">
                <Label htmlFor="additionalNotes">Notes supplémentaires pour facture groupée</Label>
                <Textarea
                  id="additionalNotes"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Informations supplémentaires pour cette facture groupée"
                  className="h-32"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Ces notes seront ajoutées après la mention "Facture groupée".
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes pour l'assurance</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations particulières pour l'assurance"
                  className="h-32"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={updateInvoiceNotes.isPending}
            >
              {updateInvoiceNotes.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}