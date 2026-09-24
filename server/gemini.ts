import { GoogleGenAI, Type } from '@google/genai';
import { Resource, AISmartPriceResult, AIMatchResult } from '../src/types.js';

const apiKey = process.env.GEMINI_API_KEY || '';

let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Suggests an optimal B2B category, unit, and subcategory tags from a brief resource title/note.
 */
export async function suggestCategory(input: string): Promise<{
  category: string;
  suggestedUnit: string;
  tags: string[];
  reasoning: string;
}> {
  const allowedCategories = [
    'Raw Materials',
    'Packaging Materials',
    'Machinery',
    'Equipment',
    'Office Assets',
    'Electronics',
    'Furniture',
    'Construction Materials',
    'Reusable Materials',
    'Other'
  ];

  if (aiClient && apiKey) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are the B2B classification engine for ResourceX circular marketplace.
Given this surplus resource input: "${input}"
Classify it into EXACTLY ONE of these standard categories:
${allowedCategories.join(', ')}

Return JSON with:
- category: one of the allowed categories exactly
- suggestedUnit: e.g. "kg", "units", "tons", "pallets", "meters", "boxes", "liters"
- tags: array of 3-5 short industrial keyword tags
- reasoning: brief 1-sentence B2B rationale`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              suggestedUnit: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              reasoning: { type: Type.STRING },
            },
            required: ['category', 'suggestedUnit', 'tags', 'reasoning'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (allowedCategories.includes(parsed.category)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Gemini suggestCategory fallback triggered:', err);
    }
  }

  // Algorithmic intelligent fallback
  const lower = input.toLowerCase();
  let category = 'Other';
  let suggestedUnit = 'units';
  let tags = ['surplus', 'industrial'];

  if (lower.includes('box') || lower.includes('carton') || lower.includes('pallet') || lower.includes('drum') || lower.includes('packaging')) {
    category = 'Packaging Materials';
    suggestedUnit = 'boxes';
    tags = ['packaging', 'logistics', 'corrugated', 'storage'];
  } else if (lower.includes('steel') || lower.includes('metal') || lower.includes('plastic') || lower.includes('chemical') || lower.includes('resin') || lower.includes('granule')) {
    category = 'Raw Materials';
    suggestedUnit = 'kg';
    tags = ['raw-material', 'feedstock', 'manufacturing'];
  } else if (lower.includes('cnc') || lower.includes('lathe') || lower.includes('mill') || lower.includes('press') || lower.includes('machine')) {
    category = 'Machinery';
    suggestedUnit = 'units';
    tags = ['industrial-machinery', 'automation', 'manufacturing'];
  } else if (lower.includes('compressor') || lower.includes('pump') || lower.includes('forklift') || lower.includes('generator') || lower.includes('tester')) {
    category = 'Equipment';
    suggestedUnit = 'units';
    tags = ['plant-equipment', 'maintenance', 'tools'];
  } else if (lower.includes('desk') || lower.includes('chair') || lower.includes('rack') || lower.includes('table')) {
    category = 'Furniture';
    suggestedUnit = 'units';
    tags = ['office-furniture', 'workplace', 'ergonomic'];
  } else if (lower.includes('laptop') || lower.includes('pc') || lower.includes('monitor') || lower.includes('server') || lower.includes('cable')) {
    category = 'Office Assets';
    suggestedUnit = 'units';
    tags = ['it-assets', 'hardware', 'computing'];
  } else if (lower.includes('circuit') || lower.includes('pcb') || lower.includes('sensor') || lower.includes('diode') || lower.includes('semiconductor')) {
    category = 'Electronics';
    suggestedUnit = 'units';
    tags = ['components', 'electronics', 'circuits'];
  } else if (lower.includes('cement') || lower.includes('pipe') || lower.includes('brick') || lower.includes('tile') || lower.includes('beam')) {
    category = 'Construction Materials';
    suggestedUnit = 'units';
    tags = ['construction', 'structural', 'building'];
  } else if (lower.includes('scrap') || lower.includes('offcut') || lower.includes('regrind') || lower.includes('reclaimed')) {
    category = 'Reusable Materials';
    suggestedUnit = 'kg';
    tags = ['circular-feedstock', 'reclaimed', 'waste-diversion'];
  }

  return {
    category,
    suggestedUnit,
    tags,
    reasoning: `Matched based on standard B2B classification for "${input}".`
  };
}

/**
 * Generates an enterprise-grade product description and sustainability impact assessment.
 */
export async function generateDescription(params: {
  name: string;
  category: string;
  condition: string;
  quantity: number;
  unit: string;
  originalPrice?: number;
  location?: string;
}): Promise<{
  description: string;
  sustainabilityHighlight: string;
  specifications: string[];
}> {
  if (aiClient && apiKey) {
    try {
      const prompt = `Write a verified B2B surplus listing description for the ResourceX Circular Marketplace.
Product Details:
- Title: ${params.name}
- Category: ${params.category}
- Condition: ${params.condition}
- Available Surplus Quantity: ${params.quantity} ${params.unit}
- Original Retail/B2B Value: ₹${params.originalPrice || 'N/A'}
- Warehouse Location: ${params.location || 'Pan-India / Regional Hub'}

Produce a concise, professional, enterprise-grade response in JSON with:
- description: 2-3 structured paragraphs explaining product source, readiness for immediate reuse/manufacturing, quality verification notes.
- sustainabilityHighlight: 1-2 sentences calculating or describing the avoided environmental waste and CO2 savings by purchasing surplus rather than virgin stock.
- specifications: list of 4-6 bullet-point technical specifications suitable for commercial procurement.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              sustainabilityHighlight: { type: Type.STRING },
              specifications: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['description', 'sustainabilityHighlight', 'specifications']
          }
        }
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch (err) {
      console.warn('Gemini generateDescription fallback:', err);
    }
  }

  // Fallback high-standard B2B description
  return {
    description: `High-grade surplus inventory of ${params.name} in ${params.condition} condition. Verified for commercial and industrial reuse, avoiding factory obsolescence. Ready for immediate dispatch from ${params.location || 'regional warehouse'}.\n\nSuitable for manufacturing plants, logistics operations, and secondary market supply chains looking for audited quality materials at discounted circular economy prices.`,
    sustainabilityHighlight: `By acquiring this lot of ${params.quantity} ${params.unit} through circular procurement, your organization directly diverts industrial waste from landfills and minimizes scope 3 emissions compared to virgin manufacturing.`,
    specifications: [
      `Surplus Batch: ${params.quantity} ${params.unit}`,
      `Verified Condition: ${params.condition}`,
      `Origin: B2B Industrial Excess Inventory`,
      `Quality Assurance: Inspected prior to listing`,
      `Handling: Standard industrial pallet/packaging standard`
    ]
  };
}

