import { notFound } from "next/navigation";
import { ThreadList } from "@/components/ThreadList";
import { getCategory, listSuggestions, listTags } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export default async function CategoryPage({ params }: Params) {
  const { id } = await params;
  const category = await getCategory(id);
  if (!category) notFound();

  const [suggestions, tags] = await Promise.all([
    listSuggestions(id),
    listTags(id),
  ]);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>
            {category.emoji} {category.name}
          </h1>
          <p>{category.description || "Suggestions for this category."}</p>
        </div>
      </header>
      <div className="page-body">
        <ThreadList
          categoryId={category.id}
          suggestions={suggestions}
          tags={tags}
        />
      </div>
    </>
  );
}
