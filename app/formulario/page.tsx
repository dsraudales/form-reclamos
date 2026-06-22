"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const schema = z.object({
  fullName: z.string().trim().min(3, "Ingrese su nombre completo.").max(180),
  clientCode: z.string().trim().min(3, "Ingrese el número o código de cliente.").max(80),
  photo: z
    .custom<FileList>()
    .refine((files) => files && files.length === 1, "Adjunte una fotografía.")
    .refine(
      (files) =>
        files &&
        ["image/jpeg", "image/png", "image/webp"].includes(files[0]?.type),
      "Solo se permiten imágenes JPG, PNG o WEBP."
    )
    .refine(
      (files) => files && files[0]?.size <= MAX_FILE_SIZE,
      "El archivo debe pesar 20 MB o menos."
    )
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

    try {
      const file = values.photo[0];
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";

      const urlRes = await fetch("/api/public/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ext })
      });

      if (!urlRes.ok) {
        throw new Error("upload-url failed");
      }

      const { path, token, bucket } = await urlRes.json();

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file, { contentType: file.type });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const submitRes = await fetch("/api/public/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          clientCode: values.clientCode,
          photoPath: path,
          originalName: file.name,
          mimeType: file.type,
          sizeBytes: file.size
        })
      });

      if (!submitRes.ok) {
        throw new Error("submission failed");
      }

      reset();
      setMessage("Solicitud recibida. Gracias por enviar la información.");
    } catch {
      setIsError(true);
      setMessage("No fue posible procesar la solicitud. Revise los datos e intente nuevamente.");
    }
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

      <section className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Formulario público</CardTitle>
            <CardDescription>Complete los datos y adjunte una fotografía clara del recibo.</CardDescription>
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

              <div className="space-y-2">
                <Label htmlFor="photo">Fotografía del recibo</Label>
                <Input id="photo" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" {...register("photo")} />
                {errors.photo ? <p className="text-sm text-destructive">{String(errors.photo.message)}</p> : null}
              </div>

              {message ? (
                <p className={isError ? "text-sm text-destructive" : "text-sm font-medium text-primary"}>{message}</p>
              ) : null}

              <Button type="submit" disabled={isSubmitting}>
                <Upload className="h-4 w-4" />
                {isSubmitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