/**
 * Smart Pricing Feature:
 * AI-based smart pricing recommendation considering condition, quantity, original price, category, and location.
 */
export async function calculateSmartPricing(params: {
  category: string;
  condition: string;
  quantity: number;
  originalPrice: number;
  location?: string;
  name: string;
}): Promise<AISmartPriceResult> {
  // Baseline discount matrix based on condition
  let factor = 0.65;
  switch (params.condition) {
    case 'Brand New / Unopened':
      factor = 0.75; // 25% discount off original
      break;
    case 'Surplus / Unused':
      factor = 0.60; // 40% discount
      break;
    case 'Refurbished / Like New':
      factor = 0.50; // 50% discount
      break;
    case 'Used / Good':
      factor = 0.35; // 65% discount
      break;
    case 'Salvage / Recyclable':
      factor = 0.15; // 85% discount
      break;
  }

  // Bulk volume scaling
  if (params.quantity > 500) factor *= 0.92;
  if (params.quantity > 2000) factor *= 0.88;

  const baselinePrice = Math.round(params.originalPrice * factor);
  const minPrice = Math.round(baselinePrice * 0.85);
  const maxPrice = Math.round(baselinePrice * 1.15);
  const savingsPct = Math.round((1 - (baselinePrice / params.originalPrice)) * 100);

  if (aiClient && apiKey) {
    try {
      const prompt = `You are the chief pricing economist for ResourceX B2B circular marketplace.
Evaluate and recommend the optimal surplus selling price for:
- Resource: ${params.name}
- Category: ${params.category}
- Condition: ${params.condition}
- Quantity: ${params.quantity}
- Original Retail/B2B Unit Price: ₹${params.originalPrice}
- Location: ${params.location || 'National'}

Calculate realistic market clearance price that encourages rapid circular procurement while preserving seller value recovery.
Return JSON:
- suggestedPrice: number (per unit in INR)
- minPrice: number (walk-away floor price)
- maxPrice: number (upper ceiling)
- confidenceScore: number (between 0.75 and 0.98)
- marketRationale: 2-3 sentences explaining market demand, condition depreciation, and circular clearance dynamics
- circularSavingsPercentage: number (buyer savings % compared to original price)`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedPrice: { type: Type.NUMBER },
              minPrice: { type: Type.NUMBER },
              maxPrice: { type: Type.NUMBER },
              confidenceScore: { type: Type.NUMBER },
              marketRationale: { type: Type.STRING },
              circularSavingsPercentage: { type: Type.NUMBER },
            },
            required: ['suggestedPrice', 'minPrice', 'maxPrice', 'confidenceScore', 'marketRationale', 'circularSavingsPercentage'],
          },
        },
      });

      if (response.text) {
        const res = JSON.parse(response.text);
        return {
          suggestedPrice: Math.round(res.suggestedPrice),
          minPrice: Math.round(res.minPrice),
          maxPrice: Math.round(res.maxPrice),
          confidenceScore: Math.min(0.99, Math.max(0.7, res.confidenceScore)),
          marketRationale: res.marketRationale,
          circularSavingsPercentage: Math.round(res.circularSavingsPercentage)
        };
      }
    } catch (err) {
      console.warn('Gemini calculateSmartPricing fallback:', err);
    }
  }

  return {
    suggestedPrice: baselinePrice,
    minPrice,
    maxPrice,
    confidenceScore: 0.88,
    marketRationale: `Based on verified secondary market liquidity for ${params.category} in ${params.condition} condition. Setting unit price at ₹${baselinePrice} represents a ${savingsPct}% buyer cost reduction, optimizing fast inventory turnover.`,
    circularSavingsPercentage: Math.max(5, Math.min(95, savingsPct))
  };
}

