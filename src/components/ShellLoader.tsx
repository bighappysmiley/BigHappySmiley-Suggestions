import { listCategories } from "@/lib/store";
import { AppShell } from "./AppShell";

export async function ShellLoader({ children }: { children: React.ReactNode }) {
  const categories = await listCategories();
  return <AppShell categories={categories}>{children}</AppShell>;
}
