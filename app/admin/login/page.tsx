import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { authProviderConfig } from "@/lib/env";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm localEnabled={authProviderConfig.localEnabled} entraEnabled={authProviderConfig.entraEnabled} />
    </Suspense>
  );
}
