/**
 * Home Page
 *
 * Displays latest product variants (SKUs).
 * Each card links to /products/[variantId] for the detail page.
 */

import { Card } from "@/components";
import { getProductsForListing } from "@/lib/actions/product";
import { getCurrentUser } from "@/lib/auth/actions";

const Home = async () => {
  const user = await getCurrentUser();
  const products = await getProductsForListing();

  console.log("Home page - USER:", user);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <section aria-labelledby="latest" className="pb-12">
        <h2 id="latest" className="mb-6 text-heading-3 text-dark-900">
          Latest shoes
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Get All Products */}
          {products.map((product, idx) => (
            <Card
              key={idx}
              href={`/products/${product.productId}?color=${product.colorSlug}`}
              title={product.productName}
              price={product.price} // Show price of first variant
              imageSrc={product.image || "/placeholder.png"}
            />
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;
