"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A self-contained 2D Minecraft-style sandbox.
 *
 * Everything runs on a single <canvas>: procedurally generated terrain
 * (grass/dirt/stone, caves, ores, water, trees), a physics-driven player you
 * can walk and jump around, and mining / placing with a block hotbar. No
 * external game engine — just the canvas 2D context and a requestAnimationFrame
 * loop. All mutable game state lives in refs so the loop never triggers React
 * re-renders.
 *
 * Desktop controls (also drawn on-screen):
 *   A / D or ← / →  move        W / Space / ↑  jump
 *   Left click       mine        Right click    place selected block
 *   1–9 or wheel     pick block  C  creative (infinite blocks + fly)
 *   R                regenerate world
 */

// ---- Block table -----------------------------------------------------------

const AIR = 0;
const GRASS = 1;
const DIRT = 2;
const STONE = 3;
const SAND = 4;
const WOOD = 5;
const LEAVES = 6;
const PLANK = 7;
const GLASS = 8;
const BRICK = 9;
const COAL = 10;
const IRON = 11;
const GOLD = 12;
const DIAMOND = 13;
const WATER = 14;
const BEDROCK = 15;

type Block = {
  name: string;
  color: string;
  // Secondary speckle colour used to give each tile a little texture.
  speck: string;
  solid: boolean;
  // What ends up in your inventory when mined. null = drops nothing.
  drop: number | null;
};

const BLOCKS: Record<number, Block> = {
  [AIR]: { name: "Air", color: "#000000", speck: "#000000", solid: false, drop: null },
  [GRASS]: { name: "Grass", color: "#5fa04e", speck: "#4d8a3e", solid: true, drop: GRASS },
  [DIRT]: { name: "Dirt", color: "#8a5a37", speck: "#79492b", solid: true, drop: DIRT },
  [STONE]: { name: "Stone", color: "#888d92", speck: "#75797e", solid: true, drop: STONE },
  [SAND]: { name: "Sand", color: "#dcd29a", speck: "#cabd83", solid: true, drop: SAND },
  [WOOD]: { name: "Wood", color: "#7c5230", speck: "#read", solid: true, drop: WOOD },
  [LEAVES]: { name: "Leaves", color: "#3f7d33", speck: "#356b2b", solid: true, drop: LEAVES },
  [PLANK]: { name: "Planks", color: "#b58a55", speck: "#a07843", solid: true, drop: PLANK },
  [GLASS]: { name: "Glass", color: "#bfe6ef", speck: "#a9d8e4", solid: true, drop: GLASS },
  [BRICK]: { name: "Brick", color: "#a8412f", speck: "#8f3526", solid: true, drop: BRICK },
  [COAL]: { name: "Coal", color: "#888d92", speck: "#2b2b2b", solid: true, drop: COAL },
  [IRON]: { name: "Iron", color: "#888d92", speck: "#caa17a", solid: true, drop: IRON },
  [GOLD]: { name: "Gold", color: "#888d92", speck: "#e9c84a", solid: true, drop: GOLD },
  [DIAMOND]: { name: "Diamond", color: "#888d92", speck: "#54d6cf", solid: true, drop: DIAMOND },
  [WATER]: { name: "Water", color: "#3b6bd6", speck: "#3360c4", solid: false, drop: null },
  [BEDROCK]: { name: "Bedrock", color: "#3a3d40", speck: "#2a2c2e", solid: true, drop: null },
};

// Wood speck colour fix (the literal above is intentionally overwritten so the
// table stays readable — wood gets darker grain lines).
BLOCKS[WOOD].speck = "#664126";

// Blocks shown in the hotbar (placeable), keys 1–9.
const HOTBAR: number[] = [GRASS, DIRT, STONE, SAND, WOOD, PLANK, GLASS, BRICK, LEAVES];

// Ores tallied separately in the HUD as "loot".
const LOOT: number[] = [COAL, IRON, GOLD, DIAMOND];

// ---- World geometry --------------------------------------------------------

const TILE = 28; // on-screen pixel size of a block
const WORLD_W = 220;
const WORLD_H = 120;
const SEA_LEVEL = 64;
const REACH = 5.2; // how far (in tiles) the player can mine / place

