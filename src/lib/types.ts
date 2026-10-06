export type Category = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  createdAt: string;
  sortOrder: number;
};

export type Tag = {
  id: string;
  categoryId: string;
  name: string;
  color: string;
};

export type Suggestion = {
  id: string;
  categoryId: string;
  title: string;
  body: string;
  authorName: string;
  tagIds: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
};

export type Reply = {
  id: string;
  suggestionId: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type StoreData = {
  categories: Category[];
  tags: Tag[];
  suggestions: Suggestion[];
  replies: Reply[];
};

export type SortMode = "recent" | "created" | "replies";
