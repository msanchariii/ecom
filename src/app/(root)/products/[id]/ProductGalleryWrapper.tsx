"use client";

import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryWrapperProps {
  productId: string;
  images: string[];
  colorName: string;
}

export default function ProductGalleryWrapper({
  productId,
  images,
  colorName,
}: ProductGalleryWrapperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [colorName]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (images.length === 0) return;
      setActiveIndex((i) => (i + dir + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!mainRef.current) return;
      if (!document.activeElement) return;
      if (!mainRef.current.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (images.length === 0) {
    return null;
  }

  return (
    <section
      ref={mainRef}
      className="flex w-full flex-col gap-4 lg:flex-row lg:sticky lg:top-6"
    >
      {/* Thumbnails */}
      <div className="order-2 flex gap-3 basis-20 lg:order-1 lg:flex-col">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            aria-label={`Thumbnail ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-light-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500 ${
              i === activeIndex ? "ring-dark-500" : ""
            }`}
          >
            <Image
              src={src}
              alt={`Thumbnail ${i + 1}`}
              width={128}
              height={128}
              className="object-cover object-center w-full h-full"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="order-1 relative flex-1 lg:order-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-light-100">
          <Image
            src={images[activeIndex]}
            alt={`${colorName} - Image ${activeIndex + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover object-center"
            priority={activeIndex === 0}
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-light-100/80 p-2 backdrop-blur-sm transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6 text-dark-900" />
              </button>
              <button
                onClick={() => go(1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-light-100/80 p-2 backdrop-blur-sm transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6 text-dark-900" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 rounded-full bg-dark-900/70 px-3 py-1 text-caption text-light-100 backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      </div>
    </section>
  );
}
