import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
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
import { expenseFormSchema, type ExpenseFormData, type Expense } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftIcon, FileIcon, UploadIcon, Loader2, FileTextIcon, ImageIcon, ExternalLinkIcon, AlertTriangleIcon } from "lucide-react";
import { HomeButton } from "@/components/ui/home-button";
import { 
  uploadFile, 
  getFileNameFromUrl, 
  isImageFile, 
  isPdfFile, 
  openPdfInNewTab, 
  isExternalUrl, 
  getSafeDisplayUrl,
  deleteFile
} from "@/lib/fileUploadService";

export default function EditExpenseForm() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentReceiptUrl, setCurrentReceiptUrl] = useState<string | null>(null);

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

  // Update form when expense data is loaded
  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        amount: parseFloat(expense.amount.toString()),
        date: expense.date,
        category: expense.category,
        paymentMethod: expense.paymentMethod,
        notes: expense.notes || "",
      });
      
      setCurrentReceiptUrl(expense.receiptUrl || null);
    }
  }, [expense, form]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReceiptFile(e.target.files[0]);
    }
  };

  // Upload receipt file
  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return currentReceiptUrl;
    
    setIsUploading(true);
    
    try {
      // Utiliser notre service d'upload pour télécharger le fichier
      const fileUrl = await uploadFile(receiptFile, 'receipts');
      
      // Si nous avons déjà un fichier local (pas une URL externe), on le supprime
      if (currentReceiptUrl && !isExternalUrl(currentReceiptUrl)) {
        try {
          await deleteFile(currentReceiptUrl);
        } catch (deleteError) {
          console.warn("Erreur lors de la suppression du justificatif précédent:", deleteError);
          // On continue même si la suppression échoue
        }
      }
      
      // Mettre à jour l'URL du justificatif pour cette dépense
      await apiRequest(`/api/expenses/${id}/receipt`, "POST", { 
        fileUrl 
      });
      
      toast({
        title: currentReceiptUrl && isExternalUrl(currentReceiptUrl)
          ? "Justificatif remplacé"
          : "Justificatif ajouté",
        description: currentReceiptUrl && isExternalUrl(currentReceiptUrl)
          ? "La référence externe a été remplacée par un nouveau fichier"
          : "Le justificatif a été téléchargé avec succès",
      });
      
      return fileUrl;
    } catch (error) {
      console.error("Erreur lors de l'upload du justificatif:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le justificatif",
        variant: "destructive",
      });
      return currentReceiptUrl;
    } finally {
      setIsUploading(false);
    }
  };

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const response = await apiRequest(`/api/expenses/${id}`, "PUT", data) as Expense;
      
      if (receiptFile) {
        await uploadReceipt();
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", parseInt(id)] });
      toast({
        title: "Dépense mise à jour",
        description: "La dépense a été modifiée avec succès",
      });
      navigate(`/expenses/${id}`);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la dépense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    updateExpenseMutation.mutate(data);
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

  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Chargement des données...</p>
        </div>
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
            onClick={() => navigate(`/expenses/${id}`)}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Retour aux détails
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Modifier la Dépense</h1>
        <p className="text-muted-foreground">
          Modifiez les informations de la dépense
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Formulaire de Dépense</CardTitle>
          <CardDescription>
            Mettez à jour les informations de la dépense
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
                                <SelectItem value="Prélèvement">Prélèvement</SelectItem>
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
                  {currentReceiptUrl && !receiptFile && (
                    <div className="mb-4 p-4 bg-muted/30 rounded-md">
                      <p className="text-sm font-medium mb-2">Justificatif actuel :</p>
                      <div className="flex items-center space-x-2">
                        {isExternalUrl(currentReceiptUrl) ? (
                          <ExternalLinkIcon className="h-5 w-5 text-muted-foreground" />
                        ) : isPdfFile(getFileNameFromUrl(currentReceiptUrl)) ? (
                          <FileTextIcon className="h-5 w-5 text-primary" />
                        ) : isImageFile(getFileNameFromUrl(currentReceiptUrl)) ? (
                          <ImageIcon className="h-5 w-5 text-primary" />
                        ) : (
                          <FileIcon className="h-5 w-5 text-primary" />
                        )}
                        
                        {isExternalUrl(currentReceiptUrl) ? (
                          <div className="flex items-center">
                            <span className="text-muted-foreground text-sm">Fichier externe (non disponible)</span>
                            <AlertTriangleIcon className="h-4 w-4 text-amber-500 ml-2" />
                          </div>
                        ) : isPdfFile(getFileNameFromUrl(currentReceiptUrl)) ? (
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-primary text-sm truncate"
                            onClick={() => openPdfInNewTab(currentReceiptUrl)}
                          >
                            {getFileNameFromUrl(currentReceiptUrl)}
                          </Button>
                        ) : (
                          <a 
                            href={getSafeDisplayUrl(currentReceiptUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm truncate"
                          >
                            {getFileNameFromUrl(currentReceiptUrl)}
                          </a>
                        )}
                      </div>
                      
                      {isExternalUrl(currentReceiptUrl) && (
                        <div className="mt-2 bg-amber-50 p-2 rounded-md border border-amber-200">
                          <p className="text-xs text-amber-700">
                            Le fichier d'origine n'est plus accessible. En téléchargeant un nouveau justificatif, 
                            vous remplacerez définitivement cette référence externe.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

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
                          {currentReceiptUrl 
                            ? "Remplacer le justificatif actuel" 
                            : "Glissez-déposez votre justificatif ici"}
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
              disabled={updateExpenseMutation.isPending || isUploading}
            >
              Précédent
            </Button>
          )}
          <Button
            type="button"
            onClick={handleNext}
            disabled={updateExpenseMutation.isPending || isUploading}
          >
            {activeTab === "receipt" ? (
              updateExpenseMutation.isPending || isUploading ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Enregistrement...
                </span>
              ) : (
                "Enregistrer les modifications"
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