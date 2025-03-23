import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Patient, BookingFormData, patientFormSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientFormProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
}

export default function PatientForm({ formData, updateFormData, onNext }: PatientFormProps) {
  const [activeTab, setActiveTab] = useState("existing");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch patients for existing tab
  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients/search', searchQuery],
    queryFn: async ({ queryKey }) => {
      const [_, query] = queryKey;
      const response = await fetch(`/api/patients/search?q=${query}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des patients");
      }
      return response.json();
    },
  });

  // Form for new patient
  const form = useForm<Patient>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (patient: Omit<Patient, "id">) => {
      return await apiRequest("/api/patients", "POST", patient);
    },
    onSuccess: (newPatient) => {
      toast({
        title: "Patient créé",
        description: "Le patient a été créé avec succès",
      });
      updateFormData({ patient: newPatient });
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      onNext();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du patient",
        variant: "destructive",
      });
    },
  });

  const handleSelectPatient = (patient: Patient) => {
    updateFormData({ patient });
    onNext();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const onSubmit = (data: Patient) => {
    createPatientMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du patient</h3>
      
      {/* Patient Selection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">Patient existant</TabsTrigger>
          <TabsTrigger value="new">Nouveau patient</TabsTrigger>
        </TabsList>
        
        <TabsContent value="existing" className="mt-6">
          <div className="mb-6">
            <Label htmlFor="patientSearch" className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher un patient
            </Label>
            <div className="relative">
              <Input
                id="patientSearch"
                placeholder="Rechercher par nom, email ou téléphone"
                value={searchQuery}
                onChange={handleSearch}
                className="pl-3 pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="material-icons text-gray-400">search</span>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, idx) => (
                <Skeleton key={idx} className="h-20 w-full" />
              ))}
            </div>
          ) : patients && patients.length > 0 ? (
            <div className="mt-6 shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{patient.firstName} {patient.lastName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleSelectPatient(patient)}
                          className="text-primary hover:text-indigo-900"
                        >
                          Sélectionner
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              {searchQuery ? "Aucun patient trouvé" : "Commencez à taper pour rechercher un patient"}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="new" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-4">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-4">
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-6">
                      <FormLabel>Notes (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="bg-primary"
                  disabled={createPatientMutation.isPending}
                >
                  {createPatientMutation.isPending ? "Création en cours..." : "Créer et continuer"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
