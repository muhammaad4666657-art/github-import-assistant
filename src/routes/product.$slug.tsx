import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Minus, Plus, ShoppingBag, Truck, ShieldCheck, Heart, Zap, MessageCircle, BadgeCheck, ImagePlus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/product-image";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { compressImage } from "@/lib/compress-image";
import { toast } from "sonner";

const MAX_VIDEO_MB = 20;
const MAX_FILES = 4;


export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug.replace(/-/g, " ")} — ALM International` }] }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();
  const wishlist = useWishlist();
  const [product, setProduct] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const [files, setFiles] = useState<File[]>([]);
  const [hasPurchased, setHasPurchased] = useState(false);

  const loadReviews = async (productId: string) => {
    const { data: rev } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("approved", true)
      .order("created_at", { ascending: false });
    setReviews(rev ?? []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("products").select("*, categories(name,slug)").eq("slug", slug).maybeSingle();
      setProduct(data);
      setLoading(false);
      if (data) await loadReviews(data.id);
      const { data: st } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      setSettings(st);
    })();
  }, [slug]);

  // Check if current user has purchased this product (for verified badge)
  useEffect(() => {
    if (!user || !product) { setHasPurchased(false); return; }
    (async () => {
      const { data } = await supabase
        .from("order_items")
        .select("id, orders!inner(user_id)")
        .eq("product_id", product.id)
        .eq("orders.user_id", user.id)
        .limit(1);
      setHasPurchased((data?.length ?? 0) > 0);
    })();
  }, [user, product]);

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).slice(0, MAX_FILES - files.length);
    for (const f of arr) {
      if (f.type.startsWith("video/") && f.size > MAX_VIDEO_MB * 1024 * 1024) {
        toast.error(`Video "${f.name}" is over ${MAX_VIDEO_MB}MB`);
        return;
      }
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
        toast.error("Only images and videos are allowed");
        return;
      }
    }
    setFiles((p) => [...p, ...arr].slice(0, MAX_FILES));
  };

  const uploadMedia = async (reviewUserId: string) => {
    const uploaded: { url: string; path: string; type: "image" | "video" }[] = [];
    for (const raw of files) {
      const isVideo = raw.type.startsWith("video/");
      const file = isVideo ? raw : await compressImage(raw);
      const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase();
      const path = `${reviewUserId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("review-media").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (error) { toast.error(`Upload failed: ${error.message}`); continue; }
      const { data: pub } = supabase.storage.from("review-media").getPublicUrl(path);
      uploaded.push({ url: pub.publicUrl, path, type: isVideo ? "video" : "image" });
    }
    return uploaded;
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to leave a review"); navigate({ to: "/login" }); return; }
    setSubmitting(true);
    try {
      const media = files.length ? await uploadMedia(user.id) : [];
      const { error } = await supabase.from("reviews").upsert({
        product_id: product.id,
        user_id: user.id,
        rating: newRating,
        comment: newComment,
        media,
        verified: hasPurchased,
        approved: false,
      }, { onConflict: "product_id,user_id" });
      if (error) throw error;
      toast.success("Thanks! Your review is pending approval.");
      setNewComment(""); setNewRating(5); setFiles([]);
      await loadReviews(product.id);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!product) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <h1 className="text-3xl font-serif">Product not found</h1>
          <Link to="/products" className="inline-block mt-4 text-accent hover:underline">Browse all products →</Link>
        </div>
      </main>
      <Footer />
    </div>
  );

  const price = Number(product.sale_price ?? product.price);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        <nav className="text-xs text-muted-foreground mb-6 flex gap-2">
          <Link to="/" className="hover:text-accent">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-accent">Shop</Link>
          {product.categories && <><span>/</span><span>{product.categories.name}</span></>}
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 fade-up">
          <ProductGallery
            product={product}
            active={activeImg}
            setActive={setActiveImg}
            fav={wishlist.has(product.id)}
            onFav={() => { wishlist.toggle(product.id); toast.success(wishlist.has(product.id) ? "Removed from wishlist" : "Added to wishlist"); }}
          />


          <div>
            {product.categories && <div className="text-xs tracking-[0.3em] text-gold uppercase">{product.categories.name}</div>}
            <h1 className="mt-3 text-4xl md:text-5xl font-serif">{product.name}</h1>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-current" : ""}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
            </div>

            <p className="mt-4 text-muted-foreground">{product.short_description}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-medium">Rs. {price.toLocaleString()}</span>
              {product.sale_price && (
                <span className="text-lg line-through text-muted-foreground">Rs. {Number(product.price).toLocaleString()}</span>
              )}
            </div>

            <div className="mt-2 text-sm">
              {product.stock > 0
                ? <span className="font-medium tracking-wide" style={{ color: "oklch(0.55 0.16 55)" }}>Limited Stock Available ⚡</span>
                : <span className="text-destructive">Out of stock</span>}
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border border-border rounded-full">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-12 flex items-center justify-center hover:bg-secondary rounded-l-full" aria-label="Decrease">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} className="h-12 w-12 flex items-center justify-center hover:bg-secondary rounded-r-full" aria-label="Increase">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
                <div className="text-2xl font-medium">Rs. {(price * qty).toLocaleString()}</div>
              </div>
              <button onClick={() => { wishlist.toggle(product.id); toast.success(wishlist.has(product.id) ? "Removed from wishlist" : "Added to wishlist"); }}
                className={`h-12 w-12 rounded-full border flex items-center justify-center transition-all ${wishlist.has(product.id) ? "border-destructive bg-destructive/10 text-destructive scale-105" : "border-border hover:border-accent"}`} aria-label="Wishlist">
                <Heart className={`h-4 w-4 ${wishlist.has(product.id) ? "fill-current" : ""}`} />
              </button>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <button
                disabled={product.stock === 0}
                onClick={() => add({
                  product_id: product.id, name: product.name, slug: product.slug,
                  image_url: product.image_url, unit_price: price,
                }, qty)}
                className="h-12 inline-flex items-center justify-center gap-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40">
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </button>
              <button
                disabled={product.stock === 0}
                onClick={async () => {
                  await add({
                    product_id: product.id, name: product.name, slug: product.slug,
                    image_url: product.image_url, unit_price: price,
                  }, qty);
                  if (!user) navigate({ to: "/signup", search: { redirect: "/checkout" } as any });
                  else navigate({ to: "/checkout" });
                }}
                className="h-12 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 shadow-soft">
                <Zap className="h-4 w-4" /> Buy Now
              </button>
            </div>


            <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-secondary rounded-lg text-center">
                <Truck className="h-5 w-5 mx-auto text-gold" />
                <div className="mt-1.5">Delivery within 4 days</div>
              </div>
              <div className="p-3 bg-secondary rounded-lg text-center">
                <ShieldCheck className="h-5 w-5 mx-auto text-gold" />
                <div className="mt-1.5">100% Original</div>
              </div>
              <div className="p-3 bg-secondary rounded-lg text-center">
                <MessageCircle className="h-5 w-5 mx-auto text-gold" />
                <div className="mt-1.5">24/7 Support</div>
              </div>
            </div>

            {product.description && (
              <div className="mt-10">
                <h2 className="font-serif text-2xl">Description</h2>
                <p className="mt-3 text-muted-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-20 border-t border-border pt-12">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h2 className="text-3xl font-serif">Customer Reviews</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex text-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-current" : ""}`} />
                  ))}
                </div>
                <span><strong className="text-foreground">{avgRating.toFixed(1)}</strong> · {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
              </div>
            )}
          </div>

          {user ? (
            <form onSubmit={submitReview} className="mt-6 p-6 bg-card border border-border rounded-2xl max-w-2xl">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setNewRating(n)}>
                    <Star className={`h-6 w-6 text-gold ${n <= newRating ? "fill-current" : ""}`} />
                  </button>
                ))}
                {hasPurchased && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-green-700">
                    <BadgeCheck className="h-3 w-3" /> Verified purchase
                  </span>
                )}
              </div>
              <textarea
                placeholder="Share your experience..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
                maxLength={1000}
                className="mt-4 w-full min-h-24 p-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
              />

              <div className="mt-3">
                <label className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-secondary hover:bg-secondary/80 cursor-pointer text-xs">
                  <ImagePlus className="h-4 w-4" />
                  Add photos / video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { onPickFiles(e.target.files); e.currentTarget.value = ""; }}
                  />
                </label>
                <span className="ml-2 text-[11px] text-muted-foreground">Up to {MAX_FILES} files · video max {MAX_VIDEO_MB}MB</span>
                {files.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden bg-secondary">
                        {f.type.startsWith("video/") ? (
                          <video src={URL.createObjectURL(f)} className="h-full w-full object-cover" />
                        ) : (
                          <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-background/90 flex items-center justify-center"
                          aria-label="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button disabled={submitting} className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm">
                {submitting ? "Posting..." : "Post review"}
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">Reviews appear after admin approval.</p>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              <Link to="/login" className="text-accent hover:underline">Sign in</Link> to leave a review.
            </p>
          )}

          <div className="mt-10 space-y-6 max-w-2xl">
            {reviews.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>}
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-border pb-6">
                <div className="flex items-center gap-2">
                  <div className="flex text-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : ""}`} />
                    ))}
                  </div>
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-green-700">
                      <BadgeCheck className="h-3 w-3" /> Verified purchase
                    </span>
                  )}
                </div>
                {r.comment && <p className="mt-2 text-sm whitespace-pre-line">{r.comment}</p>}
                {Array.isArray(r.media) && r.media.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.media.map((m: any, i: number) => (
                      m.type === "video" ? (
                        <video key={i} src={m.url} controls preload="metadata" className="h-24 w-24 object-cover rounded-lg bg-secondary" />
                      ) : (
                        <a key={i} href={m.url} target="_blank" rel="noreferrer">
                          <img src={m.url} alt="Review media" loading="lazy" className="h-24 w-24 object-cover rounded-lg hover:opacity-90" />
                        </a>
                      )
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function ProductGallery({
  product, active, setActive, fav, onFav,
}: {
  product: any; active: number; setActive: (n: number) => void; fav: boolean; onFav: () => void;
}) {
  const gallery: string[] = (() => {
    const extras: string[] = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const main = product.image_url ? [product.image_url] : [];
    const all = [...main, ...extras.filter((u) => u !== product.image_url)];
    return all.length ? all : [product.image_url ?? ""];
  })();
  const safeIdx = Math.min(active, gallery.length - 1);
  const src = resolveImage(gallery[safeIdx]);
  const prev = () => setActive((safeIdx - 1 + gallery.length) % gallery.length);
  const next = () => setActive((safeIdx + 1) % gallery.length);

  return (
    <div>
      <div className="relative">
        <div className="aspect-square rounded-2xl overflow-hidden bg-secondary group shadow-soft">
          <img
            key={src}
            src={src}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-110 animate-in fade-in zoom-in-95"
          />
        </div>
        {product.tag && (
          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-background/90 text-xs tracking-widest uppercase text-gold border border-gold/30">
            {product.tag}
          </span>
        )}
        {product.sale_price && (
          <span className="absolute top-4 right-16 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium shadow-soft">
            -{Math.round((1 - Number(product.sale_price) / Number(product.price)) * 100)}% OFF
          </span>
        )}
        <button
          onClick={onFav}
          aria-label="Add to wishlist"
          className={`absolute top-4 right-4 h-10 w-10 rounded-full backdrop-blur bg-background/90 border flex items-center justify-center transition-all hover:scale-110 ${fav ? "border-destructive text-destructive" : "border-border hover:border-accent"}`}
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
        </button>

        {gallery.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={next} aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {gallery.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`aspect-square rounded-lg overflow-hidden bg-secondary border-2 transition-all ${i === safeIdx ? "border-accent shadow-gold" : "border-transparent hover:border-border opacity-70 hover:opacity-100"}`}
            >
              <img src={resolveImage(url)} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
