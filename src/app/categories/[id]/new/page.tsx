import Link from "next/link";
import { notFound } from "next/navigation";
import { NewSuggestionForm } from "@/components/NewSuggestionForm";
import { getCategory, listTags } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export default async function NewSuggestionPage({ params }: Params) {
  const { id } = await params;
  const category = await getCategory(id);
  if (!category) notFound();
  const tags = await listTags(id);

  return (
    <>
      <header className="page-header">
        <div>
          <p style={{ marginBottom: 4 }}>
            <Link href={`/categories/${category.id}`} className="btn btn-ghost btn-sm">
              ← {category.emoji} {category.name}
            </Link>
          </p>
          <h1>New suggestion</h1>
          <p>Create a thread in this category, like a new forum post.</p>
        </div>
      </header>
      <div className="page-body">
        <NewSuggestionForm categoryId={category.id} tags={tags} />
      </div>
    </>
  );
}
