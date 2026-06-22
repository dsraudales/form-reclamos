"use client";

import { LockKeyhole } from "lucide-react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const localEnabled = process.env.NEXT_PUBLIC_ENABLE_LOCAL_LOGIN === "true";
  const entraEnabled = process.env.NEXT_PUBLIC_ENABLE_ENTRA_LOGIN === "true";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
      callbackUrl: "/admin"
    });
    setLoading(false);
    if (result?.ok) {
      window.location.assign("/admin");
      return;
    }
    setError(true);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5" />
            Panel administrativo CREE
          </CardTitle>
          <CardDescription>Ingrese con una cuenta institucional autorizada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {entraEnabled ? (
            <Button className="w-full" onClick={() => signIn("azure-ad", { callbackUrl: "/admin" })}>
              Continuar con Microsoft Entra ID
            </Button>
          ) : null}

          {localEnabled ? (
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="email">Correo institucional</Label>
                <Input id="email" name="email" type="email" autoComplete="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
              {(error || params.get("error")) ? (
                <p className="text-sm text-destructive">No fue posible iniciar sesión.</p>
              ) : null}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Validando" : "Ingresar"}
              </Button>
            </form>
          ) : null}

          {!entraEnabled && !localEnabled ? (
            <p className="text-sm text-muted-foreground">No hay proveedores de autenticación habilitados.</p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
