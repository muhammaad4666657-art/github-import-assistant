import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_products",
  title: "List products",
  description: "List active products in the ALM International catalog.",
  inputSchema: {
    search: z.string().trim().optional().describe("Optional name search filter."),
    limit: z.number().int().min(1).max(50).optional().describe("Max items to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let q = sb
      .from("products")
      .select("name, slug, price, sale_price, short_description, tag, stock")
      .eq("status", "active")
      .limit(limit ?? 20);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { products: data },
    };
  },
});
