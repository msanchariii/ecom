import { Card } from "@/components";
import Filters from "@/components/Filters";
import Sort from "@/components/Sort";
import { parseFilterParams } from "@/lib/utils/query";
import { getAllProducts, testQuery, testQuery2 } from "@/lib/actions/product";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const testData = await testQuery();
  const testData2 = await testQuery2("8f2341de-817c-433d-8e93-64f506c6ce9c");
  console.log("Test:", testData[0]);
  console.log("Test 2:", testData2?.variants[0].sizes);

  const parsed = parseFilterParams(sp);
  const { products, totalCount } = await getAllProducts(parsed);

  // console.log("Products page - Total products:", totalCount);
  // console.log("Products page - First product:", products[0]);

  const activeBadges: string[] = [];
  (sp.gender
    ? Array.isArray(sp.gender)
      ? sp.gender
      : [sp.gender]
    : []
  ).forEach((g) =>
    activeBadges.push(String(g)[0].toUpperCase() + String(g).slice(1)),
  );
  (sp.size ? (Array.isArray(sp.size) ? sp.size : [sp.size]) : []).forEach((s) =>
    activeBadges.push(`Size: ${s}`),
  );
  (sp.color ? (Array.isArray(sp.color) ? sp.color : [sp.color]) : []).forEach(
    (c) => activeBadges.push(String(c)[0].toUpperCase() + String(c).slice(1)),
  );
  (sp.price ? (Array.isArray(sp.price) ? sp.price : [sp.price]) : []).forEach(
    (p) => {
      const [min, max] = String(p).split("-");
      const label =
        min && max
          ? `$${min} - $${max}`
          : min && !max
            ? `Over $${min}`
            : `$0 - $${max}`;
      activeBadges.push(label);
    },
  );
  // console.log("Active products:", products);
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="flex items-center justify-between py-6">
        <h1 className="text-heading-3 text-dark-900">New ({totalCount})</h1>
        <Sort />
      </header>

      {activeBadges.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeBadges.map((b, i) => (
            <span
              key={`${b}-${i}`}
              className="rounded-full border border-light-300 px-3 py-1 text-caption text-dark-900"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <Filters />
        <div>
          {products.length === 0 ? (
            <div className="rounded-lg border border-light-300 p-8 text-center">
              <p className="text-body text-dark-700">
                No products match your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-6">
              {products.map((p) => {
                const displayPrice = p.minPrice;
                const priceRange =
                  p.minPrice !== null &&
                  p.maxPrice !== null &&
                  p.minPrice !== p.maxPrice
                    ? `$${p.minPrice.toFixed(2)} - $${p.maxPrice.toFixed(2)}`
                    : p.minPrice !== null
                      ? `$${p.minPrice.toFixed(2)}`
                      : undefined;
                // Use defaultVariantId if available, otherwise use product ID
                const href = p.defaultVariantId
                  ? `/products/${p.defaultVariantId}`
                  : `/products/${p.id}`;
                return (
                  <Card
                    key={p.id}
                    title={p.name}
                    subtitle={p.subtitle ?? undefined}
                    imageSrc={p.imageUrl ?? "/shoes/shoe-1.jpg"}
                    price={priceRange}
                    href={href}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
