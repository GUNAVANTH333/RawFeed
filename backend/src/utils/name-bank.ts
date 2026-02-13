const ADJECTIVES = [
  "Silent", "Bold", "Crimson", "Swift", "Phantom",
  "Midnight", "Frost", "Shadow", "Golden", "Electric",
  "Cosmic", "Velvet", "Iron", "Storm", "Neon",
  "Rogue", "Crystal", "Ember", "Lunar", "Obsidian",
  "Scarlet", "Azure", "Savage", "Noble", "Wild",
  "Hollow", "Blazing", "Arctic", "Dusky", "Radiant",
] as const;

const ANIMALS = [
  "Badger", "Fox", "Falcon", "Wolf", "Panther",
  "Raven", "Viper", "Hawk", "Lynx", "Cobra",
  "Orca", "Condor", "Mantis", "Jackal", "Osprey",
  "Bison", "Puma", "Crane", "Hyena", "Jaguar",
  "Dragon", "Phoenix", "Owl", "Tiger", "Bear",
  "Eagle", "Shark", "Stag", "Leopard", "Scorpion",
] as const;

export function hashToReadableName(hexHash: string): string {
  const adjIndex = parseInt(hexHash.slice(0, 8), 16) % ADJECTIVES.length;
  const animalIndex = parseInt(hexHash.slice(8, 16), 16) % ANIMALS.length;
  const numericSuffix = parseInt(hexHash.slice(16, 20), 16) % 100;

  const adjective = ADJECTIVES[adjIndex]!;
  const animal = ANIMALS[animalIndex]!;
  const suffix = numericSuffix.toString().padStart(2, "0");

  return `${adjective}_${animal}_${suffix}`;
}

export function hashToAvatarColor(hexHash: string): string {
  const hue = parseInt(hexHash.slice(20, 26), 16) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}
