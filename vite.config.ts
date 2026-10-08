import { defineConfig, loadEnv, type Plugin } from "vite";
import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";

const SITE = "https://www.amateurflorist.co";

// Adds every product page to dist/sitemap.xml at build time, so Google can find
// each bouquet (public/sitemap.xml only lists the fixed pages). Reads the
// products over Supabase REST with the public anon key. If that fails the build
// still succeeds and the sitemap keeps just the fixed pages. Products added in
// Supabase appear in the sitemap from the next deploy.
function productSitemap(env: Record<string, string>): Plugin {
  return {
    name: "product-sitemap",
    apply: "build",
    async closeBundle() {
      const url = process.env["VITE_SUPABASE_URL"] || env["VITE_SUPABASE_URL"];
      const key = process.env["VITE_SUPABASE_ANON_KEY"] || env["VITE_SUPABASE_ANON_KEY"];
      if (!url || !key) { console.warn("sitemap: no Supabase env, product pages not added"); return; }
      const out = resolve(__dirname, "dist/sitemap.xml");
      try {
        const res = await fetch(`${url}/rest/v1/products?select=id&order=name.asc`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows: { id: string }[] = await res.json();
        const entries = rows.map(p => [
          "  <url>",
          `    <loc>${SITE}/product-details.html?id=${encodeURIComponent(p.id)}</loc>`,
          "    <changefreq>weekly</changefreq>",
          "    <priority>0.7</priority>",
          "  </url>",
        ].join("\n")).join("\n");
        const base = readFileSync(out, "utf8");
        writeFileSync(out, base.replace("</urlset>", `${entries}\n</urlset>`));
        console.log(`sitemap: added ${rows.length} product pages`);
      } catch (e) {
        console.warn("sitemap: product pages not added:", (e as Error).message);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    root: ".",
    plugins: [productSitemap(env)],
    build: {
      outDir: "dist",
      rollupOptions: {
        input: {
          main:              resolve(__dirname, "index.html"),
          shop:              resolve(__dirname, "shop.html"),
          about:             resolve(__dirname, "about.html"),
          cart:              resolve(__dirname, "cart.html"),
          checkout:          resolve(__dirname, "checkout.html"),
          productDetails:    resolve(__dirname, "product-details.html"),
          orderConfirmation: resolve(__dirname, "order-confirmation.html"),
          weddings:          resolve(__dirname, "weddings.html"),
          notFound:          resolve(__dirname, "404.html"),
        },
      },
    },
  };
});
