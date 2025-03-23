import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { expenseFormSchema, type ExpenseFormData } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftIcon, FileIcon, UploadIcon, Loader2, FileTextIcon, ImageIcon } from "lucide-react";
import { HomeButton } from "@/components/ui/home-button";
import { uploadFile, isImageFile, isPdfFile, openPdfInNewTab, registerFileName, getFileNameFromUrl } from "@/lib/fileUploadService";

export default function ExpenseForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize the form with default values
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      date: new Date().toISOString().split("T")[0],
      category: "",
      paymentMethod: "",
      notes: "",
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReceiptFile(e.target.files[0]);
    }
  };

  // Upload receipt file
  const uploadReceipt = async (expenseId: number): Promise<string | null> => {
    if (!receiptFile) return null;
    
    setIsUploading(true);
    
    try {
      // Utiliser notre service d'upload pour télécharger le fichier
      const fileUrl = await uploadFile(receiptFile, 'receipts');
      
      // Mettre à jour l'URL du justificatif pour cette dépense
      await apiRequest(`/api/expenses/${expenseId}/receipt`, "POST", { 
        fileUrl 
      });
      
      toast({
        title: "Justificatif ajouté",
        description: "Le justificatif a été téléchargé avec succès",
      });
      
      return fileUrl;
    } catch (error) {
      console.error("Erreur lors de l'upload du justificatif:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le justificatif",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const response = await apiRequest("/api/expenses", "POST", data) as any;
      
      if (receiptFile && response && response.id) {
        await uploadReceipt(response.id);
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Dépense créée",
        description: "La dépense a été ajoutée avec succès",
      });
      navigate("/expenses");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la dépense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  const handleNext = () => {
    if (activeTab === "details") {
      setActiveTab("receipt");
    } else if (activeTab === "receipt") {
      form.handleSubmit(onSubmit)();
    }
  };

  const handlePrevious = () => {
    if (activeTab === "receipt") {
      setActiveTab("details");
    }
  };

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
        <h1 className="text-3xl font-bold">Nouvelle Dépense</h1>
        <p className="text-muted-foreground">
          Ajoutez une nouvelle dépense au système
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Formulaire de Dépense</CardTitle>
          <CardDescription>
            Renseignez les informations de la dépense
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="receipt">Justificatif</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <TabsContent value="details">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Fournitures de bureau"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined;
                                field.onChange(value);
                              }}
                              value={field.value?.toString() || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Fournitures">
                                  Fournitures
                                </SelectItem>
                                <SelectItem value="Loyer">Loyer</SelectItem>
                                <SelectItem value="Équipement">
                                  Équipement
                                </SelectItem>
                                <SelectItem value="Formation">
                                  Formation
                                </SelectItem>
                                <SelectItem value="Services">
                                  Services
                                </SelectItem>
                                <SelectItem value="Factures">
                                  Factures (eau, électricité...)
                                </SelectItem>
                                <SelectItem value="Taxes">
                                  Taxes (impôts, TVA...)
                                </SelectItem>
                                <SelectItem value="Entretien">
                                  Entretien des locaux
                                </SelectItem>
                                <SelectItem value="Assurance">
                                  Assurance
                                </SelectItem>
                                <SelectItem value="Autre">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Méthode de paiement</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un mode" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Carte bancaire">
                                  Carte bancaire
                                </SelectItem>
                                <SelectItem value="Espèces">Espèces</SelectItem>
                                <SelectItem value="Virement">
                                  Virement
                                </SelectItem>
                                <SelectItem value="Chèque">Chèque</SelectItem>
                                <SelectItem value="Paiement mobile">
                                  Paiement mobile
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informations complémentaires..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="receipt">
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-md p-8 text-center">
                    {receiptFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center">
                          <FileIcon className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-sm font-medium">{receiptFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(receiptFile.size / 1024).toFixed(2)} KB
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setReceiptFile(null)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center">
                          <UploadIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">
                          Glissez-déposez votre justificatif ici
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ou cliquez pour sélectionner un fichier
                        </p>
                        <Input
                          id="receipt"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            document.getElementById("receipt")?.click();
                          }}
                        >
                          Sélectionner un fichier
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormDescription>
                    Formats acceptés: JPG, PNG, PDF. Taille maximale: 5MB
                  </FormDescription>
                </div>
              </TabsContent>
            </Form>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          {activeTab === "details" ? (
            <div></div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={createExpenseMutation.isPending || isUploading}
            >
              Précédent
            </Button>
          )}
          <Button
            type="button"
            onClick={handleNext}
            disabled={createExpenseMutation.isPending || isUploading}
          >
            {activeTab === "receipt" ? (
              createExpenseMutation.isPending || isUploading ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Enregistrement...
                </span>
              ) : (
                "Enregistrer"
              )
            ) : (
              "Suivant"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}