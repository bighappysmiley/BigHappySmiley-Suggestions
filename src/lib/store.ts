import { promises as fs } from "fs";
import path from "path";
import { SEED_DATA } from "./seed";
import type {
  Category,
  Reply,
  StoreData,
  Suggestion,
  Tag,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function cloneSeed(): StoreData {
  return structuredClone(SEED_DATA);
}

async function ensureStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as StoreData;
  } catch {
    const seed = cloneSeed();
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

async function writeStore(data: StoreData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

function id(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getStore(): Promise<StoreData> {
  return ensureStore();
}

export async function listCategories(): Promise<Category[]> {
  const store = await ensureStore();
  return [...store.categories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategory(idValue: string): Promise<Category | null> {
  const store = await ensureStore();
  return store.categories.find((c) => c.id === idValue) ?? null;
}

export async function createCategory(input: {
  name: string;
  description: string;
  emoji: string;
}): Promise<Category> {
  const store = await ensureStore();
  const category: Category = {
    id: id("cat"),
    name: input.name.trim(),
    description: input.description.trim(),
    emoji: input.emoji.trim() || "📁",
    createdAt: new Date().toISOString(),
    sortOrder: store.categories.length,
  };
  store.categories.push(category);
  await writeStore(store);
  return category;
}

export async function updateCategory(
  idValue: string,
  input: Partial<Pick<Category, "name" | "description" | "emoji">>,
): Promise<Category | null> {
  const store = await ensureStore();
  const category = store.categories.find((c) => c.id === idValue);
  if (!category) return null;
  if (input.name !== undefined) category.name = input.name.trim();
  if (input.description !== undefined) category.description = input.description.trim();
  if (input.emoji !== undefined) category.emoji = input.emoji.trim() || "📁";
  await writeStore(store);
  return category;
}

export async function deleteCategory(idValue: string): Promise<boolean> {
  const store = await ensureStore();
  const before = store.categories.length;
  store.categories = store.categories.filter((c) => c.id !== idValue);
  if (store.categories.length === before) return false;
  const suggestionIds = new Set(
    store.suggestions.filter((s) => s.categoryId === idValue).map((s) => s.id),
  );
  store.suggestions = store.suggestions.filter((s) => s.categoryId !== idValue);
  store.tags = store.tags.filter((t) => t.categoryId !== idValue);
  store.replies = store.replies.filter((r) => !suggestionIds.has(r.suggestionId));
  store.categories.forEach((c, index) => {
    c.sortOrder = index;
  });
  await writeStore(store);
  return true;
}

export async function listTags(categoryId?: string): Promise<Tag[]> {
  const store = await ensureStore();
  return store.tags.filter((t) => !categoryId || t.categoryId === categoryId);
}

export async function createTag(input: {
  categoryId: string;
  name: string;
  color: string;
}): Promise<Tag | null> {
  const store = await ensureStore();
  if (!store.categories.some((c) => c.id === input.categoryId)) return null;
  const tag: Tag = {
    id: id("tag"),
    categoryId: input.categoryId,
    name: input.name.trim(),
    color: input.color.trim() || "#5865F2",
  };
  store.tags.push(tag);
  await writeStore(store);
  return tag;
}

export async function deleteTag(idValue: string): Promise<boolean> {
  const store = await ensureStore();
  const before = store.tags.length;
  store.tags = store.tags.filter((t) => t.id !== idValue);
  if (store.tags.length === before) return false;
  for (const suggestion of store.suggestions) {
    suggestion.tagIds = suggestion.tagIds.filter((tid) => tid !== idValue);
  }
  await writeStore(store);
  return true;
}

export async function listSuggestions(categoryId: string): Promise<Suggestion[]> {
  const store = await ensureStore();
  return store.suggestions.filter((s) => s.categoryId === categoryId);
}

export async function getSuggestion(idValue: string): Promise<Suggestion | null> {
  const store = await ensureStore();
  return store.suggestions.find((s) => s.id === idValue) ?? null;
}

export async function createSuggestion(input: {
  categoryId: string;
  title: string;
  body: string;
  authorName: string;
  tagIds: string[];
}): Promise<Suggestion | null> {
  const store = await ensureStore();
  if (!store.categories.some((c) => c.id === input.categoryId)) return null;
  const validTagIds = store.tags
    .filter((t) => t.categoryId === input.categoryId && input.tagIds.includes(t.id))
    .map((t) => t.id);
  const timestamp = new Date().toISOString();
  const suggestion: Suggestion = {
    id: id("sug"),
    categoryId: input.categoryId,
    title: input.title.trim(),
    body: input.body.trim(),
    authorName: input.authorName.trim() || "Anonymous",
    tagIds: validTagIds,
    pinned: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    replyCount: 0,
  };
  store.suggestions.unshift(suggestion);
  await writeStore(store);
  return suggestion;
}

export async function togglePin(idValue: string): Promise<Suggestion | null> {
  const store = await ensureStore();
  const suggestion = store.suggestions.find((s) => s.id === idValue);
  if (!suggestion) return null;
  suggestion.pinned = !suggestion.pinned;
  await writeStore(store);
  return suggestion;
}

export async function listReplies(suggestionId: string): Promise<Reply[]> {
  const store = await ensureStore();
  return store.replies
    .filter((r) => r.suggestionId === suggestionId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createReply(input: {
  suggestionId: string;
  body: string;
  authorName: string;
}): Promise<Reply | null> {
  const store = await ensureStore();
  const suggestion = store.suggestions.find((s) => s.id === input.suggestionId);
  if (!suggestion) return null;
  const reply: Reply = {
    id: id("rep"),
    suggestionId: input.suggestionId,
    body: input.body.trim(),
    authorName: input.authorName.trim() || "Anonymous",
    createdAt: new Date().toISOString(),
  };
  store.replies.push(reply);
  suggestion.replyCount += 1;
  suggestion.updatedAt = reply.createdAt;
  await writeStore(store);
  return reply;
}

export async function resetStore(): Promise<StoreData> {
  const seed = cloneSeed();
  await writeStore(seed);
  return seed;
}