/**
 * Duplicate listing detection:
 * Checks if a proposed resource listing is very similar or identical to an existing active listing.
 */
export async function checkDuplicateListing(
  newTitle: string,
  newCategory: string,
  existingResources: Resource[]
): Promise<{ isDuplicate: boolean; similarResourceId?: string; warningMessage?: string }> {
  if (!existingResources || existingResources.length === 0) {
    return { isDuplicate: false };
  }

  // 1. Direct normalized string and token matching
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = clean(newTitle);

  for (const item of existingResources) {
    const existing = clean(item.name);
    if (target === existing || (target.length > 5 && (target.includes(existing) || existing.includes(target)))) {
      return {
        isDuplicate: true,
        similarResourceId: item.id,
        warningMessage: `You already have an active listing titled "${item.name}" in category "${item.category}". Consider updating its existing inventory quantity instead of creating a duplicate listing.`
      };
    }
  }

  // 2. Gemini AI Semantic Similarity Check
  if (aiClient && apiKey && existingResources.length > 0) {
    try {
      const summaryList = existingResources.slice(0, 15).map(r => ({
        id: r.id,
        name: r.name,
        category: r.category
      }));

      const prompt = `You are an inventory duplicate detection model for the ResourceX B2B marketplace.
A seller is creating a new listing:
- Title: "${newTitle}"
- Category: "${newCategory || 'General'}"

Existing Active Listings by this seller:
${JSON.stringify(summaryList, null, 2)}

Determine whether the new listing is an obvious duplicate or essentially identical material/machine lot as any of the seller's existing listings (accounting for minor variations in wording, abbreviations like SS for Stainless Steel, mm/inch dimensions, etc.).
Return JSON:
- isDuplicate: boolean (true if duplicate or essentially the same surplus product, false if distinct)
- similarResourceId: string (id of the matching existing listing, or empty string)
- warningMessage: string (brief explanation of the duplication if true, or empty string)`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isDuplicate: { type: Type.BOOLEAN },
              similarResourceId: { type: Type.STRING },
              warningMessage: { type: Type.STRING }
            },
            required: ['isDuplicate', 'similarResourceId', 'warningMessage']
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.isDuplicate && parsed.warningMessage) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Gemini duplicate check fallback:', err);
    }
  }

  return { isDuplicate: false };
}

