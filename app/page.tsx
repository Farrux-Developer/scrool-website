"use client";

import dynamic from "next/dynamic";

// весь опыт — клиентский WebGL, серверный рендер ему только мешает
const Experience = dynamic(() => import("@/components/Experience"), { ssr: false });

export default function Home() {
  return <Experience />;
}
