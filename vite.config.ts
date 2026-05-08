import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
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
      },
    },
  },
});