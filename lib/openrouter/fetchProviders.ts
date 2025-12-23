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
    // Parse model ID - KEEP the :free suffix as it's a different model!
    // e.g., "meta-llama/llama-3.3-70b-instruct:free" -> author="meta-llama", slug="llama-3.3-70b-instruct:free"
    const [author, ...slugParts] = model.split("/");
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

    // Transform each endpoint to a provider entry
    // The variant tag is important - it specifies the exact endpoint variant
    const allProviders = data.data.endpoints.map((endpoint) => {
      // Construct provider ID including tag (e.g., "DeepInfra:bf16")
      // Use colon as separator since OpenRouter uses this format
      const providerId = endpoint.tag
        ? `${endpoint.provider_name}:${endpoint.tag}`
        : endpoint.provider_name;

      const supportsTools =
        endpoint.supported_parameters?.includes("tools") ?? false;
      const supportsSystemPrompt =
        endpoint.supported_parameters?.includes("system_prompt") ?? false;

      // Display name shows provider and tag if present
      const displayName = endpoint.tag
        ? `${endpoint.provider_name} (${endpoint.tag})`
        : endpoint.provider_name;

      return {
        id: providerId,
        name: displayName,
        supportsTools,
        supportsSystemPrompt,
        contextLength: endpoint.context_length,
        pricing: endpoint.pricing,
      };
    });

    // Filter to only include providers that support tools
    const providers = allProviders.filter((p) => p.supportsTools);

    // Sort by name
    providers.sort((a, b) => a.name.localeCompare(b.name));

    console.log("[FETCH PROVIDERS] Final providers:", providers.map(p => p.id));

    return providers;
  } catch (error) {
    console.error("Error fetching providers:", error);
    throw error;
  }
}
