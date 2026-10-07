import type { StoreData } from "./types";

/** Bootstrap empty board — admins create categories; no demo content. */
export const SEED_DATA: StoreData = {
  categories: [],
  tags: [],
  suggestions: [],
  replies: [],
};
