import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InvoiceTemplate, invoiceTemplateFormSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceTemplatePreview from "@/components/InvoiceTemplatePreview";
import { Loader2, Save, Upload } from "lucide-react";

interface InvoiceTemplateFormProps {
  template?: InvoiceTemplate;
  onSuccess?: () => void;
}

export default function InvoiceTemplateForm({ template, onSuccess }: InvoiceTemplateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(template ? "preview" : "edit");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(template?.logoUrl || null);
  
  // Valeurs par défaut pour un nouveau template
  const defaultValues = {
    name: template?.name || 'Nouveau modèle',
    description: template?.description || 'Modèle de facture standard',
    headerContent: template?.headerContent || `<div>
      <p><strong>Cabinet d'Orthophonie</strong></p>
      <p>123 Avenue des Soins</p>
      <p>75000 Paris, France</p>
      <p>Tél: 01 23 45 67 89</p>
      <p>Email: contact@cabinet-ortho.fr</p>
    </div>`,
    footerContent: template?.footerContent || `<div>
      <p>Merci pour votre confiance.</p>
      <p>Règlement à réception de la facture par chèque, espèces ou virement.</p>
      <p>SIRET: 12345678900000 | N° TVA: FR12345678900</p>
    </div>`,
    primaryColor: template?.primaryColor || '#4f46e5',
    secondaryColor: template?.secondaryColor || '#6366f1',
    fontFamily: template?.fontFamily || 'Arial, sans-serif',
    showTherapistSignature: template?.showTherapistSignature ?? true,
    isDefault: template?.isDefault ?? false
  };

  const form = useForm({
    resolver: zodResolver(invoiceTemplateFormSchema),
    defaultValues,
  });

  const watchedValues = form.watch();
  
  // Prépare un objet template pour l'aperçu
  const previewTemplate: InvoiceTemplate = {
    id: template?.id || 0,
    name: watchedValues.name,
    description: watchedValues.description || '',
    headerContent: watchedValues.headerContent,
    footerContent: watchedValues.footerContent,
    logoUrl: logoPreview || '',
    primaryColor: watchedValues.primaryColor,
    secondaryColor: watchedValues.secondaryColor,
    fontFamily: watchedValues.fontFamily,
    showTherapistSignature: watchedValues.showTherapistSignature,
    isDefault: watchedValues.isDefault,
    createdAt: template?.createdAt || new Date(),
    updatedAt: template?.updatedAt || new Date()
  };

  // Mutation pour sauvegarder ou mettre à jour le template
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const endpoint = template 
        ? `/api/invoice-templates/${template.id}` 
        : '/api/invoice-templates';
      const method = template ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        body: data
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erreur lors de la sauvegarde du template");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-templates"] });
      toast({
        title: template ? "Template mis à jour" : "Template créé",
        description: template 
          ? "Les modifications ont été enregistrées" 
          : "Le nouveau template a été créé avec succès",
        variant: "default",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Vérifier le type de fichier
    if (!file.type.match('image.*')) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner une image (JPG, PNG, SVG)",
        variant: "destructive",
      });
      return;
    }
    
    // Limite de taille (2 Mo)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 2 Mo",
        variant: "destructive",
      });
      return;
    }
    
    setLogoFile(file);
    
    // Créer un aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (formData: any) => {
    const data = new FormData();
    
    // Ajouter les champs du formulaire
    Object.keys(formData).forEach((key) => {
      if (key === 'isDefault' || key === 'showTherapistSignature') {
        data.append(key, formData[key] ? 'true' : 'false');
      } else {
        data.append(key, formData[key]);
      }
    });
    
    // Ajouter le logo s'il existe
    if (logoFile) {
      data.append('logo', logoFile);
    }
    
    saveTemplateMutation.mutate(data);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Tabs defaultValue="edit" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="edit">Édition</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du template</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Une courte description du modèle de facture
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Logo */}
                <div className="space-y-2">
                  <FormLabel>Logo</FormLabel>
                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <div className="w-20 h-20 border rounded flex items-center justify-center overflow-hidden">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="flex-1"
                      />
                      <FormDescription>
                        Format recommandé: PNG ou SVG transparent, max 2 Mo
                      </FormDescription>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Couleur principale</FormLabel>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            {...field} 
                            className="w-10 h-10 rounded-md cursor-pointer"
                          />
                          <Input {...field} className="flex-1" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="secondaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Couleur secondaire</FormLabel>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            {...field} 
                            className="w-10 h-10 rounded-md cursor-pointer"
                          />
                          <Input {...field} className="flex-1" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fontFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Police</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="headerContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenu de l'en-tête</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={6}
                          placeholder="<div><p>Information du cabinet...</p></div>"
                        />
                      </FormControl>
                      <FormDescription>
                        Vous pouvez utiliser du HTML simple pour la mise en forme
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="footerContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenu du pied de page</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={6}
                          placeholder="<div><p>Mentions légales, infos supplémentaires...</p></div>"
                        />
                      </FormControl>
                      <FormDescription>
                        Vous pouvez utiliser du HTML simple pour la mise en forme
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="showTherapistSignature"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-x-2 space-y-0 rounded-md border p-4">
                        <div>
                          <FormLabel>Signature du thérapeute</FormLabel>
                          <FormDescription>
                            Afficher un espace pour la signature
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-x-2 space-y-0 rounded-md border p-4">
                        <div>
                          <FormLabel>Template par défaut</FormLabel>
                          <FormDescription>
                            Utiliser ce modèle comme template par défaut
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={template?.isDefault}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("preview")}
                  >
                    Aperçu
                  </Button>
                  <Button 
                    type="submit"
                    disabled={saveTemplateMutation.isPending}
                  >
                    {saveTemplateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    {template ? "Mettre à jour" : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="preview">
            <div className="space-y-4">
              <InvoiceTemplatePreview template={previewTemplate} />
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  variant="outline"
                >
                  Retourner à l'édition
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Vue d'aperçu permanente sur grand écran */}
      <div className="hidden lg:block">
        <h3 className="text-lg font-medium mb-3">Aperçu en temps réel</h3>
        <InvoiceTemplatePreview template={previewTemplate} />
      </div>
    </div>
  );
}