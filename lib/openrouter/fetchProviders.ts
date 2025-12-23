export interface Provider {
  id: string;
  name: string;
  supportsTools: boolean;
  contextLength?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export async function fetchProviders(
  model: string,
  apiKey?: string
): Promise<Provider[]> {
  try {
    // Parse model ID (e.g., "meta-llama/llama-3.1-8b-instruct" -> author="meta-llama", slug="llama-3.1-8b-instruct")
    const [author, ...slugParts] = model.replace(":free", "").split("/");
    const slug = slugParts.join("/");

    console.log("[FETCH PROVIDERS] Parsing model:", model);
    console.log("[FETCH PROVIDERS] Author:", author, "Slug:", slug);

    if (!author || !slug) {
      throw new Error("Invalid model format");
    }

    const url = `https://openrouter.ai/api/v1/models/${author}/${slug}/endpoints`;
    console.log("[FETCH PROVIDERS] Fetching from URL:", url);

    const response = await fetch(url, {
      headers: {
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });

    console.log("[FETCH PROVIDERS] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[FETCH PROVIDERS] API error:", errorText);
      throw new Error("Failed to fetch providers");
    }

    const data: {
      data: {
        id: string;
        name: string;
        endpoints: Array<{
          name: string;
          model_name: string;
          provider_name: string;
          tag?: string;
          context_length?: number;
          pricing?: {
            prompt: string;
            completion: string;
          };
          supported_parameters?: string[];
        }>;
      };
    } = await response.json();

    console.log("[FETCH PROVIDERS] Raw API response:", JSON.stringify(data, null, 2));

    // Transform to a simpler format with tool support info
    const providers = data.data.endpoints.map((endpoint) => {
      // Construct provider ID from provider_name and tag (e.g., "DeepInfra/bf16")
      const providerId = endpoint.tag
        ? `${endpoint.provider_name}/${endpoint.tag}`
        : endpoint.provider_name;

      return {
        id: providerId,
        name: providerId, // Show full variant name like "DeepInfra/bf16"
        supportsTools: endpoint.supported_parameters?.includes("tools") ?? false,
        contextLength: endpoint.context_length,
        pricing: endpoint.pricing,
      };
    });

    // Sort: tools-supporting first, then by name
    providers.sort((a, b) => {
      if (a.supportsTools !== b.supportsTools) {
        return a.supportsTools ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return providers;
  } catch (error) {
    console.error("Error fetching providers:", error);
    throw error;
  }
}
