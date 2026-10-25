import type { Metadata } from "next";
import MinecraftGame from "./MinecraftGame";

export const metadata: Metadata = {
  title: "Blockcraft — a tiny Minecraft in your browser",
  description:
    "A self-contained 2D Minecraft-style sandbox: procedurally generated terrain, caves and ores, mining, building, and a creative fly mode. Plays entirely in the browser.",
  robots: { index: false, follow: false },
};

export default function MinecraftPage() {
  return (
    <div className="py-6">
      <header className="mx-auto max-w-6xl px-4">
        <h1 className="font-serif text-3xl font-black tracking-tight sm:text-4xl">
          Blockcraft
        </h1>
        <p className="mt-1 max-w-2xl text-muted">
          A pocket-sized, dependency-free Minecraft built on a single canvas.
          Dig down through dirt and stone, find ores in the dark, chop trees,
          and build whatever you like. Click the world to grab the keyboard.
        </p>
      </header>
      <MinecraftGame />
    </div>
  );
}
