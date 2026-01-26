// a discount animation component
// using GSAP, text will go from right to left in a loop
// may have multiple lines of text separated by "|"
// using tailwindcss
"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

const DiscountAnimation: React.FC<{ text: string[] }> = ({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayText = text.join("       |       ") + "       |       ";

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    const textElements = container.querySelectorAll(".marquee-text");
    const firstElem = textElements[0] as HTMLElement;
    const textWidth = firstElem.offsetWidth;

    textElements.forEach((elem) => {
      gsap.to(elem, {
        x: `-=${textWidth}`,
        duration: 16,
        ease: "linear",
        repeat: -1,
        modifiers: {
          x: (x) => {
            const xValue = parseFloat(x);
            return `${xValue % textWidth}px`;
          },
        },
      });
    });
  }, [displayText]);

  return (
    <div
      ref={containerRef}
      className="bg-black py-2 overflow-hidden whitespace-nowrap"
    >
      <div className="inline-flex">
        <div className="marquee-text px-4 whitespace-pre text-lg font-light text-light-100">
          {displayText}
        </div>
        <div className="marquee-text px-4 whitespace-pre text-lg font-light text-light-100">
          {displayText}
        </div>
      </div>
    </div>
  );
};
export default DiscountAnimation;
