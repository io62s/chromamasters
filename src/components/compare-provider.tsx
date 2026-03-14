"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Painting } from "@/lib/types";

interface CompareContextType {
  pinned: Painting[];
  isPinned: (id: string) => boolean;
  togglePin: (painting: Painting) => void;
  clearPinned: () => void;
  showCompare: boolean;
  setShowCompare: (show: boolean) => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

const MAX_PINNED = 3;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [pinned, setPinned] = useState<Painting[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const isPinned = useCallback(
    (id: string) => pinned.some((p) => p.id === id),
    [pinned]
  );

  const togglePin = useCallback(
    (painting: Painting) => {
      setPinned((prev) => {
        if (prev.some((p) => p.id === painting.id)) {
          return prev.filter((p) => p.id !== painting.id);
        }
        if (prev.length >= MAX_PINNED) return prev;
        return [...prev, painting];
      });
    },
    []
  );

  const clearPinned = useCallback(() => {
    setPinned([]);
    setShowCompare(false);
  }, []);

  return (
    <CompareContext.Provider
      value={{ pinned, isPinned, togglePin, clearPinned, showCompare, setShowCompare }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within CompareProvider");
  return context;
}
