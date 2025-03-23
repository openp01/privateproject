import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Expense } from "@shared/schema";
import { PlusIcon, FileTextIcon, SearchIcon, FilterIcon, FileDown, Calendar, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HomeButton } from "@/components/ui/home-button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import ExpensesPreviewDialog from "@/components/ExpensesPreviewDialog";

export default function Expenses() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  // Récupération de toutes les dépenses
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      try {
        return await apiRequest("/api/expenses") as Expense[];
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les dépenses",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Filtrage des dépenses
  const filteredExpenses = expenses
    ? expenses.filter((expense) => {
        // Filtrage par recherche (sur la description)
        const matchesSearch = searchQuery === "" || 
          expense.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Filtrage par catégorie
        const matchesCategory = categoryFilter === "all" || 
          expense.category === categoryFilter;
        
        // Filtrage par date
        const expenseDate = new Date(expense.date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        const matchesDateRange = expenseDate >= startDate && expenseDate <= endDate;
        
        return matchesSearch && matchesCategory && matchesDateRange;
      })
    : [];

  // Calcul du total des dépenses filtrées
  const totalExpenses = filteredExpenses.reduce(
    (total, expense) => total + parseFloat(expense.amount.toString()),
    0
  );

  // Liste des catégories uniques pour le filtre
  const categories = expenses
    ? Array.from(new Set(expenses.map((expense) => expense.category)))
    : [];

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <HomeButton variant="outline" />
          <div>
            <h1 className="text-3xl font-bold">Gestion des Dépenses</h1>
            <p className="text-muted-foreground">
              Suivez et gérez toutes les dépenses du cabinet
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Bouton de prévisualisation PDF */}
          <ExpensesPreviewDialog
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            category={categoryFilter !== "all" ? categoryFilter : undefined}
            customTitle={categoryFilter !== "all" ? `REGISTRE DES DÉPENSES - ${categoryFilter.toUpperCase()}` : undefined}
          />
          
          {/* Dialogue d'exportation PDF */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Exporter pour comptable
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exporter les dépenses en PDF</DialogTitle>
                <DialogDescription>
                  Générez un document PDF des dépenses filtrées pour votre comptable
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Titre:</label>
                  <Input 
                    className="col-span-3" 
                    value={categoryFilter !== "all" 
                      ? `REGISTRE DES DÉPENSES - ${categoryFilter.toUpperCase()}`
                      : "REGISTRE DES DÉPENSES"
                    }
                    onChange={(e) => e.target.value}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Période:</label>
                  <div className="col-span-3 grid grid-cols-2 gap-2">
                    <Input 
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    />
                    <Input 
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => {
                    // Construire l'URL avec les paramètres
                    let url = "/api/expenses/export/pdf";
                    const params = new URLSearchParams();
                    
                    // Ajouter les dates
                    params.append("startDate", dateRange.startDate);
                    params.append("endDate", dateRange.endDate);
                    
                    // Ajouter la catégorie si elle est filtrée
                    if (categoryFilter !== "all") {
                      params.append("category", categoryFilter);
                      params.append("title", `REGISTRE DES DÉPENSES - ${categoryFilter.toUpperCase()}`);
                    }
                    
                    // Ajouter les paramètres à l'URL
                    if (params.toString()) {
                      url += `?${params.toString()}`;
                    }
                    
                    // Ouvrir une nouvelle fenêtre pour télécharger le PDF
                    window.open(url, "_blank");
                  }}
                >
                  Exporter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Link href="/expenses/new">
            <Button className="flex items-center">
              <PlusIcon className="mr-2 h-4 w-4" />
              Nouvelle Dépense
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total des dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pour la période sélectionnée
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Affinez la liste des dépenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Rechercher par description..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Dépenses</CardTitle>
          <CardDescription>
            {filteredExpenses.length} dépenses trouvées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune dépense trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode de paiement</TableHead>
                  <TableHead>Justificatif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(new Date(expense.date), "dd MMMM yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{parseFloat(expense.amount.toString()).toFixed(2)} €</TableCell>
                    <TableCell>{expense.paymentMethod}</TableCell>
                    <TableCell>
                      {expense.receiptUrl ? (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center"
                        >
                          <FileTextIcon className="h-4 w-4 mr-1" />
                          Voir
                        </a>
                      ) : (
                        "Non"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/expenses/${expense.id}`}>
                        <Button variant="outline" size="sm">
                          Détails
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}