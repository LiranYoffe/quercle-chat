export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  isFree: boolean;
  supportsTools: boolean;
}

interface OpenRouterModelResponse {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  supported_parameters?: string[];
}

interface OpenRouterModelsResponse {
  data: OpenRouterModelResponse[];
}

// Simple cache
let cachedModels: OpenRouterModel[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchModels(
  apiKey?: string
): Promise<OpenRouterModel[]> {
  // Check cache
  if (cachedModels && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log("[FETCH MODELS] Returning cached models");
    return cachedModels;
  }

  try {
    // Filter for models that support both tools and system_prompt
    const url =
      "https://openrouter.ai/api/v1/models?supported_parameters=tools,system_prompt";
    console.log("[FETCH MODELS] Fetching from:", url);

    const response = await fetch(url, {
      headers: {
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[FETCH MODELS] API error:", errorText);
      throw new Error("Failed to fetch models");
    }

    const data: OpenRouterModelsResponse = await response.json();
    console.log("[FETCH MODELS] Received", data.data.length, "models");

    const models: OpenRouterModel[] = data.data.map((model) => {
      const isFree =
        model.id.includes(":free") ||
        (model.pricing?.prompt === "0" && model.pricing?.completion === "0");

      return {
        id: model.id,
        name: model.name,
        description: model.description,
        contextLength: model.context_length,
        pricing: model.pricing,
        isFree,
        supportsTools: true, // All returned models support tools due to query param
      };
    });

    // Sort: free first, then by name
    models.sort((a, b) => {
      if (a.isFree !== b.isFree) {
        return a.isFree ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    // Update cache
    cachedModels = models;
    cacheTimestamp = Date.now();

    return models;
  } catch (error) {
    console.error("[FETCH MODELS] Error:", error);
    throw error;
  }
}

// Export cache clearing function for testing/refresh
export function clearModelsCache(): void {
  cachedModels = null;
  cacheTimestamp = 0;
}
