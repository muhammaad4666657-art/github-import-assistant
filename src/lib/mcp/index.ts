import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import getMyOrders from "./tools/get-my-orders";
import trackOrder from "./tools/track-order";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "alm-international-mcp",
  title: "ALM International",
  version: "0.1.0",
  instructions:
    "Tools for ALM International — a premium skincare, cosmetics and home care store in Pakistan. Use list_products to browse the catalog, get_my_orders for the signed-in user's order history, and track_order to look up an order by order number + phone.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, getMyOrders, trackOrder],
});
