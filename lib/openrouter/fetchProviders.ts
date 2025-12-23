export interface Provider {
  id: string;
  name: string;
  supportsTools: boolean;
  supportsSystemPrompt: boolean;
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

    // Transform to a simpler format with tool and system_prompt support info
    const allProviders = data.data.endpoints.map((endpoint) => {
      // Construct provider ID from provider_name and tag (e.g., "DeepInfra/bf16")
      const providerId = endpoint.tag
        ? `${endpoint.provider_name}/${endpoint.tag}`
        : endpoint.provider_name;

      const supportsTools =
        endpoint.supported_parameters?.includes("tools") ?? false;
      const supportsSystemPrompt =
        endpoint.supported_parameters?.includes("system_prompt") ?? false;

      return {
        id: providerId,
        name: providerId, // Show full variant name like "DeepInfra/bf16"
        supportsTools,
        supportsSystemPrompt,
        contextLength: endpoint.context_length,
        pricing: endpoint.pricing,
      };
    });

    // Filter to only include providers that support tools
    // Note: system_prompt is implicitly supported by chat models - OpenRouter doesn't list it in supported_parameters
    const providers = allProviders.filter((p) => p.supportsTools);

    // Sort by name
    providers.sort((a, b) => a.name.localeCompare(b.name));

    return providers;
  } catch (error) {
    console.error("Error fetching providers:", error);
    throw error;
  }
}
