import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "track_order",
  title: "Track order",
  description: "Track an ALM International order using the order number and the phone number used at checkout.",
  inputSchema: {
    order_number: z.string().trim().min(3).describe("The order number, e.g. ALM-2026-000123."),
    phone: z.string().trim().min(6).describe("The phone number used at checkout."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_number, phone }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb.rpc("track_order", { _order_number: order_number, _phone: phone });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return { content: [{ type: "text", text: "No matching order found." }] };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(row, null, 2) }],
      structuredContent: { order: row },
    };
  },
});
