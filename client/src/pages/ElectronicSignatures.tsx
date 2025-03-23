import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HomeButton } from "@/components/ui/home-button";
import { Loader2, Save, RefreshCw, PenTool, Upload, Stamp, ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Signature } from "@shared/schema";
import SignatureCanvas from "@/components/SignatureCanvas";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ElectronicSignatures() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [paidStampData, setPaidStampData] = useState<string | null>(null);
  const [permanentStampData, setPermanentStampData] = useState<string | null>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isPaidStampDialogOpen, setIsPaidStampDialogOpen] = useState(false);
  const [isPermanentStampDialogOpen, setIsPermanentStampDialogOpen] = useState(false);
  const stampFileInputRef = useRef<HTMLInputElement>(null);
  const permanentStampFileInputRef = useRef<HTMLInputElement>(null);
  
  // Récupération de la signature administrative
  const { 
    data: adminSignature, 
    isLoading: isLoadingSignature, 
    refetch: refetchSignature,
    isError
  } = useQuery({
    queryKey: ['/api/admin-signature'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/admin-signature');
      } catch (error: any) {
        if (error.status === 404) {
          // Aucune signature trouvée, c'est normal
          return null;
        }
        throw error;
      }
    }
  });
  
  // Mutation pour sauvegarder une signature
  const saveSignatureMutation = useMutation({
    mutationFn: async (data: { signatureData: string, paidStampData?: string | null, permanentStampData?: string | null }) => {
      return apiRequest(
        '/api/admin-signature',
        'POST',
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin-signature'] });
      refetchSignature();
      setIsSignatureDialogOpen(false);
      setIsPaidStampDialogOpen(false);
      setIsPermanentStampDialogOpen(false);
      setSignatureData(null);
      setPaidStampData(null);
      setPermanentStampData(null);
      toast({
        title: "Mise à jour réussie",
        description: "Les données de signature ont été enregistrées avec succès.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer les données.",
        variant: "destructive",
      });
    },
  });
  
  // Ouvrir le dialogue de signature
  const openSignatureDialog = () => {
    setSignatureData(adminSignature?.signatureData || null);
    setIsSignatureDialogOpen(true);
  };
  
  // Ouvrir le dialogue du tampon PAYÉ
  const openPaidStampDialog = () => {
    setPaidStampData(adminSignature?.paidStampData || null);
    setIsPaidStampDialogOpen(true);
  };
  
  // Ouvrir le dialogue du tampon permanent
  const openPermanentStampDialog = () => {
    setPermanentStampData(adminSignature?.permanentStampData || null);
    setIsPermanentStampDialogOpen(true);
  };
  
  // Gérer l'importation d'un fichier pour le tampon PAYÉ
  const handleStampFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner un fichier image (PNG, JPG, GIF, SVG).",
        variant: "destructive",
      });
      return;
    }
    
    // Lire le fichier et le convertir en base64
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPaidStampData(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Gérer l'importation d'un fichier pour le tampon permanent
  const handlePermanentStampFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner un fichier image (PNG, JPG, GIF, SVG).",
        variant: "destructive",
      });
      return;
    }
    
    // Lire le fichier et le convertir en base64
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPermanentStampData(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Sauvegarder la signature
  const handleSaveSignature = () => {
    if (!signatureData) return;
    
    // Créer ou mettre à jour la signature
    saveSignatureMutation.mutate({
      signatureData
    });
  };
  
  // Sauvegarder le tampon PAYÉ
  const handleSavePaidStamp = () => {
    if (!adminSignature?.signatureData) {
      toast({
        title: "Erreur",
        description: "Vous devez d'abord créer une signature avant d'ajouter un tampon.",
        variant: "destructive",
      });
      return;
    }
    
    // Mettre à jour la signature avec le tampon PAYÉ
    saveSignatureMutation.mutate({
      signatureData: adminSignature.signatureData,
      paidStampData,
      permanentStampData: adminSignature.permanentStampData
    });
  };
  
  // Sauvegarder le tampon permanent
  const handleSavePermanentStamp = () => {
    if (!adminSignature?.signatureData) {
      toast({
        title: "Erreur",
        description: "Vous devez d'abord créer une signature avant d'ajouter un tampon permanent.",
        variant: "destructive",
      });
      return;
    }
    
    // Mettre à jour la signature avec le tampon permanent
    saveSignatureMutation.mutate({
      signatureData: adminSignature.signatureData,
      paidStampData: adminSignature.paidStampData,
      permanentStampData
    });
  };
  
  if (isLoadingSignature) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Signature Électronique</CardTitle>
            <CardDescription>Chargement en cours...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Signature Électronique</CardTitle>
            <CardDescription>
              Gérez la signature électronique administrative pour les documents officiels
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetchSignature()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <HomeButton variant="default" />
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signature" className="max-w-lg mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signature">Signature</TabsTrigger>
              <TabsTrigger value="stamp">Tampon "PAYÉ"</TabsTrigger>
              <TabsTrigger value="permanentStamp">Tampon Permanent</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signature" className="mt-4">
              <Card className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Signature administrative</CardTitle>
                  <CardDescription>Cette signature sera utilisée pour les documents officiels</CardDescription>
                </CardHeader>
                
                <CardContent className="p-4 pt-0">
                  {adminSignature ? (
                    <div className="border rounded-md p-2 bg-gray-50 h-[150px] flex items-center justify-center">
                      <img 
                        src={adminSignature.signatureData} 
                        alt="Signature administrative"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="border border-dashed rounded-md p-2 bg-gray-50 h-[150px] flex flex-col items-center justify-center text-gray-400">
                      <PenTool className="h-8 w-8 mb-2" />
                      Aucune signature enregistrée
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex justify-center">
                  <Button
                    variant="default"
                    onClick={() => openSignatureDialog()}
                  >
                    {adminSignature ? 'Modifier la signature' : 'Ajouter une signature'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="stamp" className="mt-4">
              <Card className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Tampon "PAYÉ"</CardTitle>
                  <CardDescription>Ce tampon apparaîtra sur les factures réglées</CardDescription>
                </CardHeader>
                
                <CardContent className="p-4 pt-0">
                  {adminSignature?.paidStampData ? (
                    <div className="border rounded-md p-2 bg-gray-50 h-[150px] flex items-center justify-center">
                      <img 
                        src={adminSignature.paidStampData} 
                        alt="Tampon PAYÉ"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="border border-dashed rounded-md p-2 bg-gray-50 h-[150px] flex flex-col items-center justify-center text-gray-400">
                      <Stamp className="h-8 w-8 mb-2" />
                      Aucun tampon "PAYÉ" enregistré
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex justify-center">
                  <Button
                    variant="default"
                    onClick={() => openPaidStampDialog()}
                    disabled={!adminSignature}
                  >
                    {adminSignature?.paidStampData ? 'Modifier le tampon' : 'Ajouter un tampon'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="permanentStamp" className="mt-4">
              <Card className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Tampon permanent du cabinet</CardTitle>
                  <CardDescription>Ce tampon apparaîtra sur toutes les factures du cabinet</CardDescription>
                </CardHeader>
                
                <CardContent className="p-4 pt-0">
                  {adminSignature?.permanentStampData ? (
                    <div className="border rounded-md p-2 bg-gray-50 h-[150px] flex items-center justify-center">
                      <img 
                        src={adminSignature.permanentStampData} 
                        alt="Tampon permanent du cabinet"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="border border-dashed rounded-md p-2 bg-gray-50 h-[150px] flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="h-8 w-8 mb-2" />
                      Aucun tampon permanent enregistré
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex justify-center">
                  <Button
                    variant="default"
                    onClick={() => openPermanentStampDialog()}
                    disabled={!adminSignature}
                  >
                    {adminSignature?.permanentStampData ? 'Modifier le tampon' : 'Ajouter un tampon'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Dialogue de création/modification de signature */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {signatureData ? "Modifier la signature" : "Ajouter une signature"}
            </DialogTitle>
            <DialogDescription>
              Dessinez la signature électronique administrative (Christian)
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <SignatureCanvas
              onSave={setSignatureData}
              initialSignature={signatureData || undefined}
              width={350}
              height={200}
            />
          </div>
          
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button 
              onClick={handleSaveSignature}
              disabled={!signatureData || saveSignatureMutation.isPending}
            >
              {saveSignatureMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue d'importation du tampon PAYÉ */}
      <Dialog open={isPaidStampDialogOpen} onOpenChange={setIsPaidStampDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {adminSignature?.paidStampData ? "Modifier le tampon PAYÉ" : "Ajouter un tampon PAYÉ"}
            </DialogTitle>
            <DialogDescription>
              Importez une image pour le tampon qui apparaîtra sur les factures réglées
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="stamp-file">Importer une image</Label>
              <Input
                id="stamp-file"
                type="file"
                accept="image/*"
                onChange={handleStampFileChange}
                ref={stampFileInputRef}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Formats acceptés: PNG, JPG, GIF, SVG. Idéalement avec un fond transparent.
              </p>
            </div>
            
            {paidStampData && (
              <div className="mt-4 border rounded-md p-2 bg-gray-50 flex items-center justify-center">
                <img 
                  src={paidStampData} 
                  alt="Aperçu du tampon PAYÉ" 
                  className="max-h-[150px] max-w-full object-contain"
                />
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button 
              onClick={handleSavePaidStamp}
              disabled={!paidStampData || saveSignatureMutation.isPending}
            >
              {saveSignatureMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue d'importation du tampon permanent */}
      <Dialog open={isPermanentStampDialogOpen} onOpenChange={setIsPermanentStampDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {adminSignature?.permanentStampData ? "Modifier le tampon permanent" : "Ajouter un tampon permanent"}
            </DialogTitle>
            <DialogDescription>
              Importez une image pour le tampon qui apparaîtra sur toutes les factures du cabinet
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="permanent-stamp-file">Importer une image</Label>
              <Input
                id="permanent-stamp-file"
                type="file"
                accept="image/*"
                onChange={handlePermanentStampFileChange}
                ref={permanentStampFileInputRef}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Formats acceptés: PNG, JPG, GIF, SVG. Idéalement avec un fond transparent.
              </p>
            </div>
            
            {permanentStampData && (
              <div className="mt-4 border rounded-md p-2 bg-gray-50 flex items-center justify-center">
                <img 
                  src={permanentStampData} 
                  alt="Aperçu du tampon permanent" 
                  className="max-h-[150px] max-w-full object-contain"
                />
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button 
              onClick={handleSavePermanentStamp}
              disabled={!permanentStampData || saveSignatureMutation.isPending}
            >
              {saveSignatureMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}