// ---- Deterministic noise helpers ------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x: number, y: number, seed: number) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Smooth 1D value noise used for the surface silhouette.
function valueNoise1D(x: number, seed: number) {
  const x0 = Math.floor(x);
  const t = x - x0;
  const s = t * t * (3 - 2 * t); // smoothstep
  const a = hash2(x0, 0, seed);
  const b = hash2(x0 + 1, 0, seed);
  return a + (b - a) * s;
}

// ---- World data type -------------------------------------------------------

type World = {
  grid: Uint8Array; // length WORLD_W * WORLD_H
  top: Int16Array; // topmost solid row per column, for fast light shading
  seed: number;
};

const idx = (x: number, y: number) => y * WORLD_W + x;

function getBlock(world: World, x: number, y: number): number {
  if (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H) return BEDROCK; // walls
  return world.grid[idx(x, y)];
}

function recomputeTop(world: World, x: number) {
  for (let y = 0; y < WORLD_H; y++) {
    if (world.grid[idx(x, y)] !== AIR && world.grid[idx(x, y)] !== WATER) {
      world.top[x] = y;
      return;
    }
  }
  world.top[x] = WORLD_H;
}

function surfaceHeight(x: number, seed: number): number {
  // Layered octaves of value noise → rolling hills.
  let h = 0;
  h += valueNoise1D(x / 48, seed) * 22;
  h += valueNoise1D(x / 18, seed * 3 + 7) * 8;
  h += valueNoise1D(x / 7, seed * 7 + 13) * 3;
  return Math.floor(SEA_LEVEL - 6 + h);
}

function generateWorld(seed: number): World {
  const grid = new Uint8Array(WORLD_W * WORLD_H);
  const top = new Int16Array(WORLD_W);
  const rng = mulberry32(seed ^ 0x9e3779b9);

  for (let x = 0; x < WORLD_W; x++) {
    const surf = surfaceHeight(x, seed);
    const beach = surf >= SEA_LEVEL - 1; // low ground near the water → sand
    for (let y = 0; y < WORLD_H; y++) {
      let b = AIR;
      const depth = y - surf;
      if (depth < 0) {
        // Above the ground: water fills the gap down to sea level.
        b = y >= SEA_LEVEL ? WATER : AIR;
      } else if (depth === 0) {
        b = beach ? SAND : GRASS;
      } else if (depth <= 3) {
        b = beach ? SAND : DIRT;
      } else {
        b = STONE;
      }

      // Caves: carve pockets out of the stone using 2D value noise.
      if (b === STONE) {
        const c =
          hash2(x, y, seed * 11 + 1) * 0.5 +
          hash2(Math.floor(x / 2), Math.floor(y / 2), seed * 13 + 5) * 0.5;
        if (c > 0.78 && y < WORLD_H - 3) b = AIR;
      }

      // Ores, deeper = rarer & more valuable.
      if (b === STONE) {
        const r = hash2(x, y, seed * 17 + 3);
        if (y > 96 && r > 0.992) b = DIAMOND;
        else if (y > 84 && r > 0.987) b = GOLD;
        else if (y > 72 && r > 0.975) b = IRON;
        else if (r > 0.955) b = COAL;
      }

      // Unbreakable floor.
      if (y >= WORLD_H - 2) b = BEDROCK;

      grid[idx(x, y)] = b;
    }
  }

  const world: World = { grid, top, seed };

  // Trees on dry grass.
  for (let x = 2; x < WORLD_W - 2; x++) {
    const surf = surfaceHeight(x, seed);
    if (surf >= SEA_LEVEL - 1) continue; // no trees on the beach / underwater
    if (grid[idx(x, surf)] !== GRASS) continue;
    if (rng() > 0.12) continue;
    const trunk = 4 + Math.floor(rng() * 3);
    const topY = surf - trunk;
    for (let y = surf - 1; y >= topY; y--) {
      if (grid[idx(x, y)] === AIR) grid[idx(x, y)] = WOOD;
    }
    // Leaf canopy.
    for (let ly = topY - 2; ly <= topY + 1; ly++) {
      const rad = ly < topY ? 1 : 2;
      for (let lx = x - rad; lx <= x + rad; lx++) {
        if (lx < 0 || lx >= WORLD_W || ly < 0) continue;
        if (grid[idx(lx, ly)] === AIR) grid[idx(lx, ly)] = LEAVES;
      }
    }
  }

  for (let x = 0; x < WORLD_W; x++) recomputeTop(world, x);
  return world;
}