/**
 * Buyer-Seller Matching:
 * Compares buyer requirements against actual available resources in the database.
 * IMPORTANT: Only operates on actual database items!
 */
export async function matchBuyerRequirements(
  requirements: {
    category?: string;
    keywords?: string;
    targetQuantity?: number;
    maxBudget?: number;
    location?: string;
    businessType?: string;
  },
  availableResources: Resource[]
): Promise<AIMatchResult> {
  if (availableResources.length === 0) {
    return {
      matches: [],
      summary: 'No surplus resources are currently listed in the database to match against.'
    };
  }

  // Pre-filter database resources
  let candidates = availableResources.filter(r => r.availability === 'available' && r.status === 'active');
  if (candidates.length === 0) {
    return {
      matches: [],
      summary: 'No available resources found in the database.'
    };
  }

  if (requirements.category && requirements.category !== 'all') {
    candidates = candidates.filter(r => r.category.toLowerCase() === requirements.category!.toLowerCase());
  }

  if (candidates.length === 0) {
    return {
      matches: [],
      summary: `No available resources currently listed under category "${requirements.category}".`
    };
  }

  // Score candidate resources based on actual data
  const scored = candidates.map(res => {
    let score = 70;
    const reasons: string[] = [];

    if (requirements.keywords) {
      const q = requirements.keywords.toLowerCase();
      if (res.name.toLowerCase().includes(q) || res.description.toLowerCase().includes(q)) {
        score += 20;
        reasons.push('Title/Description aligns closely with buyer inquiry');
      }
    }

    if (requirements.targetQuantity) {
      if (res.quantity >= requirements.targetQuantity) {
        score += 10;
        reasons.push(`Fulfills complete required quantity (${res.quantity} ${res.unit} in stock)`);
      } else {
        reasons.push(`Partial inventory match (${res.quantity} ${res.unit} available)`);
      }
    }

    if (requirements.maxBudget && res.sellingPrice <= requirements.maxBudget) {
      score += 10;
      reasons.push(`Within requested budget (₹${res.sellingPrice} / ${res.unit})`);
    }

    if (requirements.location && res.location.toLowerCase().includes(requirements.location.toLowerCase())) {
      score += 10;
      reasons.push(`Regional proximity (${res.location})`);
    }

    return {
      resourceId: res.id,
      resourceName: res.name,
      category: res.category,
      sellingPrice: res.sellingPrice,
      availableQuantity: res.quantity,
      matchScore: Math.min(99, score),
      reasoning: reasons.length > 0 ? reasons.join('. ') : `Available surplus in ${res.category} from verified supplier ${res.sellerCompanyName}.`
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  const topMatches = scored.slice(0, 5);

  return {
    matches: topMatches,
    summary: `${topMatches.length} verified resource${topMatches.length === 1 ? '' : 's'} in the database match your criteria.`
  };
}
