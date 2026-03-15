import { useState, useCallback } from "react";
import { SavedRecipe } from "./types";

const STORAGE_KEY = "munch-recipes";

function load(): SavedRecipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(recipes: SavedRecipe[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>(load);

  const saveRecipe = useCallback((recipe: SavedRecipe) => {
    setRecipes(prev => {
      const filtered = prev.filter(r => r.id !== recipe.id);
      const next = [recipe, ...filtered];
      save(next);
      return next;
    });
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setRecipes(prev => {
      const next = prev.filter(r => r.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { recipes, saveRecipe, deleteRecipe };
}
