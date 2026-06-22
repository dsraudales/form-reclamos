"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  fullName: z.string().trim().min(3, "Ingrese su nombre completo.").max(180),
  clientCode: z.string().trim().min(3, "Ingrese el número o código de cliente.").max(80),
  photos: z
    .custom<FileList>()
    .refine((files) => files && files.length >= 1, "Adjunte al menos una fotografía.")
    .refine((files) => files && files.length <= 5, "Puede adjuntar un máximo de 5 fotografías.")
    .refine(
      (files) =>
        files &&
        Array.from(files).every((file) =>
          ["image/jpeg", "image/png", "image/webp"].includes(file.type)
        ),
      "Solo se permiten imágenes JPG, JPEG, PNG o WEBP."
    )
    .refine(
      (files) => files && Array.from(files).every((file) => file.size <= 5 * 1024 * 1024),
      "Cada archivo debe pesar 5 MB o menos."
    ),
  website: z.string().max(0).optional()
});

type FormValues = z.infer<typeof schema>;

export default function FormularioPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setMessage(null);
    setIsError(false);
    const body = new FormData();
    body.append("fullName", values.fullName);
    body.append("clientCode", values.clientCode);
    body.append("website", values.website ?? "");
    Array.from(values.photos).forEach((file) => body.append("photos", file));

    const response = await fetch("/api/public/submissions", {
      method: "POST",
      body
    });

    if (!response.ok) {
      setIsError(true);
      setMessage("No fue posible procesar la solicitud. Revise los datos e intente nuevamente.");
      return;
    }

    reset();
    setMessage("Solicitud recibida. Gracias por enviar la información.");
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-5">
          <Image src="/logo.png" width={120} height={48} alt="CREE" priority />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Comisión Reguladora de Energía Eléctrica</p>
            <h1 className="text-xl font-semibold tracking-normal">Recepción de fotografías</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Formulario público</CardTitle>
            <CardDescription>Complete los datos y adjunte fotografías claras del caso.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input id="fullName" autoComplete="name" {...register("fullName")} />
                {errors.fullName ? <p className="text-sm text-destructive">{errors.fullName.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientCode">Número/Código del Cliente</Label>
                <Input id="clientCode" autoComplete="off" {...register("clientCode")} />
                {errors.clientCode ? <p className="text-sm text-destructive">{errors.clientCode.message}</p> : null}
              </div>

              <div className="hidden" aria-hidden="true">
                <Label htmlFor="website">Sitio web</Label>
                <Input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">Fotografías</Label>
                <Input id="photos" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple {...register("photos")} />
                {errors.photos ? <p className="text-sm text-destructive">{String(errors.photos.message)}</p> : null}
              </div>

              {message ? (
                <p className={isError ? "text-sm text-destructive" : "text-sm font-medium text-primary"}>{message}</p>
              ) : null}

              <Button type="submit" disabled={isSubmitting}>
                <Upload className="h-4 w-4" />
                {isSubmitting ? "Enviando" : "Enviar solicitud"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Carga segura
              </CardTitle>
              <CardDescription>
                Las fotografías se validan antes de almacenarse y no se publican en internet.
              </CardDescription>
            </CardHeader>
          </Card>
        </aside>
      </section>
    </main>
  );
}