// ---- Player ----------------------------------------------------------------

type Player = {
  x: number; // tile coords of top-left of the AABB
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: number;
};

const PW = 0.6; // player width in tiles
const PH = 1.8; // player height in tiles
const MOVE = 7.5; // tiles / second
const JUMP = 13.5; // tiles / second (initial)
const GRAVITY = 42; // tiles / second^2
const MAX_FALL = 32;

function spawnPlayer(world: World): Player {
  const x = Math.floor(WORLD_W / 2);
  let surf = surfaceHeight(x, world.seed);
  for (let y = 0; y < WORLD_H; y++) {
    if (world.grid[idx(x, y)] !== AIR && world.grid[idx(x, y)] !== WATER) {
      surf = y;
      break;
    }
  }
  return { x: x + 0.2, y: surf - PH - 0.01, vx: 0, vy: 0, onGround: false, facing: 1 };
}

function solidAt(world: World, x: number, y: number): boolean {
  const b = getBlock(world, Math.floor(x), Math.floor(y));
  return BLOCKS[b]?.solid ?? false;
}

// Does the player's AABB (at px,py) overlap any solid block?
function collides(world: World, px: number, py: number): boolean {
  const x0 = Math.floor(px);
  const x1 = Math.floor(px + PW - 1e-6);
  const y0 = Math.floor(py);
  const y1 = Math.floor(py + PH - 1e-6);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (solidAt(world, x, y)) return true;
    }
  }
  return false;
}

// ---- Component -------------------------------------------------------------

