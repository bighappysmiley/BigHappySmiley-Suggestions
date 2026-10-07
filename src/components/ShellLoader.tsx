import { listCategories } from "@/lib/store";
import { AuthProvider } from "./AuthProvider";
import { AppShell } from "./AppShell";

export async function ShellLoader({ children }: { children: React.ReactNode }) {
  const categories = await listCategories();
  return (
    <AuthProvider>
      <AppShell categories={categories}>{children}</AppShell>
    </AuthProvider>
  );
}
