import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { HomeButton } from "@/components/ui/home-button";
import { Loader2, Plus, PencilIcon, Trash2Icon, CheckIcon, AlertCircle, FilePlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { InvoiceTemplate } from "@shared/schema";
import InvoiceTemplateForm from "@/components/InvoiceTemplateForm";
import InvoiceTemplatePreview from "@/components/InvoiceTemplatePreview";

export default function InvoiceTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [activeTab, setActiveTab] = useState("existing");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  // Récupération des templates
  const { data: templates, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/invoice-templates"],
    queryFn: async () => {
      const response = await fetch('/api/invoice-templates');
      if (!response.ok) throw new Error("Erreur lors du chargement des templates");
      return response.json() as Promise<InvoiceTemplate[]>;
    }
  });
  
  // Mutation pour définir un template par défaut
  const setAsDefaultMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return apiRequest<any>(
        `/api/invoice-templates/${templateId}/set-default`,
        "PUT"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-templates"] });
      toast({
        title: "Template modifié",
        description: "Le template a été défini comme modèle par défaut.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de définir ce template comme modèle par défaut.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation pour supprimer un template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return apiRequest<any>(
        `/api/invoice-templates/${templateId}`,
        "DELETE"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-templates"] });
      toast({
        title: "Template supprimé",
        description: "Le template a été supprimé avec succès.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer ce template.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation pour importer un template
  const importTemplateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/invoice-templates/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erreur d'importation");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-templates"] });
      setIsImportDialogOpen(false);
      setImportFile(null);
      toast({
        title: "Template importé",
        description: "Le template a été importé avec succès.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur d'importation",
        description: error.message || "Impossible d'importer ce template.",
        variant: "destructive",
      });
    },
  });
  
  const handleSetAsDefault = (template: InvoiceTemplate) => {
    setAsDefaultMutation.mutate(template.id);
  };
  
  const handleDeleteTemplate = (template: InvoiceTemplate) => {
    if (template.isDefault) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas supprimer le template par défaut.",
        variant: "destructive",
      });
      return;
    }
    
    deleteTemplateMutation.mutate(template.id);
  };
  
  const handleImportSubmit = () => {
    if (!importFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier à importer.",
        variant: "destructive",
      });
      return;
    }
    
    importTemplateMutation.mutate(importFile);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Templates de Factures</CardTitle>
            <CardDescription>Chargement des templates...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
            <CardDescription>Impossible de charger les templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Une erreur est survenue lors du chargement des templates de factures.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => refetch()}>Réessayer</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Templates de Factures</CardTitle>
            <CardDescription>Gérez et personnalisez vos modèles de factures</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <FilePlus className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <HomeButton variant="default" />
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="existing" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="existing">Templates existants</TabsTrigger>
              <TabsTrigger value="new">Créer un nouveau template</TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing">
              {templates && templates.length > 0 ? (
                <Table>
                  <TableCaption>Liste des templates de factures disponibles</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.description || "-"}</TableCell>
                        <TableCell>
                          {template.isDefault ? (
                            <Badge variant="success">Par défaut</Badge>
                          ) : (
                            <Badge variant="outline">Standard</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedTemplate(template);
                              }}
                            >
                              <PencilIcon className="h-4 w-4" />
                              <span className="sr-only">Modifier</span>
                            </Button>
                            
                            {!template.isDefault && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSetAsDefault(template)}
                                disabled={setAsDefaultMutation.isPending}
                              >
                                <CheckIcon className="h-4 w-4" />
                                <span className="sr-only">Définir par défaut</span>
                              </Button>
                            )}
                            
                            {!template.isDefault && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteTemplate(template)}
                                disabled={deleteTemplateMutation.isPending}
                                className="text-destructive hover:text-destructive/90"
                              >
                                <Trash2Icon className="h-4 w-4" />
                                <span className="sr-only">Supprimer</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground mb-4">Aucun template disponible</p>
                  <Button 
                    variant="default" 
                    onClick={() => setActiveTab("new")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un template
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="new">
              <InvoiceTemplateForm 
                onSuccess={() => {
                  setActiveTab("existing");
                  refetch();
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Dialogue d'édition de template */}
      {selectedTemplate && (
        <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Modifier le template de facture</DialogTitle>
              <DialogDescription>
                Personnalisez les détails et l'apparence de ce template
              </DialogDescription>
            </DialogHeader>
            
            <InvoiceTemplateForm 
              template={selectedTemplate}
              onSuccess={() => {
                setSelectedTemplate(null);
                refetch();
              }}
            />
            
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Dialogue d'importation de template */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer un template</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier JSON ou PNG pour créer un template de facture
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <label className="block">
              <span className="text-sm font-medium mb-1 block">Fichier de template (JSON ou PNG)</span>
              <input
                type="file"
                accept=".json,.png"
                className="block w-full text-sm 
                  file:mr-4 file:py-2 file:px-4 file:rounded-md
                  file:border-0 file:text-sm file:font-medium
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </label>
            {importFile && (
              <p className="text-sm text-muted-foreground">
                Fichier sélectionné: {importFile.name}
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={handleImportSubmit}
              disabled={importTemplateMutation.isPending || !importFile}
            >
              {importTemplateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}