import { Card } from "@/components";
import { getLatestVariants } from "@/lib/actions/product";
import { getCurrentUser } from "@/lib/auth/actions";

const Home = async () => {
  const user = await getCurrentUser();
  const variants = await getLatestVariants(4);

  console.log("USER:", user);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <section aria-labelledby="latest" className="pb-12">
        <h2 id="latest" className="mb-6 text-heading-3 text-dark-900">
          Latest shoes
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {variants.map((v) => {
            const displayPrice = v.salePrice ?? v.price;
            const price =
              displayPrice !== null ? `$${displayPrice.toFixed(2)}` : undefined;
            const subtitle = v.subtitle
              ? `${v.subtitle} • ${v.colorName || ""} • ${v.sizeName || ""}`
              : `${v.colorName || ""} • ${v.sizeName || ""}`;
            return (
              <Card
                key={v.id}
                title={v.productName}
                subtitle={subtitle}
                imageSrc={v.imageUrl ?? "/shoes/shoe-1.jpg"}
                price={price}
                href={`/products/${v.id}`}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default Home;