export default function MinecraftGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // HUD mirror state (updated sparingly, drives the React-rendered panels).
  const [hud, setHud] = useState({
    selected: 0,
    creative: false,
    counts: {} as Record<number, number>,
    loot: {} as Record<number, number>,
    fps: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // ---- mutable game state ----
    let world = generateWorld(0x1234 + 1);
    let player = spawnPlayer(world);
    const cam = { x: player.x, y: player.y };
    let selected = 0;
    let creative = false;
    const inventory: Record<number, number> = {};
    for (const b of HOTBAR) inventory[b] = 40; // a starter stack of each
    for (const b of LOOT) inventory[b] = 0;

    const keys = new Set<string>();
    const mouse = { x: 0, y: 0, left: false, right: false };
    let dpr = 1;
    let viewW = 0;
    let viewH = 0;

    function resize() {
      const rect = wrapRef.current!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewW = Math.max(320, Math.floor(rect.width));
      viewH = Math.max(320, Math.floor(rect.height));
      canvas.width = Math.floor(viewW * dpr);
      canvas.height = Math.floor(viewH * dpr);
      canvas.style.width = viewW + "px";
      canvas.style.height = viewH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapRef.current!);

    // Convert a screen pixel to a world tile, given the current camera.
    function screenToTile(sx: number, sy: number) {
      const originX = player.x + PW / 2 - viewW / 2 / TILE;
      const originY = player.y + PH / 2 - viewH / 2 / TILE;
      return {
        tx: Math.floor(originX + sx / TILE),
        ty: Math.floor(originY + sy / TILE),
      };
    }

    function syncHud() {
      const counts: Record<number, number> = {};
      for (const b of HOTBAR) counts[b] = inventory[b] ?? 0;
      const loot: Record<number, number> = {};
      for (const b of LOOT) loot[b] = inventory[b] ?? 0;
      setHud((h) => ({ ...h, selected, creative, counts, loot }));
    }
    syncHud();

    // ---- input ----
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      keys.add(k);
      if (k >= "1" && k <= "9") {
        selected = Number(k) - 1;
        syncHud();
      }
      if (k === "c") {
        creative = !creative;
        player.vy = 0;
        syncHud();
      }
      if (k === "r") {
        world = generateWorld((Math.floor(performance.now()) ^ (selected * 2654435761)) | 1);
        player = spawnPlayer(world);
        cam.x = player.x;
        cam.y = player.y;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) mouse.left = true;
      if (e.button === 2) mouse.right = true;
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) mouse.left = false;
      if (e.button === 2) mouse.right = false;
    };
    const onContext = (e: Event) => e.preventDefault();
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      selected = (selected + (e.deltaY > 0 ? 1 : -1) + HOTBAR.length) % HOTBAR.length;
      syncHud();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("contextmenu", onContext);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // ---- mining / placing ----
    let mineCooldown = 0;
    let placeCooldown = 0;

    function withinReach(tx: number, ty: number) {
      const dx = tx + 0.5 - (player.x + PW / 2);
      const dy = ty + 0.5 - (player.y + PH / 2);
      return dx * dx + dy * dy <= REACH * REACH;
    }

    function tryMine(tx: number, ty: number) {
      if (!withinReach(tx, ty)) return;
      const b = getBlock(world, tx, ty);
      if (b === AIR || b === WATER || b === BEDROCK) return;
      world.grid[idx(tx, ty)] = AIR;
      const drop = BLOCKS[b].drop;
      if (drop !== null) inventory[drop] = (inventory[drop] ?? 0) + 1;
      recomputeTop(world, tx);
      syncHud();
    }

    function tryPlace(tx: number, ty: number) {
      if (!withinReach(tx, ty)) return;
      const target = getBlock(world, tx, ty);
      if (target !== AIR && target !== WATER) return; // only into empty space
      // Don't entomb the player.
      const px0 = Math.floor(player.x);
      const px1 = Math.floor(player.x + PW - 1e-6);
      const py0 = Math.floor(player.y);
      const py1 = Math.floor(player.y + PH - 1e-6);
      if (tx >= px0 && tx <= px1 && ty >= py0 && ty <= py1) return;
      const block = HOTBAR[selected];
      if (!creative) {
        if ((inventory[block] ?? 0) <= 0) return;
        inventory[block] -= 1;
      }
      world.grid[idx(tx, ty)] = block;
      if (ty < world.top[tx]) world.top[tx] = ty;
      syncHud();
    }

    // ---- physics ----
    function update(dt: number) {
      const left = keys.has("a") || keys.has("arrowleft");
      const right = keys.has("d") || keys.has("arrowright");
      const up = keys.has("w") || keys.has("arrowup") || keys.has(" ");
      const down = keys.has("s") || keys.has("arrowdown");

      // Horizontal intent.
      player.vx = (right ? MOVE : 0) - (left ? MOVE : 0);
      if (right) player.facing = 1;
      if (left) player.facing = -1;

      const inWater = getBlock(world, Math.floor(player.x + PW / 2), Math.floor(player.y + PH / 2)) === WATER;

      if (creative) {
        // Fly mode: direct vertical control, no gravity.
        player.vy = (down ? MOVE : 0) - (up ? MOVE : 0);
      } else {
        const g = inWater ? GRAVITY * 0.35 : GRAVITY;
        player.vy = Math.min(player.vy + g * dt, inWater ? 6 : MAX_FALL);
        if (up && (player.onGround || inWater)) {
          player.vy = inWater ? -5.5 : -JUMP;
          player.onGround = false;
        }
        if (inWater) player.vx *= 0.7;
      }

      // Move + resolve on X.
      let nx = player.x + player.vx * dt;
      if (collides(world, nx, player.y)) {
        // Snap flush against the block we ran into.
        nx = player.vx > 0 ? Math.ceil(player.x + PW) - PW - 1e-4 : Math.floor(player.x);
        if (collides(world, nx, player.y)) nx = player.x;
        player.vx = 0;
      }
      player.x = Math.max(0, Math.min(WORLD_W - PW, nx));

      // Move + resolve on Y.
      player.onGround = false;
      let ny = player.y + player.vy * dt;
      if (collides(world, player.x, ny)) {
        if (player.vy > 0) {
          ny = Math.ceil(player.y + PH) - PH - 1e-4;
          player.onGround = true;
        } else {
          ny = Math.floor(player.y);
        }
        if (collides(world, player.x, ny)) ny = player.y;
        player.vy = 0;
      }
      player.y = Math.max(0, Math.min(WORLD_H - PH, ny));

      // Mining / placing with a small cooldown so a held button repeats nicely.
      mineCooldown -= dt;
      placeCooldown -= dt;
      const { tx, ty } = screenToTile(mouse.x, mouse.y);
      if (mouse.left && mineCooldown <= 0) {
        tryMine(tx, ty);
        mineCooldown = 0.12;
      }
      if (mouse.right && placeCooldown <= 0) {
        tryPlace(tx, ty);
        placeCooldown = 0.16;
      }

      // Camera eases toward the player.
      cam.x += (player.x - cam.x) * Math.min(1, dt * 8);
      cam.y += (player.y - cam.y) * Math.min(1, dt * 8);
    }

    // ---- rendering ----
    function drawTile(b: number, gx: number, gy: number, sx: number, sy: number, shade: number) {
      const info = BLOCKS[b];
      ctx.globalAlpha = b === WATER ? 0.7 : 1;
      ctx.fillStyle = info.color;
      ctx.fillRect(sx, sy, TILE + 1, TILE + 1);

      if (b !== AIR && b !== WATER) {
        // Speckle texture: a few deterministic dots so flat colour reads as stone/dirt/etc.
        ctx.fillStyle = info.speck;
        for (let i = 0; i < 3; i++) {
          const r = hash2(gx * 4 + i, gy * 4 - i, b * 31 + 1);
          const r2 = hash2(gx * 7 - i, gy * 5 + i, b * 17 + 5);
          ctx.fillRect(sx + Math.floor(r * (TILE - 6)) + 2, sy + Math.floor(r2 * (TILE - 6)) + 2, 4, 4);
        }
        if (b === GRASS) {
          // grass cap
          ctx.fillStyle = "#74c25c";
          ctx.fillRect(sx, sy, TILE + 1, 5);
        }
      }

      // Depth shading darkens covered blocks → caves feel deep.
      if (shade < 1) {
        ctx.globalAlpha = (1 - shade) * (b === WATER ? 0.25 : 0.85);
        ctx.fillStyle = "#0a1020";
        ctx.fillRect(sx, sy, TILE + 1, TILE + 1);
      }
      ctx.globalAlpha = 1;
    }

    let last = performance.now();
    let fpsT = 0;
    let fpsN = 0;
    let raf = 0;

    function frame(now: number) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      update(dt);

      // Sky.
      const sky = ctx.createLinearGradient(0, 0, 0, viewH);
      sky.addColorStop(0, "#7ec0ee");
      sky.addColorStop(0.55, "#aed6f1");
      sky.addColorStop(1, "#d6e9f7");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, viewW, viewH);

      const originX = cam.x + PW / 2 - viewW / 2 / TILE;
      const originY = cam.y + PH / 2 - viewH / 2 / TILE;
      const startX = Math.floor(originX) - 1;
      const startY = Math.floor(originY) - 1;
      const cols = Math.ceil(viewW / TILE) + 2;
      const rows = Math.ceil(viewH / TILE) + 2;

      for (let gy = startY; gy < startY + rows; gy++) {
        for (let gx = startX; gx < startX + cols; gx++) {
          if (gx < 0 || gx >= WORLD_W || gy < 0 || gy >= WORLD_H) continue;
          const b = world.grid[idx(gx, gy)];
          if (b === AIR) continue;
          const sx = Math.round((gx - originX) * TILE);
          const sy = Math.round((gy - originY) * TILE);
          // Light: exposed near the surface, fades with depth below it.
          const coverDepth = gy - world.top[gx];
          let shade = 1;
          if (b !== WATER && coverDepth > 0) shade = Math.max(0.32, 1 - coverDepth / 12);
          drawTile(b, gx, gy, sx, sy, shade);
        }
      }

      // Highlight the targeted block.
      const tgt = screenToTile(mouse.x, mouse.y);
      if (withinReach(tgt.tx, tgt.ty)) {
        const sx = Math.round((tgt.tx - originX) * TILE);
        const sy = Math.round((tgt.ty - originY) * TILE);
        const empty = getBlock(world, tgt.tx, tgt.ty) === AIR || getBlock(world, tgt.tx, tgt.ty) === WATER;
        ctx.strokeStyle = empty ? "rgba(255,255,255,0.85)" : "rgba(20,20,20,0.85)";
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, sy + 1, TILE - 1, TILE - 1);
      }

      // Player (Steve-ish blocky figure).
      const psx = Math.round((player.x - originX) * TILE);
      const psy = Math.round((player.y - originY) * TILE);
      const pw = PW * TILE;
      const ph = PH * TILE;
      ctx.fillStyle = "#1f6fb2"; // legs / body
      ctx.fillRect(psx, psy + ph * 0.45, pw, ph * 0.55);
      ctx.fillStyle = "#3aa0e6"; // shirt
      ctx.fillRect(psx, psy + ph * 0.28, pw, ph * 0.2);
      ctx.fillStyle = "#caa17a"; // head
      ctx.fillRect(psx - 1, psy, pw + 2, ph * 0.3);
      ctx.fillStyle = "#3a2b1c"; // hair
      ctx.fillRect(psx - 1, psy, pw + 2, ph * 0.09);
      // eyes, facing-aware
      ctx.fillStyle = "#ffffff";
      const eo = player.facing > 0 ? pw * 0.32 : pw * 0.1;
      ctx.fillRect(psx + eo, psy + ph * 0.13, 3, 3);
      ctx.fillRect(psx + eo + pw * 0.3, psy + ph * 0.13, 3, 3);

      fpsT += dt;
      fpsN++;
      if (fpsT >= 0.5) {
        setHud((h) => ({ ...h, fps: Math.round(fpsN / fpsT) }));
        fpsT = 0;
        fpsN = 0;
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("contextmenu", onContext);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  // ---- HUD (React-rendered overlay) ----
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div
        ref={wrapRef}
        className="relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-lg border-2 border-ink bg-[#7ec0ee] shadow-lg"
      >
        <canvas ref={canvasRef} className="block h-full w-full cursor-crosshair touch-none" />

        {/* Top-left: loot + mode */}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1 font-mono text-xs">
          <span className="rounded bg-black/55 px-2 py-1 text-white">
            {hud.creative ? "CREATIVE — fly: W/S, ∞ blocks" : "SURVIVAL"} · {hud.fps} fps
          </span>
          <span className="rounded bg-black/55 px-2 py-1 text-white">
            ⛏ {LOOT.map((b) => `${BLOCKS[b].name[0]}:${hud.loot[b] ?? 0}`).join("  ")}
          </span>
        </div>

        {/* Bottom: hotbar */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-md bg-black/45 p-1.5">
          {HOTBAR.map((b, i) => (
            <div
              key={b}
              className={`flex h-12 w-12 flex-col items-center justify-center rounded border-2 ${
                i === hud.selected ? "border-white" : "border-white/25"
              }`}
              style={{ backgroundColor: BLOCKS[b].color }}
              title={BLOCKS[b].name}
            >
              <span className="text-[9px] font-bold uppercase leading-none text-white drop-shadow">
                {i + 1}
              </span>
              <span className="mt-auto w-full bg-black/45 text-center text-[10px] font-bold text-white">
                {hud.creative ? "∞" : hud.counts[b] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
        <p>
          <strong className="text-ink">Move</strong> A/D or ←/→ ·{" "}
          <strong className="text-ink">Jump</strong> W / Space / ↑ ·{" "}
          <strong className="text-ink">Swim</strong> hold up in water
        </p>
        <p>
          <strong className="text-ink">Mine</strong> left-click ·{" "}
          <strong className="text-ink">Place</strong> right-click
        </p>
        <p>
          <strong className="text-ink">Pick block</strong> keys 1–9 or mouse wheel
        </p>
        <p>
          <strong className="text-ink">C</strong> toggle creative/fly ·{" "}
          <strong className="text-ink">R</strong> new world
        </p>
      </div>
    </div>
  );
}
