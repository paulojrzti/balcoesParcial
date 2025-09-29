"use client";
// components/SimpleMenu.tsx
import React, { useState, useRef, useLayoutEffect, useCallback } from "react";
import { gsap } from "gsap";

const menuItems = [
  { label: "Home", link: "/" },
  { label: "Categorias", link: "/categorias" },
  { label: "Metas", link: "/metas" }
];

const SimpleMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    if (panelRef.current) gsap.set(panelRef.current, { x: "100%" });
  }, []);

  const toggleMenu = useCallback(() => {
    setOpen((prev) => {
      const nextOpen = !prev;

      // Painel
      if (panelRef.current) {
        gsap.to(panelRef.current, {
          x: nextOpen ? "0%" : "100%",
          duration: 0.5,
          ease: "power2.out",
          backgroundColor: nextOpen ? "#000" : "#fff",
        });
      }

      // Ícone rotaciona
      if (iconRef.current) {
        gsap.to(iconRef.current, {
          rotate: nextOpen ? 45 : 0,
          duration: 0.3,
        });
      }

      // Troca do texto com animação e mudança de cor
      if (textRef.current) {
        const newText = nextOpen ? "Close" : "Menu";
        const newColor = nextOpen ? "#fff" : "#000"; // branco no close, preto no menu

        gsap.to(textRef.current, {
          y: -20,
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            if (textRef.current) {
              textRef.current.textContent = newText;
              gsap.fromTo(
                textRef.current,
                { y: 20, opacity: 0, color: newColor },
                { y: 0, opacity: 1, duration: 0.2, color: newColor }
              );
            }
          },
        });
      }

      return nextOpen;
    });
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Botão do menu */}
      <button
        onClick={toggleMenu}
        className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-transparent font-semibold text-lg"
      >
        <span ref={textRef} className="transition-colors duration-200">
          Menu
        </span>
        <span
          ref={iconRef}
          className="block w-6 h-6 bg-black text-white rounded-full flex items-center justify-center leading-none"
        >
          +
        </span>
      </button>

      {/* Painel do menu */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-100 bg-white flex flex-col py-25 px-8 z-40"
      >
        <ul className="flex flex-col gap-6">
          {menuItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.link}
                className="text-4xl font-semibold text-white hover:text-purple-400 transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SimpleMenu;
