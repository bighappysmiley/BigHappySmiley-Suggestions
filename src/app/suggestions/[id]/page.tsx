import { notFound } from "next/navigation";
import { ThreadView } from "@/components/ThreadView";
import {
  getCategory,
  getSuggestion,
  listReplies,
  listTags,
} from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export default async function SuggestionPage({ params }: Params) {
  const { id } = await params;
  const suggestion = await getSuggestion(id);
  if (!suggestion) notFound();

  const [category, replies, tags] = await Promise.all([
    getCategory(suggestion.categoryId),
    listReplies(id),
    listTags(suggestion.categoryId),
  ]);
  if (!category) notFound();

  return (
    <ThreadView
      category={category}
      suggestion={suggestion}
      replies={replies}
      tags={tags}
    />
  );
}
