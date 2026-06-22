import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Info, Search, Sparkles, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusWidgets } from "@/components/status-widgets";
import { SplashScreen } from "@/components/splash-screen";
import { BroadcastBanner } from "@/components/broadcast-banner";
import { DeveloperModal } from "@/components/developer-modal";
import { PurchaseModal } from "@/components/purchase-modal";
import { formatIDR, type Product } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Digital Store — Katalog Produk Digital" },
      { name: "description", content: "Toko digital dengan koleksi produk terbaru. Pembelian cepat via WhatsApp dengan pembayaran QRIS & Dana." },
      { property: "og:title", content: "Digital Store — Katalog Produk Digital" },
      { property: "og:description", content: "Toko digital dengan koleksi produk terbaru. Pembelian cepat via WhatsApp." },
    ],
  }),
  component: StorePage,
});

type SortMode = "default" | "latest";

function StorePage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("default");
  const [devOpen, setDevOpen] = useState(false);
  const [buyProduct, setBuyProduct] = useState<Product | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("products" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel("products-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => load()
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    let list = products.filter((p) =>
      p.name.toLowerCase().includes(query.trim().toLowerCase())
    );
    if (sort === "latest") {
      list = [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return list;
  }, [products, query, sort]);

  return (
    <>
      <SplashScreen loading={loading} />

      <div className="min-h-screen">
        {/* Navbar */}
        <header className="sticky top-0 z-30 px-3 sm:px-5 pt-3 pb-2">
          <nav className="glass-strong rounded-2xl px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img
                src="https://files.catbox.moe/3whqvw.png"
                alt="Logo"
                className="w-9 h-9 object-contain"
              />
              <span className="hidden sm:inline font-display text-sm neon-text tracking-wider">
                STORE
              </span>
            </Link>

            <div className="flex-1 relative min-w-0">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300/70"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari produk..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-cyan-400/20 text-sm text-cyan-50 placeholder:text-cyan-200/40 focus:outline-none focus:border-cyan-400/60 focus:neon-glow transition-all"
              />
            </div>

            <button
              onClick={() => setSort((s) => (s === "latest" ? "default" : "latest"))}
              className={`shrink-0 rounded-xl px-2.5 sm:px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-all border ${
                sort === "latest"
                  ? "border-cyan-400/70 text-slate-900 neon-glow"
                  : "border-cyan-400/25 text-cyan-100 hover:border-cyan-400/50"
              }`}
              style={
                sort === "latest"
                  ? { background: "linear-gradient(135deg, oklch(0.88 0.16 195), oklch(0.78 0.18 195))" }
                  : { background: "rgba(255,255,255,0.05)" }
              }
            >
              <Sparkles size={14} />
              <span className="hidden xs:inline">Terbaru</span>
            </button>

            <button
              onClick={() => setDevOpen(true)}
              className="shrink-0 rounded-xl p-2 border border-cyan-400/25 text-cyan-100 hover:border-cyan-400/60 hover:neon-glow transition-all"
              aria-label="Developer info"
            >
              <Info size={16} />
            </button>

            <div className="hidden sm:block">
              <StatusWidgets />
            </div>
          </nav>
          <div className="sm:hidden flex justify-end mt-2 px-1">
            <StatusWidgets />
          </div>
        </header>

        <main className="px-3 sm:px-5 pb-12 max-w-6xl mx-auto">
          <BroadcastBanner />

          {/* Hero */}
          <section className="text-center py-6 sm:py-10">
            <h1 className="font-display text-3xl sm:text-5xl neon-text tracking-wide">
              Digital Store
            </h1>
            <p className="text-sm text-cyan-100/70 mt-2 max-w-md mx-auto">
              Koleksi produk digital terkurasi. Beli langsung via WhatsApp.
            </p>
          </section>

          {/* Products */}
          {!loading && filtered.length === 0 && (
            <div className="glass rounded-2xl py-12 text-center text-cyan-100/70">
              <ShoppingBag className="mx-auto mb-3 text-cyan-400/60" size={32} />
              <p className="text-sm">
                {products.length === 0
                  ? "Belum ada produk. Tambahkan dari /admin."
                  : "Tidak ada produk yang cocok."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="glass rounded-2xl overflow-hidden flex flex-col group hover:neon-glow transition-all duration-300"
              >
                <div className="aspect-square overflow-hidden bg-black/20">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <h3 className="text-sm font-semibold text-cyan-50 line-clamp-2 leading-snug">
                    {p.name}
                  </h3>
                  <p className="font-display text-base neon-text">{formatIDR(p.price)}</p>
                  <button
                    onClick={() => setBuyProduct(p)}
                    className="mt-auto w-full rounded-xl py-2 text-sm font-semibold text-slate-900 transition-all hover:scale-[1.02]"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.88 0.16 195), oklch(0.78 0.18 195))",
                      boxShadow: "0 0 16px rgba(34,211,238,0.45)",
                    }}
                  >
                    Beli
                  </button>
                </div>
              </article>
            ))}
          </div>
        </main>

        <footer className="text-center text-[11px] text-cyan-200/40 pb-4">
          © {new Date().getFullYear()} Digital Store
        </footer>
      </div>

      <DeveloperModal open={devOpen} onClose={() => setDevOpen(false)} />
      <PurchaseModal
        open={!!buyProduct}
        onClose={() => setBuyProduct(null)}
        product={buyProduct}
      />
    </>
  );
}
