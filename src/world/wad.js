/**
 * Texturas WAD originales de CS 1.6, mapeadas a los materiales de los mapas.
 * Los PNG se generan con tools/extract-assets.py desde cs_dust.wad / cs_assault.wad.
 */
import * as THREE from '../../vendor/three.module.js';

const BASE = '/assets/cs16/textures/wad';

const MAP_TEXTURES = {
  de_dust2: {
    sandFloor: 'cs_dust/SandRoad.png',
    dirtFloor: 'cs_dust/-0Sand.png',
    concreteFloor: 'cs_dust/SandCCrete.png',
    sandWall: 'cs_dust/-0csSandWall.png',
    sandWallDark: 'cs_dust/-1csSandWall.png',
    brickWall: 'cs_dust/-0csSandWall.png',
    stoneWall: 'cs_dust/SandCCrete.png',
    stoneDark: 'cs_dust/-1csSandWall.png',
    trim: 'cs_dust/SandTrim.png',
    wood: 'cs_dust/SandCrtLrgSd.png',
    woodDark: 'cs_dust/SandCrtSmSd.png',
    crate: 'cs_dust/SandCrtLrgSd.png',
    doorWood: 'cs_dust/SandCrtSmSd.png',
    metal: 'cs_assault/c_bldg2_2.png',
    metalDark: 'cs_assault/c_bldg4_1.png',
    barrelA: 'cs_assault/c_bldg2_1.png',
    barrelB: 'cs_assault/c_bldg3_1.png',
    roofStone: 'cs_dust/-1csSandWall.png',
    sandWallDarkB: 'cs_dust/SandWllWndw.png',
  },
  aim_1v1: {
    sandFloor: 'cs_dust/SandRoad.png',
    dirtFloor: 'cs_dust/-0Sand.png',
    concreteFloor: 'cs_dust/SandCCrete.png',
    sandWall: 'cs_dust/-0csSandWall.png',
    sandWallDark: 'cs_dust/-1csSandWall.png',
    brickWall: 'cs_dust/-0csSandWall.png',
    stoneWall: 'cs_dust/SandCCrete.png',
    stoneDark: 'cs_dust/-1csSandWall.png',
    trim: 'cs_dust/SandTrim.png',
    wood: 'cs_dust/SandCrtLrgSd.png',
    woodDark: 'cs_dust/SandCrtSmSd.png',
    crate: 'cs_dust/SandCrtLrgSd.png',
    doorWood: 'cs_dust/SandCrtSmSd.png',
    metal: 'cs_assault/c_bldg2_2.png',
    metalDark: 'cs_assault/c_bldg4_1.png',
    barrelA: 'cs_assault/c_bldg2_1.png',
    barrelB: 'cs_assault/c_bldg3_1.png',
    roofStone: 'cs_dust/-1csSandWall.png',
  },
  cs_assault: {
    concreteFloor: 'cs_assault/c_bldg1_2.png',
    concreteWall: 'cs_assault/c_bldg1_3.png',
    brickWall: 'cs_assault/c_bldg2_1.png',
    stoneWall: 'cs_assault/c_rockwall.png',
    stoneDark: 'cs_assault/c_bldg4_2.png',
    trim: 'cs_assault/c_bldg2_brck.png',
    metal: 'cs_assault/c_bldg2_2.png',
    metalDark: 'cs_assault/c_bldg4_1.png',
    wood: 'cs_office/Core_Urban_040.png',
    woodDark: 'cs_office/Core_Urban_051.png',
    crate: 'cs_dust/SandCrtLrgSd.png',
    doorWood: 'cs_office/Core_Urban_054.png',
    roofStone: 'cs_assault/c_bldg3_2.png',
    tarp: 'cs_assault/c_bldg3_1.png',
    barrelA: 'cs_assault/c_bldg3_1.png',
    barrelB: 'cs_assault/c_bldg1_3.png',
    glass: 'cs_office/Core_Urban_023.png',
    lampWarm: 'cs_assault/c_bldg4_1.png',
    lampPanel: 'cs_assault/c_bldg4_2.png',
    sandWallDark: 'cs_assault/c_rockwall.png',
  },
  cs_office: {
    concreteFloor: 'cs_dust/SandCCrete.png',
    plasterWall: 'cs_office/Core_Urban_020.png',
    concreteWall: 'cs_office/Core_Urban_023.png',
    trim: 'cs_office/Core_Urban_026.png',
    wood: 'cs_office/Core_Urban_040.png',
    woodDark: 'cs_office/Core_Urban_051.png',
    crate: 'cs_dust/SandCrtLrgSd.png',
    metal: 'cs_assault/c_bldg2_2.png',
    metalDark: 'cs_assault/c_bldg4_1.png',
    tileFloor: 'cs_office/Core_Urban_090.png',
    carpetFloor: 'cs_office/Core_Urban_093.png',
    ceiling: 'cs_office/Core_Urban_111.png',
  },
};

const cache = new Map();
let loaded = false;

async function loadOne(rel) {
  // TextureLoader.load() devuelve una textura aun si la imagen da 404.
  // Guardarla antes de validar provoca materiales negros en MeshStandardMaterial.
  try {
    const texture = await new THREE.TextureLoader().loadAsync(`${BASE}/${rel}`);
    if (!texture.image?.width || !texture.image?.height) {
      texture.dispose();
      return false;
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    cache.set(rel, texture);
    return true;
  } catch {
    // Sin textura GoldSrc válida, se conserva la procedural.
    return false;
  }
}

export async function preloadWadTextures() {
  if (loaded || globalThis.__DEUSHIMA_PUBLIC__) return;
  loaded = true;
  const all = new Set();
  for (const map of Object.values(MAP_TEXTURES)) {
    for (const rel of Object.values(map)) all.add(rel);
  }
  const results = await Promise.all([...all].map(loadOne));
  console.info(`[wad] ${cache.size} listas, ${results.filter((success) => !success).length} ausentes: fallback procedural`);
}

export function wadTextureFor(mapId, key) {
  const map = MAP_TEXTURES[mapId] || MAP_TEXTURES.de_dust2;
  const rel = map[key];
  return rel ? cache.get(rel) || null : null;
}

export function hasWadTexture(mapId, key) {
  return !!(MAP_TEXTURES[mapId] || MAP_TEXTURES.de_dust2)?.[key];
}
