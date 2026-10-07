import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/AdminPanel";
import { getPublicUser } from "@/lib/auth/session";
import { listCategories, listTags } from "@/lib/store";

export default async function AdminPage() {
  const user = await getPublicUser();
  if (!user) redirect("/login?redirect=/admin");
  if (!user.isAdmin) redirect("/");

  const [categories, tags] = await Promise.all([listCategories(), listTags()]);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Manage categories</h1>
          <p>
            Create and organize forum categories and their tags. Changes apply
            immediately for everyone using this board.
          </p>
        </div>
      </header>
      <AdminPanel categories={categories} tags={tags} />
    </>
  );
}
