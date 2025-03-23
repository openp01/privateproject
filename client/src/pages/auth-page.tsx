import { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { UserRole } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schéma de validation pour le formulaire de connexion
const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

// Schéma de validation pour le formulaire d'inscription
const registerSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit comporter au moins 3 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
  confirmPassword: z.string(),
  role: z.string().refine(val => Object.values(UserRole).includes(val as any), {
    message: "Rôle invalide",
  }),
  therapistId: z.number().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  // Attendre que les données soient chargées
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si l'utilisateur est déjà connecté, rediriger vers la page d'accueil
  if (user) {
    console.log("AuthPage: Utilisateur connecté, redirection vers /", user);
    return <Redirect to="/" />;
  }
  
  console.log("AuthPage: Aucun utilisateur connecté, affichage de la page d'authentification");

  return (
    <div className="flex min-h-screen">
      {/* Formulaire d'authentification */}
      <div className="flex flex-col justify-center w-full md:w-1/2 p-8 bg-white">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col items-center mb-6">
            <img src="/images/LaR_PICTO-Full.jpg" alt="Logo Cabinet Paramédical de la Renaissance" className="h-40 w-auto mb-4" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3fb549] to-[#266d2c] bg-clip-text text-transparent">Espace Connexion</h1>
            <p className="text-[#266d2c] mt-2 text-center">
              Connectez-vous ou créez un compte pour accéder au système.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "login" | "register")}>
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Section logo - version simplifiée */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-b from-[#266d2c] to-[#0d240f] p-8">
        <div className="max-w-md text-center">
          <img src="/images/LaR_LOGO-Rev.jpg" alt="Logo Cabinet Paramédical de la Renaissance" className="h-64 w-auto mx-auto" />
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  const isLoading = loginMutation.isPending;

  // Initialiser le formulaire avec React Hook Form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Fonction de soumission du formulaire
  function onSubmit(data: LoginFormValues) {
    console.log("Tentative de connexion avec:", data);
    loginMutation.mutate(data, {
      onSuccess: (user) => {
        console.log("Utilisateur connecté avec succès dans le formulaire:", user);
        // La redirection est gérée au niveau supérieur dans AuthPage via le hook useAuth
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte pour accéder au système
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <Input placeholder="Entrez votre nom d'utilisateur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Entrez votre mot de passe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();
  const isLoading = registerMutation.isPending;

  // Initialiser le formulaire avec React Hook Form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: UserRole.SECRETARIAT,
    },
  });

  // Fonction de soumission du formulaire
  function onSubmit(data: RegisterFormValues) {
    // Enlever confirmPassword avant d'envoyer au serveur
    const { confirmPassword, ...registerData } = data;
    console.log("Tentative d'inscription avec:", registerData);
    registerMutation.mutate(registerData);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscription</CardTitle>
        <CardDescription>
          Créez un nouveau compte pour accéder au système
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <Input placeholder="Entrez un nom d'utilisateur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Entrez votre adresse email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Créez un mot de passe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirmez votre mot de passe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.ADMIN}>Administrateur</SelectItem>
                      <SelectItem value={UserRole.SECRETARIAT}>Secrétariat</SelectItem>
                      <SelectItem value={UserRole.THERAPIST}>Thérapeute</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

