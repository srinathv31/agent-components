"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useMemo,
} from "react";
import { DEFAULT_MODEL, type ModelConfig } from "@/lib/models";

interface ModelContextType {
  selectedModel: ModelConfig;
  setSelectedModel: (model: ModelConfig) => void;
  provider: ModelConfig["provider"];
  modelId: string;
}

const ModelContext = createContext<ModelContextType | null>(null);

interface ModelProviderProps {
  children: ReactNode;
  defaultModel?: ModelConfig;
}

export function ModelProvider({
  children,
  defaultModel = DEFAULT_MODEL,
}: ModelProviderProps) {
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(defaultModel);

  const value = useMemo<ModelContextType>(
    () => ({
      selectedModel,
      setSelectedModel,
      provider: selectedModel.provider,
      modelId: selectedModel.id,
    }),
    [selectedModel]
  );

  return (
    <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
  );
}

export function useModel(): ModelContextType {
  const context = useContext(ModelContext);

  if (!context) {
    throw new Error("useModel must be used within a ModelProvider");
  }

  return context;
}
