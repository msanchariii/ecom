import { Navbar, Footer } from "@/components";
import DiscountAnimation from "@/components/DiscountAnimation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DiscountAnimation
        text={[
          "Big Sale! Up to 50% Off",
          "Limited Time Offer! Shop Now",
          "New Arrivals Just Landed!",
          "Use Code SAVE50 for 50% Off",
        ]}
      />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
