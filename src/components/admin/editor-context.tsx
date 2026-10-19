"use client";
import { createContext, useContext } from "react";

// Shared by every field so deep forms can show validation messages and report
// uploads without threading props through each level.
export const EditorContext = createContext<{
  errors: Record<string, string>;
  onUploading: (delta: number) => void;
}>({ errors: {}, onUploading: () => {} });
export const useEditor = () => useContext(EditorContext);
export const fieldId = (path: string) => `home-${path.replace(/\./g, "-")}`;
export function useFieldError(path: string) {
  return useEditor().errors[path];
}
