import type { CatalogItem, CategoryMeta, FloorLayout, InteriorWall, RoofSpec, RoofStyle, RoomLayout, RoomZone } from './types';

// Defined beside the error screens' light helpers (#584).
export { STORAGE_KEY } from './saved-house';
export const AUTOSAVE_DEBOUNCE_MS = 1500;
export const GRID_SIZE_METERS = 0.5;
export const DEFAULT_BUDGET = 25_000;

export const CURRENCY_SYMBOL = '$';

export const MAX_FLOORS = 4;

/**
 * Camera vision-cone fallbacks for an item that carries `hasVisionCone` but no
 * explicit range or field of view (the schema allows both to be absent). The
 * 3D cone, the 2D plan and the vector exports must agree on them (#401).
 */
export const DEFAULT_VISION_RANGE_M = 7;
export const DEFAULT_VISION_FOV_DEG = 70;

/** The roof every new layout starts with. */
export const DEFAULT_ROOF: Required<Pick<RoofSpec, 'style' | 'color'>> = { style: 'gable', color: '#5d3a23' };

/**
 * The colour a roof renders in when it has no colour of its own — shared by
 * the roof builder, the Roof panel's picker, and the Roof It achievement so
 * they all agree on what a colourless roof looks like.
 */
export const ROOF_STYLE_DEFAULT_COLORS: Readonly<Record<RoofStyle, string>> = {
  none: '#90a4ae',
  flat: '#546e7a',
  gable: '#8d6e63',
  hipped: '#a1887f',
};

/**
 * Upper bound (metres) for a room's width/height. The editor UI tops out at
 * 20m; this generous defensive cap keeps ingested/corrupt layouts from feeding
 * absurd or non-positive dimensions into PlaneGeometry, texture fitting, and
 * collision math while still accepting any realistic custom layout.
 */
export const MAX_ROOM_DIMENSION = 100;
// Item dims from external data (share URLs, imports) need a cap too: a
// width of 1e12 passes a bare positivity check and destroys the scene scale
// (camera framing, collision math, shadow map) (#121).
export const MAX_ITEM_DIMENSION = 50;

/** How far a bracketed security camera stands off the wall, in metres. */
export const CAMERA_BRACKET_ARM = 0.22;

/**
 * The single window-sill datum, in metres from the floor. Consumed by the
 * exterior wall cut, the interior wall cut, AND the window mesh builder —
 * these three used to disagree (cut at 1.0, mesh at 0.9), leaving a 10 cm
 * see-through slit above every default window (#212). Per-window sill
 * heights (#204) should override this default, not fork it again.
 */
export const WINDOW_SILL_HEIGHT = 0.9;

/**
 * Default tracing-image strength when a layout has no explicit
 * `floorPlanOpacity`. One constant for BOTH renderers: the 3D floor, the 2D
 * plan/blueprint, and the settings panel used to disagree (2D painted at
 * full strength), so the same save read differently per view (#218).
 */
export const DEFAULT_FLOOR_PLAN_OPACITY = 0.5;

export const CATEGORIES: readonly CategoryMeta[] = [
  { key: 'seating', label: 'Seating', icon: '🪑' },
  { key: 'tables', label: 'Tables', icon: '🟫' },
  { key: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { key: 'storage', label: 'Storage', icon: '📚' },
  { key: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { key: 'bathroom', label: 'Bathroom', icon: '🛁' },
  { key: 'electronics', label: 'Electronics', icon: '📺' },
  { key: 'security', label: 'Security', icon: '🎥' },
  { key: 'decor', label: 'Decor', icon: '🪴' },
  { key: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { key: 'people', label: 'People', icon: '🧍' },
  { key: 'structure', label: 'Structure', icon: '🪜' },
  { key: 'factory', label: 'Factory', icon: '🏭' },
] as const;

export const FURNITURE_CATALOG = [
  // Seating
  { type: 'chair', category: 'seating', name: 'Chair', width: 0.5, depth: 0.5, height: 0.8, color: '#8B4513', icon: '🪑', price: 75 },
  { type: 'dining-chair', category: 'seating', name: 'Dining Chair', width: 0.45, depth: 0.45, height: 0.9, color: '#5D4037', icon: '🪑', price: 95 },
  {
    type: 'armchair', category: 'seating', name: 'Armchair', width: 0.9, depth: 0.9, height: 0.85, color: '#6D4C41', icon: '💺', price: 280,
    variants: [{ name: 'Tan', color: '#6D4C41' }, { name: 'Dove grey', color: '#78909C' }, { name: 'Mustard', color: '#C9A227' }],
  },
  {
    type: 'sofa', category: 'seating', name: 'Sofa', width: 2.0, depth: 0.9, height: 0.8, color: '#4A5568', icon: '🛋️', price: 650,
    variants: [{ name: 'Slate', color: '#4A5568' }, { name: 'Sand', color: '#C8B49A' }, { name: 'Forest', color: '#2E5E4E' }, { name: 'Rust', color: '#A0522D' }],
  },
  { type: 'bench', category: 'seating', name: 'Bench', width: 1.4, depth: 0.4, height: 0.45, color: '#795548', icon: '🪵', price: 150 },
  {
    type: 'bar-stool', category: 'seating', name: 'Bar Stool', width: 0.4, depth: 0.4, height: 0.75, color: '#37474F', icon: '🪑', price: 85,
    variants: [{ name: 'Charcoal', color: '#37474F' }, { name: 'Oak', color: '#B5895A' }, { name: 'Red', color: '#B23A3A' }],
  },

  // Tables
  { type: 'table', category: 'tables', name: 'Table', width: 1.5, depth: 0.8, height: 0.75, color: '#CD853F', icon: '🟫', price: 220 },
  { type: 'dining-table', category: 'tables', name: 'Dining Table', width: 1.8, depth: 1.0, height: 0.75, color: '#A0522D', icon: '🟫', price: 420 },
  { type: 'coffee-table', category: 'tables', name: 'Coffee Table', width: 1.2, depth: 0.6, height: 0.4, color: '#CD853F', icon: '🟫', price: 180 },
  { type: 'side-table', category: 'tables', name: 'Side Table', width: 0.5, depth: 0.5, height: 0.55, color: '#8B4513', icon: '🟫', price: 90 },
  { type: 'desk', category: 'tables', name: 'Desk', width: 1.2, depth: 0.6, height: 0.75, color: '#8B4513', icon: '🖥️', price: 320 },

  // Bedroom
  {
    type: 'bed', category: 'bedroom', name: 'Double Bed', width: 2.0, depth: 1.6, height: 0.6, color: '#E8E8E8', icon: '🛏️', price: 800,
    variants: [{ name: 'Linen', color: '#E8E8E8' }, { name: 'Sage', color: '#A5B8A0' }, { name: 'Navy', color: '#34495E' }],
  },
  { type: 'nightstand', category: 'bedroom', name: 'Nightstand', width: 0.5, depth: 0.4, height: 0.6, color: '#8B4513', icon: '🕯️', price: 120 },
  { type: 'wardrobe', category: 'bedroom', name: 'Wardrobe', width: 1.4, depth: 0.6, height: 2.1, color: '#6D4C41', icon: '🚪', price: 540 },
  { type: 'dresser', category: 'bedroom', name: 'Dresser', width: 1.2, depth: 0.5, height: 0.9, color: '#8B4513', icon: '🗄️', price: 380 },

  // Storage
  { type: 'bookshelf', category: 'storage', name: 'Bookshelf', width: 1.0, depth: 0.3, height: 2.0, color: '#654321', icon: '📚', price: 260 },
  { type: 'cabinet', category: 'storage', name: 'Cabinet', width: 0.9, depth: 0.4, height: 1.6, color: '#5D4037', icon: '🗃️', price: 310 },

  // Kitchen
  {
    type: 'fridge', category: 'kitchen', name: 'Refrigerator', width: 0.7, depth: 0.7, height: 1.8, color: '#E0E0E0', icon: '🧊', price: 1200,
    variants: [{ name: 'White', color: '#E0E0E0' }, { name: 'Steel', color: '#90A4AE' }, { name: 'Black', color: '#263238' }],
  },
  { type: 'stove', category: 'kitchen', name: 'Stove', width: 0.7, depth: 0.65, height: 0.9, color: '#424242', icon: '🍳', price: 850 },
  { type: 'dishwasher', category: 'kitchen', name: 'Dishwasher', width: 0.6, depth: 0.6, height: 0.85, color: '#9E9E9E', icon: '🍽️', price: 700 },
  { type: 'kitchen-sink', category: 'kitchen', name: 'Kitchen Sink', width: 0.9, depth: 0.6, height: 0.9, color: '#BDBDBD', icon: '🚰', price: 450 },
  { type: 'counter', category: 'kitchen', name: 'Counter', width: 1.2, depth: 0.6, height: 0.9, color: '#D7CCC8', icon: '🟫', price: 280 },
  // Items have no elevation (lib/geometry), so the microwave comes on its own
  // base cupboard rather than floating at worktop height.
  {
    type: 'microwave', category: 'kitchen', name: 'Microwave', width: 0.6, depth: 0.5, height: 1.25, color: '#B0BEC5', icon: '📟', price: 260,
    variants: [{ name: 'Silver', color: '#B0BEC5' }, { name: 'Black', color: '#263238' }, { name: 'White', color: '#FAFAFA' }],
  },

  // Bathroom
  { type: 'toilet', category: 'bathroom', name: 'Toilet', width: 0.4, depth: 0.7, height: 0.8, color: '#FAFAFA', icon: '🚽', price: 220 },
  { type: 'bathtub', category: 'bathroom', name: 'Bathtub', width: 1.7, depth: 0.8, height: 0.55, color: '#FAFAFA', icon: '🛁', price: 950 },
  { type: 'shower', category: 'bathroom', name: 'Shower', width: 0.9, depth: 0.9, height: 2.1, color: '#E1F5FE', icon: '🚿', price: 680 },
  { type: 'bathroom-sink', category: 'bathroom', name: 'Bathroom Sink', width: 0.6, depth: 0.45, height: 0.85, color: '#FAFAFA', icon: '🪞', price: 280 },
  {
    type: 'washer', category: 'bathroom', name: 'Washing Machine', width: 0.6, depth: 0.6, height: 0.85, color: '#FAFAFA', icon: '🧺', price: 550,
    variants: [{ name: 'White', color: '#FAFAFA' }, { name: 'Graphite', color: '#455A64' }],
  },

  // Electronics
  { type: 'tv', category: 'electronics', name: 'TV Stand', width: 1.5, depth: 0.4, height: 0.5, color: '#2C3E50', icon: '📺', price: 600 },
  { type: 'computer', category: 'electronics', name: 'Computer', width: 0.5, depth: 0.5, height: 0.5, color: '#37474F', icon: '🖥️', price: 950 },
  { type: 'lamp', category: 'electronics', name: 'Lamp', width: 0.3, depth: 0.3, height: 1.5, color: '#FFD700', icon: '💡', price: 110 },
  { type: 'floor-lamp', category: 'electronics', name: 'Floor Lamp', width: 0.35, depth: 0.35, height: 1.7, color: '#FFB300', icon: '🪔', price: 180 },
  // Hangs from the ceiling like the pendant light (lib/mount-band); the colour is the blades'.
  {
    type: 'ceiling-fan', category: 'electronics', name: 'Ceiling Fan', width: 1.2, depth: 1.2, height: 0.45, color: '#8D6E63', icon: '🌀', price: 160,
    variants: [{ name: 'Walnut', color: '#8D6E63' }, { name: 'White', color: '#ECEFF1' }, { name: 'Black', color: '#263238' }],
  },
  { type: 'wifi', category: 'electronics', name: 'Wi-Fi AP', width: 0.2, depth: 0.2, height: 0.1, color: '#0088FF', icon: '📶', price: 140, isWiFiAccessPoint: true, signalRange: 10 },
  { type: 'router', category: 'electronics', name: 'Router', width: 0.3, depth: 0.2, height: 0.1, color: '#1a1a1a', icon: '🌐', price: 160 },
  // LEGACY variant: this is the original electronics-category "CCTV" (a simple
  // signal-circle item, isCCTV/signalRange). It is superseded by the
  // 'security-camera' entry below (security category, real vision cone), but is
  // kept here for backward compatibility so previously saved layouts that
  // reference `type: 'cctv'` still load and render. Do not remove.
  { type: 'cctv', category: 'electronics', name: 'CCTV Camera', width: 0.15, depth: 0.15, height: 0.2, color: '#2C2C2C', icon: '📹', price: 230, isCCTV: true, signalRange: 8 },
  // Security — cameras live in their own category and are browsed via the
  // dedicated CctvMenu (grouped by type); this base entry backs every model.
  // Defaults mirror the Hikvision DS-2CD2143G2-I dome (see lib/cctv-models); height doubles as the wall-mount height (≈2.4 m).
  { type: 'security-camera', category: 'security', name: 'Security Camera', width: 0.25, depth: 0.2, height: 2.4, color: '#1F2933', icon: '🎥', price: 380, hasVisionCone: true, visionRange: 30, visionFov: 103, cctvModelId: 'hik-2cd2143g2' },

  // Decor
  { type: 'plant', category: 'decor', name: 'House Plant', width: 0.4, depth: 0.4, height: 1.0, color: '#228B22', icon: '🪴', price: 60 },
  { type: 'flowerpot', category: 'decor', name: 'Flowerpot', width: 0.25, depth: 0.25, height: 0.35, color: '#FF7043', icon: '🌷', price: 35 },
  { type: 'rug', category: 'decor', name: 'Area Rug', width: 2.0, depth: 1.4, height: 0.02, color: '#C62828', icon: '🟥', price: 220 },
  { type: 'painting', category: 'decor', name: 'Painting', width: 0.8, depth: 0.05, height: 0.6, color: '#5D4037', icon: '🖼️', price: 320 },
  { type: 'vase', category: 'decor', name: 'Vase', width: 0.25, depth: 0.25, height: 0.5, color: '#1976D2', icon: '🏺', price: 75 },
  { type: 'mirror', category: 'decor', name: 'Mirror', width: 0.7, depth: 0.05, height: 1.2, color: '#B0BEC5', icon: '🪞', price: 190 },
  { type: 'curtains', category: 'decor', name: 'Curtains', width: 1.4, depth: 0.2, height: 2.4, color: '#F5DEB3', icon: '🪟', price: 120 },
  { type: 'pendant-light', category: 'decor', name: 'Pendant Light', width: 0.45, depth: 0.45, height: 1.0, color: '#FFC107', icon: '💡', price: 95 },
  { type: 'wall-shelf', category: 'decor', name: 'Wall Shelf', width: 1.0, depth: 0.25, height: 0.06, color: '#8B4513', icon: '📚', price: 60 },
  { type: 'wall-clock', category: 'decor', name: 'Wall Clock', width: 0.5, depth: 0.08, height: 0.5, color: '#FFFFFF', icon: '🕐', price: 45 },
  { type: 'candles', category: 'decor', name: 'Candle Set', width: 0.4, depth: 0.18, height: 0.30, color: '#FFE4B5', icon: '🕯️', price: 30 },
  { type: 'books', category: 'decor', name: 'Stack of Books', width: 0.3, depth: 0.2, height: 0.25, color: '#5D4037', icon: '📖', price: 40 },

  // Outdoor
  { type: 'tree', category: 'outdoor', name: 'Oak Tree', width: 1.4, depth: 1.4, height: 3.8, color: '#2E7D32', icon: '🌳', price: 250 },
  { type: 'pine-tree', category: 'outdoor', name: 'Pine Tree', width: 1.1, depth: 1.1, height: 4.5, color: '#1B5E20', icon: '🌲', price: 280 },
  { type: 'bush', category: 'outdoor', name: 'Bush', width: 0.8, depth: 0.8, height: 0.7, color: '#4CAF50', icon: '🌿', price: 65 },
  { type: 'hedge', category: 'outdoor', name: 'Hedge Section', width: 2.0, depth: 0.5, height: 1.1, color: '#388E3C', icon: '🌳', price: 140 },
  { type: 'flowerbed', category: 'outdoor', name: 'Flower Bed', width: 1.6, depth: 0.6, height: 0.3, color: '#E91E63', icon: '🌷', price: 95 },
  { type: 'tulips', category: 'outdoor', name: 'Tulips', width: 0.5, depth: 0.5, height: 0.4, color: '#F06292', icon: '🌷', price: 35 },
  { type: 'sunflower', category: 'outdoor', name: 'Sunflower', width: 0.4, depth: 0.4, height: 1.6, color: '#FFC107', icon: '🌻', price: 45 },
  { type: 'rose-bush', category: 'outdoor', name: 'Rose Bush', width: 0.6, depth: 0.6, height: 0.9, color: '#C2185B', icon: '🌹', price: 75 },
  { type: 'fence', category: 'outdoor', name: 'Fence Section', width: 2.0, depth: 0.15, height: 1.2, color: '#8D6E63', icon: '🪵', price: 120 },
  { type: 'pool', category: 'outdoor', name: 'Swimming Pool', width: 4.0, depth: 2.5, height: 0.1, color: '#03A9F4', icon: '🏊', price: 4500 },
  { type: 'bbq', category: 'outdoor', name: 'BBQ Grill', width: 0.8, depth: 0.6, height: 1.1, color: '#37474F', icon: '🍖', price: 320 },
  { type: 'mailbox', category: 'outdoor', name: 'Mailbox', width: 0.4, depth: 0.3, height: 1.1, color: '#1976D2', icon: '📬', price: 60 },
  { type: 'birdbath', category: 'outdoor', name: 'Birdbath', width: 0.7, depth: 0.7, height: 0.9, color: '#B0BEC5', icon: '🐦', price: 140 },
  { type: 'lamppost', category: 'outdoor', name: 'Lamppost', width: 0.4, depth: 0.4, height: 3.2, color: '#263238', icon: '💡', price: 220 },
  { type: 'stepping-stone', category: 'outdoor', name: 'Stepping Stone', width: 0.6, depth: 0.6, height: 0.06, color: '#9E9E9E', icon: '⬜', price: 25 },
  { type: 'garden-bench', category: 'outdoor', name: 'Garden Bench', width: 1.5, depth: 0.5, height: 0.85, color: '#5D4037', icon: '🪑', price: 180 },
  { type: 'picnic-table', category: 'outdoor', name: 'Picnic Table', width: 1.8, depth: 1.4, height: 0.75, color: '#A1887F', icon: '🪵', price: 260 },
  { type: 'pond', category: 'outdoor', name: 'Garden Pond', width: 2.2, depth: 1.5, height: 0.25, color: '#0277BD', icon: '💧', price: 1200 },

  // People / scale references
  { type: 'person', category: 'people', name: 'Adult', width: 0.5, depth: 0.3, height: 1.75, color: '#8FA3BF', icon: '🧍', price: 0 },
  { type: 'pet', category: 'people', name: 'Pet', width: 0.45, depth: 0.65, height: 0.4, color: '#A1887F', icon: '🐕', price: 0 },

  // Structure
  { type: 'stairs', category: 'structure', name: 'Stairs', width: 1.2, depth: 2.4, height: 3.0, color: '#8B4513', icon: '🪜', price: 1500 },
  { type: 'stairs', category: 'structure', name: 'Winder Stairs', width: 2.0, depth: 2.6, height: 3.0, color: '#8B4513', icon: '🪜', price: 2200, stairsShape: 'winder' },
  { type: 'door', category: 'structure', name: 'Door', width: 0.9, depth: 0.12, height: 2.05, color: '#6D4C41', icon: '🚪', price: 320 },
  { type: 'window', category: 'structure', name: 'Window', width: 1.2, depth: 0.12, height: 1.2, color: '#90CAF9', icon: '🪟', price: 240 },
  // Door and window types (#922), each at its usual size.
  { type: 'door', category: 'structure', name: 'Double Door', width: 1.6, depth: 0.12, height: 2.1, color: '#6D4C41', icon: '🚪', price: 640, openingStyle: 'double' },
  { type: 'door', category: 'structure', name: 'Sliding Door', width: 2.0, depth: 0.12, height: 2.1, color: '#ECEFF1', icon: '🚪', price: 980, openingStyle: 'sliding' },
  { type: 'door', category: 'structure', name: 'Archway', width: 1.2, depth: 0.12, height: 2.2, color: '#EFE8DA', icon: '🚪', price: 180, openingStyle: 'arch' },
  { type: 'window', category: 'structure', name: 'Tall Window', width: 0.8, depth: 0.12, height: 2.0, color: '#90CAF9', icon: '🪟', price: 360, sillHeight: 0.3, openingStyle: 'tall' },
  { type: 'window', category: 'structure', name: 'Picture Window', width: 1.8, depth: 0.12, height: 1.4, color: '#90CAF9', icon: '🪟', price: 420, openingStyle: 'fixed' },

  // Factory equipment
  {
    type: 'cnc-machine', category: 'factory', name: 'CNC Machining Centre', width: 2.6, depth: 1.9, height: 2.5, color: '#D5DBDF', icon: '🏭', price: 85000,
    variants: [{ name: 'Grey', color: '#D5DBDF' }, { name: 'Blue', color: '#4F7CAC' }, { name: 'Green', color: '#6E9C7F' }],
  },
  { type: 'lathe', category: 'factory', name: 'Lathe', width: 2.6, depth: 1.0, height: 1.5, color: '#6E9C7F', icon: '⚙️', price: 32000 },
  { type: 'hydraulic-press', category: 'factory', name: 'Hydraulic Press', width: 1.8, depth: 1.4, height: 2.7, color: '#4F7CAC', icon: '🔩', price: 46000 },
  { type: 'injection-molder', category: 'factory', name: 'Injection Moulding Machine', width: 4.8, depth: 1.6, height: 2.2, color: '#D5DBDF', icon: '🧪', price: 120000 },
  {
    type: 'conveyor', category: 'factory', name: 'Belt Conveyor', width: 4.0, depth: 0.8, height: 1.2, color: '#3D6FB6', icon: '➡️', price: 6500,
    variants: [{ name: 'Blue', color: '#3D6FB6' }, { name: 'Grey', color: '#8A9399' }, { name: 'Yellow', color: '#E6B422' }],
  },
  { type: 'pallet', category: 'factory', name: 'Loaded Pallet', width: 1.2, depth: 0.8, height: 1.2, color: '#B08A5A', icon: '📦', price: 150 },
  { type: 'pallet-rack', category: 'factory', name: 'Pallet Rack', width: 2.8, depth: 1.1, height: 2.9, color: '#2F5DA8', icon: '🗄️', price: 2400 },
  { type: 'industrial-shelf', category: 'factory', name: 'Metal Shelving', width: 2.0, depth: 0.6, height: 2.0, color: '#7D878D', icon: '🗃️', price: 450 },
  { type: 'forklift', category: 'factory', name: 'Forklift', width: 2.4, depth: 1.2, height: 2.2, color: '#F2A900', icon: '🚜', price: 28000 },
  { type: 'workbench', category: 'factory', name: 'Workbench', width: 1.8, depth: 0.8, height: 1.6, color: '#455A64', icon: '🛠️', price: 900 },
  { type: 'robot-arm', category: 'factory', name: 'Industrial Robot Arm', width: 1.6, depth: 1.6, height: 2.0, color: '#F26B1D', icon: '🦾', price: 65000 },
  { type: 'control-cabinet', category: 'factory', name: 'Control Cabinet', width: 1.2, depth: 0.5, height: 2.0, color: '#C9CED1', icon: '🎛️', price: 7500 },
  { type: 'storage-tank', category: 'factory', name: 'Storage Tank', width: 1.8, depth: 1.8, height: 2.8, color: '#B8C2C8', icon: '🛢️', price: 14000 },
  { type: 'compressor', category: 'factory', name: 'Air Compressor', width: 1.6, depth: 0.8, height: 1.3, color: '#C0392B', icon: '💨', price: 5200 },
  { type: 'safety-barrier', category: 'factory', name: 'Safety Barrier', width: 2.0, depth: 0.15, height: 1.0, color: '#F5C518', icon: '🚧', price: 180 },
  { type: 'locker', category: 'factory', name: 'Staff Lockers', width: 1.2, depth: 0.5, height: 1.9, color: '#5C7A99', icon: '🔐', price: 600 },
  // Food production: biscuit and chocolate
  { type: 'silo', category: 'factory', name: 'Flour Silo', width: 2.0, depth: 2.0, height: 4.6, color: '#D3DADF', icon: '🌾', price: 18000 },
  { type: 'dough-mixer', category: 'factory', name: 'Spiral Dough Mixer', width: 1.6, depth: 1.2, height: 1.8, color: '#C9D1D6', icon: '🥣', price: 24000 },
  { type: 'rotary-moulder', category: 'factory', name: 'Rotary Biscuit Moulder', width: 2.4, depth: 1.6, height: 1.8, color: '#C9D1D6', icon: '🍪', price: 55000 },
  { type: 'tunnel-oven', category: 'factory', name: 'Tunnel Oven', width: 10.0, depth: 1.8, height: 2.0, color: '#B8C2C8', icon: '🔥', price: 240000 },
  { type: 'cooling-tunnel', category: 'factory', name: 'Cooling Tunnel', width: 6.0, depth: 1.4, height: 1.5, color: '#E8EEF2', icon: '❄️', price: 60000 },
  { type: 'conche', category: 'factory', name: 'Chocolate Conche', width: 2.4, depth: 1.8, height: 1.8, color: '#C9D1D6', icon: '🍫', price: 70000 },
  { type: 'tempering-machine', category: 'factory', name: 'Chocolate Tempering Machine', width: 1.4, depth: 1.0, height: 1.8, color: '#C9D1D6', icon: '🌡️', price: 32000 },
  { type: 'enrober', category: 'factory', name: 'Chocolate Enrober', width: 3.0, depth: 1.6, height: 1.8, color: '#C9D1D6', icon: '🍫', price: 85000 },
  { type: 'flow-wrapper', category: 'factory', name: 'Flow-Pack Wrapping Machine', width: 4.0, depth: 1.2, height: 1.7, color: '#ECEFF1', icon: '📦', price: 65000 },
  { type: 'stainless-table', category: 'factory', name: 'Stainless Worktable', width: 2.0, depth: 0.8, height: 0.9, color: '#C9D1D6', icon: '🧑‍🍳', price: 800 },
  { type: 'storage-tank', category: 'factory', name: 'Chocolate Tank', width: 1.4, depth: 1.4, height: 2.4, color: '#C9D1D6', icon: '🛢️', price: 16000 },
] as const satisfies readonly CatalogItem[];

export type RoomTemplateKey = 'bedroom' | 'livingRoom' | 'office' | 'kitchen' | 'bathroom' | 'studio' | 'twoStory' | 'factory';

function singleFloorTemplate(
  name: string,
  width: number,
  height: number,
  floorColor: string,
  items: readonly FloorLayout['items'][number][]
): Omit<RoomLayout, 'id'> {
  return {
    name,
    width,
    height,
    floors: [
      {
        id: 'ground',
        name: 'Ground Floor',
        floorColor,
        items: [...items],
      },
    ],
  };
}

/**
 * A template's door or window, on an exterior wall the way the opening snap
 * seats one (`snapOpeningToWall`): north at z = -depth/2 (rotation 0), south
 * at +depth/2 (π), east at +width/2 (-π/2), west at -width/2 (π/2). `along`
 * is x on the north and south walls, z on the east and west ones (#570).
 * Front-wall openings stay clear of the middle 1.4 m, where adding the
 * default porch cuts its recess (`DEFAULT_ENTRANCE`): |x| >= 0.7 + width/2.
 */
function templateOpening(
  id: string,
  type: 'door' | 'window',
  wall: 'north' | 'south' | 'east' | 'west',
  along: number,
  room: { width: number; depth: number }
): FloorLayout['items'][number] {
  const catalog = type === 'door'
    ? { name: 'Door', width: 0.9, depth: 0.12, height: 2.05, color: '#6D4C41', icon: '🚪', price: 320 }
    : { name: 'Window', width: 1.2, depth: 0.12, height: 1.2, color: '#90CAF9', icon: '🪟', price: 240 };
  const halfW = room.width / 2;
  const halfD = room.depth / 2;
  const seat =
    wall === 'north'
      ? { position: { x: along, z: -halfD }, rotation: 0 }
      : wall === 'south'
        ? { position: { x: along, z: halfD }, rotation: Math.PI }
        : wall === 'east'
          ? { position: { x: halfW, z: along }, rotation: -Math.PI / 2 }
          : { position: { x: -halfW, z: along }, rotation: Math.PI / 2 };
  return { id, type, category: 'structure', ...catalog, ...seat };
}


/**
 * A placed copy of the catalog entry named `name`, for the templates below:
 * the size, colour and price stay the catalog's.
 */
function placed(
  id: string,
  name: string,
  x: number,
  z: number,
  rotation = 0,
  extra: Partial<FloorLayout['items'][number]> = {}
): FloorLayout['items'][number] {
  const entry: CatalogItem | undefined = FURNITURE_CATALOG.find((c) => c.name === name);
  if (!entry) throw new Error(`No catalog item named ${name}`);
  const { variants: _variants, ...item } = entry;
  return { ...item, id, position: { x, z }, rotation, ...extra };
}

const FACTORY_SIZE = { width: 36, depth: 24 };
const PARTITION = '#ECEFF1';

/** Straight interior walls from [x1, z1, x2, z2] runs. */
function partitions(prefix: string, runs: ReadonlyArray<readonly [number, number, number, number]>): InteriorWall[] {
  return runs.map(([x1, z1, x2, z2], i) => ({ id: `${prefix}-${i + 1}`, x1, z1, x2, z2, color: PARTITION }));
}

function zone(id: string, name: string, color: string, x: number, z: number, w: number, d: number): RoomZone {
  return { id, name, color, x, z, w, d };
}

/** A row of pallet racks, 4.5 m tall, at `z`, starting at `x0` and stepping `pitch` along x. */
function rackRow(prefix: string, z: number, x0: number, count: number, pitch = 2.9): FloorLayout['items'] {
  return Array.from({ length: count }, (_, i) => placed(`${prefix}-${i + 1}`, 'Pallet Rack', x0 + i * pitch, z, 0, { height: 4.5 }));
}

/** A desk with its computer and chair, the chair on the +z side. */
function workstation(prefix: string, x: number, z: number): FloorLayout['items'] {
  return [
    placed(`${prefix}-desk`, 'Desk', x, z),
    placed(`${prefix}-pc`, 'Computer', x, z),
    placed(`${prefix}-chair`, 'Chair', x, z + 0.7, Math.PI),
  ];
}

/**
 * A biscuit and chocolate factory over three storeys (factory fork): storage
 * and shipping on the ground floor, production in four sections above it,
 * offices on top. 36 × 24 m, four times the first factory's footprint.
 */
const FACTORY_TEMPLATE: Omit<RoomLayout, 'id'> = {
  name: 'Biscuit & Chocolate Factory',
  width: FACTORY_SIZE.width,
  height: FACTORY_SIZE.depth,
  roof: { style: 'flat', color: '#546e7a' },
  floors: [
    {
      id: 'ground',
      name: 'Storage & Shipping',
      floorColor: '#9E9E9E',
      floorPattern: 'concrete',
      wallPattern: 'panel',
      height: 5,
      interiorWalls: partitions('gf-wall', [[4, -12, 4, -3], [4, 3, 4, 12]]),
      zones: [
        zone('gf-zone-store', 'Raw Material & Product Store', '#90CAF9', -18, -12, 22, 24),
        zone('gf-zone-ship', 'Shipping', '#FFCC80', 4, -12, 14, 24),
      ],
      items: [
        ...rackRow('gf-rack-a', -10.6, -16.3, 6),
        ...rackRow('gf-rack-b', -5.6, -16.3, 6),
        ...rackRow('gf-rack-c', -0.6, -16.3, 6),
        ...rackRow('gf-rack-d', 4.4, -16.3, 6),
        placed('gf-forklift-1', 'Forklift', -9, 8.8),
        placed('gf-pallet-w1', 'Loaded Pallet', -15.5, 9.5),
        placed('gf-pallet-w2', 'Loaded Pallet', -14.0, 9.5),
        placed('gf-pallet-w3', 'Loaded Pallet', -15.5, 10.8),
        placed('gf-pallet-w4', 'Loaded Pallet', -14.0, 10.8),
        ...[6.8, 8.2, 10.8, 12.2, 14.8, 16.2].flatMap((x, i) => [
          placed(`gf-pallet-s${i}a`, 'Loaded Pallet', x, 8.6),
          placed(`gf-pallet-s${i}b`, 'Loaded Pallet', x, 7.4),
        ]),
        placed('gf-forklift-2', 'Forklift', 9, 3.5),
        placed('gf-forklift-3', 'Forklift', 14, 3.5),
        placed('gf-desk', 'Desk', 13, -10.8),
        placed('gf-pc', 'Computer', 13, -10.8),
        placed('gf-chair', 'Chair', 13, -10.1, Math.PI),
        placed('gf-lockers-1', 'Staff Lockers', 6.0, -11.5),
        placed('gf-lockers-2', 'Staff Lockers', 7.3, -11.5),
        placed('gf-cabinet', 'Control Cabinet', 17.7, 0, -Math.PI / 2),
        placed('gf-stairs', 'Stairs', 16.8, -6, 0, { depth: 4.5, height: 5 }),
        placed('gf-entrance', 'Double Door', 9, -FACTORY_SIZE.depth / 2),
        ...[7.5, 11.5, 15.5].map((x, i) => placed(`gf-dock-${i + 1}`, 'Sliding Door', x, FACTORY_SIZE.depth / 2, Math.PI, { width: 3, height: 3.6 })),
        templateOpening('gf-window-1', 'window', 'north', 15.5, FACTORY_SIZE),
        templateOpening('gf-window-2', 'window', 'east', 4, FACTORY_SIZE),
        templateOpening('gf-window-3', 'window', 'west', -3, FACTORY_SIZE),
        templateOpening('gf-window-4', 'window', 'west', 3, FACTORY_SIZE),
      ],
    },
    {
      id: 'first',
      name: 'Production',
      floorColor: '#CFD8DC',
      floorPattern: 'tile',
      wallPattern: 'tile',
      height: 5,
      interiorWalls: partitions('ff-wall', [
        [0, -12, 0, -7], [0, -4, 0, -1.5], [0, 1.5, 0, 4], [0, 7, 0, 12],
        [-18, 0, -10, 0], [-7, 0, -1.5, 0], [1.5, 0, 7, 0], [10, 0, 18, 0],
      ]),
      zones: [
        zone('ff-zone-1', 'Section 1 · Dough Preparation', '#FFE082', -18, -12, 18, 12),
        zone('ff-zone-2', 'Section 2 · Biscuit Line', '#FFAB91', 0, -12, 18, 12),
        zone('ff-zone-3', 'Section 3 · Chocolate', '#BCAAA4', -18, 0, 18, 12),
        zone('ff-zone-4', 'Section 4 · Packaging', '#A5D6A7', 0, 0, 18, 12),
      ],
      items: [
        // Section 1: dough preparation
        placed('ff-silo-1', 'Flour Silo', -16.5, -10.5),
        placed('ff-silo-2', 'Flour Silo', -14.0, -10.5),
        placed('ff-mixer-1', 'Spiral Dough Mixer', -11.0, -10.8),
        placed('ff-mixer-2', 'Spiral Dough Mixer', -8.6, -10.8),
        placed('ff-syrup-tank', 'Storage Tank', -5.5, -10.6),
        placed('ff-table-1', 'Stainless Worktable', -14.0, -5.5),
        placed('ff-table-2', 'Stainless Worktable', -10.5, -5.5),
        placed('ff-shelf', 'Metal Shelving', -1.0, -9.5, Math.PI / 2),
        placed('ff-pallet-1', 'Loaded Pallet', -6.5, -5.5),
        placed('ff-pallet-2', 'Loaded Pallet', -5.1, -5.5),
        // Section 2: biscuit line, moulder → oven → cooling, then back west
        placed('ff-moulder', 'Rotary Biscuit Moulder', 2.0, -10.0),
        placed('ff-oven', 'Tunnel Oven', 8.4, -10.0),
        placed('ff-conveyor-1', 'Belt Conveyor', 14.7, -10.0, 0, { width: 2.4 }),
        placed('ff-conveyor-2', 'Belt Conveyor', 15.0, -7.4, Math.PI / 2, { width: 3 }),
        placed('ff-conveyor-3', 'Belt Conveyor', 14.4, -4.8, Math.PI, { width: 2.4 }),
        placed('ff-cooling-1', 'Cooling Tunnel', 10.0, -4.8, Math.PI),
        placed('ff-table-3', 'Stainless Worktable', 4.5, -4.8),
        placed('ff-cabinet-1', 'Control Cabinet', 4.5, -1.0, Math.PI),
        placed('ff-pallet-3', 'Loaded Pallet', 11.5, -1.8),
        placed('ff-pallet-4', 'Loaded Pallet', 13.0, -1.8),
        // Section 3: chocolate, conching → tempering → enrobing → cooling
        placed('ff-conche-1', 'Chocolate Conche', -15.5, 10.5, Math.PI),
        placed('ff-conche-2', 'Chocolate Conche', -12.4, 10.5, Math.PI),
        placed('ff-temper-1', 'Chocolate Tempering Machine', -9.5, 10.9, Math.PI),
        placed('ff-temper-2', 'Chocolate Tempering Machine', -7.6, 10.9, Math.PI),
        placed('ff-choc-tank-1', 'Chocolate Tank', -16.8, 2.2),
        placed('ff-choc-tank-2', 'Chocolate Tank', -14.9, 2.2),
        placed('ff-enrober', 'Chocolate Enrober', -9.5, 5.5),
        placed('ff-cooling-2', 'Cooling Tunnel', -4.6, 5.5),
        placed('ff-table-4', 'Stainless Worktable', -4.0, 10.8, Math.PI),
        placed('ff-conveyor-4', 'Belt Conveyor', 0, 5.5, 0, { width: 3 }),
        // Section 4: packaging and palletising
        placed('ff-wrapper-1', 'Flow-Pack Wrapping Machine', 3.7, 5.5),
        placed('ff-conveyor-5', 'Belt Conveyor', 7.0, 5.5, 0, { width: 2.4 }),
        placed('ff-robot', 'Industrial Robot Arm', 9.2, 7.0),
        placed('ff-barrier', 'Safety Barrier', 10.2, 7.0, Math.PI / 2),
        placed('ff-pallet-5', 'Loaded Pallet', 11.0, 7.0),
        placed('ff-pallet-6', 'Loaded Pallet', 9.2, 8.8),
        placed('ff-wrapper-2', 'Flow-Pack Wrapping Machine', 12.6, 2.0),
        placed('ff-cabinet-2', 'Control Cabinet', 11.5, 0.6),
        placed('ff-pack-1', 'Stainless Worktable', 3.0, 10.8, Math.PI),
        placed('ff-pack-2', 'Stainless Worktable', 6.0, 10.8, Math.PI),
        placed('ff-pack-3', 'Stainless Worktable', 9.0, 10.8, Math.PI),
        placed('ff-pallet-7', 'Loaded Pallet', 13.0, 10.8),
        placed('ff-pallet-8', 'Loaded Pallet', 14.4, 10.8),
        placed('ff-stairs', 'Stairs', 16.8, 4.8, 0, { depth: 4.5, height: 5 }),
        ...[-15, -9, -3, 3, 9, 15].map((x, i) => templateOpening(`ff-window-n${i + 1}`, 'window', 'north', x, FACTORY_SIZE)),
        ...[-15, -9, 3, 9].map((x, i) => templateOpening(`ff-window-s${i + 1}`, 'window', 'south', x, FACTORY_SIZE)),
        templateOpening('ff-window-e1', 'window', 'east', -10, FACTORY_SIZE),
        templateOpening('ff-window-w1', 'window', 'west', -6, FACTORY_SIZE),
        templateOpening('ff-window-w2', 'window', 'west', 6, FACTORY_SIZE),
      ],
    },
    {
      id: 'second',
      name: 'Offices',
      floorColor: '#D7CCC8',
      floorPattern: 'carpet',
      wallPattern: 'plaster',
      height: 3.2,
      interiorWalls: partitions('sf-wall', [
        [-18, 4, -11, 4], [-9, 4, -6, 4], [-6, 4, -6, 12],
        [12, -12, 12, -6], [12, -6, 14, -6], [16, -6, 18, -6],
      ]),
      zones: [
        zone('sf-zone-open', 'Open Office', '#B3E5FC', -18, -12, 30, 16),
        zone('sf-zone-meeting', 'Meeting Room', '#D1C4E9', -18, 4, 12, 8),
        zone('sf-zone-manager', 'Manager’s Office', '#FFE0B2', 12, -12, 6, 6),
        zone('sf-zone-lounge', 'Break Room', '#C8E6C9', -6, 4, 21, 8),
      ],
      items: [
        ...[-15, -12, -9, -6, -3].flatMap((x, i) => [
          ...workstation(`sf-ws-a${i + 1}`, x, -9),
          ...workstation(`sf-ws-b${i + 1}`, x, -4),
        ]),
        placed('sf-lockers-1', 'Staff Lockers', 2.0, -11.5),
        placed('sf-lockers-2', 'Staff Lockers', 3.3, -11.5),
        placed('sf-plant-1', 'House Plant', -17.4, -11.4),
        placed('sf-plant-2', 'House Plant', 0.5, 0.5),
        // Meeting room
        placed('sf-meet-1', 'Dining Table', -13.0, 8.0),
        placed('sf-meet-2', 'Dining Table', -11.0, 8.0),
        ...[-13.5, -12.5, -11.5, -10.5].flatMap((x, i) => [
          placed(`sf-mchair-n${i + 1}`, 'Dining Chair', x, 7.1),
          placed(`sf-mchair-s${i + 1}`, 'Dining Chair', x, 8.9, Math.PI),
        ]),
        placed('sf-meet-tv', 'TV Stand', -12.0, 11.5, Math.PI),
        // Manager's office
        placed('sf-mgr-desk', 'Desk', 15.0, -10.0),
        placed('sf-mgr-pc', 'Computer', 15.0, -10.0),
        placed('sf-mgr-chair', 'Chair', 15.0, -9.3, Math.PI),
        placed('sf-mgr-shelf', 'Bookshelf', 17.6, -9.0, -Math.PI / 2),
        placed('sf-mgr-armchair', 'Armchair', 13.3, -7.2),
        placed('sf-mgr-plant', 'House Plant', 13.0, -11.4),
        // Break room and kitchenette
        placed('sf-sofa', 'Sofa', 8.0, 10.9, Math.PI),
        placed('sf-coffee', 'Coffee Table', 8.0, 9.6),
        placed('sf-counter', 'Counter', 12.5, 11.5, Math.PI),
        placed('sf-sink', 'Kitchen Sink', 13.6, 11.5, Math.PI),
        placed('sf-fridge', 'Refrigerator', 14.5, 11.45, Math.PI),
        placed('sf-lunch', 'Dining Table', 12.0, 8.0),
        placed('sf-lunch-chair-1', 'Dining Chair', 11.5, 7.1),
        placed('sf-lunch-chair-2', 'Dining Chair', 12.5, 8.9, Math.PI),
        ...[-15, -12, -9, -6, -3, 3, 6, 9, 15].map((x, i) => templateOpening(`sf-window-n${i + 1}`, 'window', 'north', x, FACTORY_SIZE)),
        ...[-15, -12, 3, 6, 9].map((x, i) => templateOpening(`sf-window-s${i + 1}`, 'window', 'south', x, FACTORY_SIZE)),
        templateOpening('sf-window-w1', 'window', 'west', -9, FACTORY_SIZE),
        templateOpening('sf-window-w2', 'window', 'west', -4, FACTORY_SIZE),
        templateOpening('sf-window-e1', 'window', 'east', -9, FACTORY_SIZE),
        templateOpening('sf-window-e2', 'window', 'east', 9, FACTORY_SIZE),
      ],
    },
  ],
};

export const ROOM_TEMPLATES = {
  bedroom: singleFloorTemplate('Bedroom', 4, 3.5, '#F5E6D3', [
    { id: 'bed-1', type: 'bed', category: 'bedroom', name: 'Double Bed', width: 2.0, depth: 1.6, height: 0.6, color: '#E8E8E8', icon: '🛏️', price: 800, position: { x: 0, z: -0.5 }, rotation: 0 },
    { id: 'nightstand-1', type: 'nightstand', category: 'bedroom', name: 'Nightstand', width: 0.5, depth: 0.4, height: 0.6, color: '#8B4513', icon: '🕯️', price: 120, position: { x: -1.3, z: -0.5 }, rotation: 0 },
    { id: 'nightstand-2', type: 'nightstand', category: 'bedroom', name: 'Nightstand', width: 0.5, depth: 0.4, height: 0.6, color: '#8B4513', icon: '🕯️', price: 120, position: { x: 1.3, z: -0.5 }, rotation: 0 },
    { id: 'wardrobe-1', type: 'wardrobe', category: 'bedroom', name: 'Wardrobe', width: 1.4, depth: 0.6, height: 2.1, color: '#6D4C41', icon: '🚪', price: 540, position: { x: -1.0, z: 1.3 }, rotation: Math.PI },
    // Opposite corner from the wardrobe — at (-1.5, 1.2) the floor lamp stood
    // inside the wardrobe's footprint (#120).
    { id: 'lamp-1', type: 'lamp', category: 'electronics', name: 'Lamp', width: 0.3, depth: 0.3, height: 1.5, color: '#FFD700', icon: '💡', price: 110, position: { x: 1.5, z: 1.3 }, rotation: 0 },
    // The wardrobe faces into the room (#575); the door is beside it (#570).
    templateOpening('door-1', 'door', 'south', 0.5, { width: 4, depth: 3.5 }),
    templateOpening('window-1', 'window', 'north', -1.3, { width: 4, depth: 3.5 }),
    templateOpening('window-2', 'window', 'east', 0.4, { width: 4, depth: 3.5 }),
  ]),
  livingRoom: singleFloorTemplate('Living Room', 6, 5, '#D4C5B9', [
    { id: 'sofa-1', type: 'sofa', category: 'seating', name: 'Sofa', width: 2.0, depth: 0.9, height: 0.8, color: '#4A5568', icon: '🛋️', price: 650, position: { x: 0, z: -1.5 }, rotation: 0, sofaShape: 'standard' },
    { id: 'coffee-1', type: 'coffee-table', category: 'tables', name: 'Coffee Table', width: 1.2, depth: 0.6, height: 0.4, color: '#CD853F', icon: '🟫', price: 180, position: { x: 0, z: 0.3 }, rotation: 0 },
    { id: 'tv-1', type: 'tv', category: 'electronics', name: 'TV Stand', width: 1.5, depth: 0.4, height: 0.5, color: '#2C3E50', icon: '📺', price: 600, position: { x: 0, z: 2 }, rotation: Math.PI },
    { id: 'armchair-1', type: 'armchair', category: 'seating', name: 'Armchair', width: 0.9, depth: 0.9, height: 0.85, color: '#6D4C41', icon: '💺', price: 280, position: { x: -2.0, z: -1.0 }, rotation: Math.PI / 4 },
    { id: 'plant-1', type: 'plant', category: 'decor', name: 'House Plant', width: 0.4, depth: 0.4, height: 1.0, color: '#228B22', icon: '🪴', price: 60, position: { x: -2.5, z: 2 }, rotation: 0 },
    { id: 'rug-1', type: 'rug', category: 'decor', name: 'Area Rug', width: 2.0, depth: 1.4, height: 0.02, color: '#C62828', icon: '🟥', price: 220, position: { x: 0, z: -0.5 }, rotation: 0 },
    { id: 'wifi-1', type: 'wifi', category: 'electronics', name: 'Wi-Fi AP', width: 0.2, depth: 0.2, height: 0.1, color: '#0088FF', icon: '📶', price: 140, isWiFiAccessPoint: true, signalRange: 10, position: { x: 2, z: 1.5 }, rotation: 0 },
    templateOpening('door-1', 'door', 'north', 2, { width: 6, depth: 5 }),
    templateOpening('window-1', 'window', 'north', -1.6, { width: 6, depth: 5 }),
    templateOpening('window-2', 'window', 'west', 0.5, { width: 6, depth: 5 }),
    templateOpening('window-3', 'window', 'east', -0.5, { width: 6, depth: 5 }),
  ]),
  office: singleFloorTemplate('Home Office', 3.5, 3, '#E8DCC4', [
    { id: 'desk-1', type: 'desk', category: 'tables', name: 'Desk', width: 1.2, depth: 0.6, height: 0.75, color: '#8B4513', icon: '🖥️', price: 320, position: { x: 0, z: -0.8 }, rotation: 0 },
    { id: 'computer-1', type: 'computer', category: 'electronics', name: 'Computer', width: 0.5, depth: 0.5, height: 0.5, color: '#37474F', icon: '🖥️', price: 950, position: { x: 0, z: -0.8 }, rotation: 0 },
    { id: 'chair-1', type: 'chair', category: 'seating', name: 'Office Chair', width: 0.5, depth: 0.5, height: 0.8, color: '#8B4513', icon: '🪑', price: 75, position: { x: 0, z: 0 }, rotation: Math.PI },
    { id: 'bookshelf-1', type: 'bookshelf', category: 'storage', name: 'Bookshelf', width: 1.0, depth: 0.3, height: 2.0, color: '#654321', icon: '📚', price: 260, position: { x: -1.2, z: -0.8 }, rotation: 0 },
    { id: 'lamp-1', type: 'lamp', category: 'electronics', name: 'Desk Lamp', width: 0.3, depth: 0.3, height: 1.5, color: '#FFD700', icon: '💡', price: 110, position: { x: 0.5, z: -0.8 }, rotation: 0 },
    { id: 'plant-1', type: 'plant', category: 'decor', name: 'Plant', width: 0.4, depth: 0.4, height: 1.0, color: '#228B22', icon: '🪴', price: 60, position: { x: 1.3, z: 1 }, rotation: 0 },
    templateOpening('door-1', 'door', 'east', -0.2, { width: 3.5, depth: 3 }),
    templateOpening('window-1', 'window', 'south', 0, { width: 3.5, depth: 3 }),
    templateOpening('window-2', 'window', 'west', 0.5, { width: 3.5, depth: 3 }),
  ]),
  kitchen: singleFloorTemplate('Kitchen', 4.5, 3.5, '#ECEFF1', [
    { id: 'fridge-1', type: 'fridge', category: 'kitchen', name: 'Refrigerator', width: 0.7, depth: 0.7, height: 1.8, color: '#E0E0E0', icon: '🧊', price: 1200, position: { x: -1.8, z: -1.2 }, rotation: 0 },
    { id: 'stove-1', type: 'stove', category: 'kitchen', name: 'Stove', width: 0.7, depth: 0.65, height: 0.9, color: '#424242', icon: '🍳', price: 850, position: { x: -1.0, z: -1.2 }, rotation: 0 },
    { id: 'counter-1', type: 'counter', category: 'kitchen', name: 'Counter', width: 1.2, depth: 0.6, height: 0.9, color: '#D7CCC8', icon: '🟫', price: 280, position: { x: 0.4, z: -1.2 }, rotation: 0 },
    { id: 'sink-1', type: 'kitchen-sink', category: 'kitchen', name: 'Kitchen Sink', width: 0.9, depth: 0.6, height: 0.9, color: '#BDBDBD', icon: '🚰', price: 450, position: { x: 1.5, z: -1.2 }, rotation: 0 },
    { id: 'dining-1', type: 'dining-table', category: 'tables', name: 'Dining Table', width: 1.8, depth: 1.0, height: 0.75, color: '#A0522D', icon: '🟫', price: 420, position: { x: 0, z: 0.6 }, rotation: 0 },
    { id: 'dining-chair-1', type: 'dining-chair', category: 'seating', name: 'Dining Chair', width: 0.45, depth: 0.45, height: 0.9, color: '#5D4037', icon: '🪑', price: 95, position: { x: -0.7, z: 0.6 }, rotation: Math.PI / 2 },
    { id: 'dining-chair-2', type: 'dining-chair', category: 'seating', name: 'Dining Chair', width: 0.45, depth: 0.45, height: 0.9, color: '#5D4037', icon: '🪑', price: 95, position: { x: 0.7, z: 0.6 }, rotation: -Math.PI / 2 },
    templateOpening('door-1', 'door', 'south', 1.4, { width: 4.5, depth: 3.5 }),
    templateOpening('window-1', 'window', 'north', 1.5, { width: 4.5, depth: 3.5 }),
    templateOpening('window-2', 'window', 'west', 0.5, { width: 4.5, depth: 3.5 }),
  ]),
  bathroom: singleFloorTemplate('Bathroom', 3, 2.5, '#E0F2F1', [
    { id: 'toilet-1', type: 'toilet', category: 'bathroom', name: 'Toilet', width: 0.4, depth: 0.7, height: 0.8, color: '#FAFAFA', icon: '🚽', price: 220, position: { x: -1.0, z: -0.7 }, rotation: 0 },
    { id: 'sink-1', type: 'bathroom-sink', category: 'bathroom', name: 'Sink', width: 0.6, depth: 0.45, height: 0.85, color: '#FAFAFA', icon: '🪞', price: 280, position: { x: 0.2, z: -0.85 }, rotation: 0 },
    { id: 'bathtub-1', type: 'bathtub', category: 'bathroom', name: 'Bathtub', width: 1.7, depth: 0.8, height: 0.55, color: '#FAFAFA', icon: '🛁', price: 950, position: { x: 0, z: 0.7 }, rotation: 0 },
    { id: 'mirror-1', type: 'mirror', category: 'decor', name: 'Mirror', width: 0.7, depth: 0.05, height: 1.2, color: '#B0BEC5', icon: '🪞', price: 190, position: { x: 0.2, z: -1.15 }, rotation: 0 },
    templateOpening('door-1', 'door', 'east', -0.3, { width: 3, depth: 2.5 }),
    templateOpening('window-1', 'window', 'south', 0, { width: 3, depth: 2.5 }),
  ]),
  studio: singleFloorTemplate('Studio Apartment', 7, 6, '#EFEBE9', [
    { id: 'bed-1', type: 'bed', category: 'bedroom', name: 'Double Bed', width: 2.0, depth: 1.6, height: 0.6, color: '#E8E8E8', icon: '🛏️', price: 800, position: { x: -2.2, z: -1.8 }, rotation: 0 },
    { id: 'sofa-1', type: 'sofa', category: 'seating', name: 'Sofa', width: 2.0, depth: 0.9, height: 0.8, color: '#4A5568', icon: '🛋️', price: 650, position: { x: 1.5, z: 1.0 }, rotation: -Math.PI / 2, sofaShape: 'standard' },
    { id: 'desk-1', type: 'desk', category: 'tables', name: 'Desk', width: 1.2, depth: 0.6, height: 0.75, color: '#8B4513', icon: '🖥️', price: 320, position: { x: 2.5, z: -2.2 }, rotation: 0 },
    { id: 'fridge-1', type: 'fridge', category: 'kitchen', name: 'Refrigerator', width: 0.7, depth: 0.7, height: 1.8, color: '#E0E0E0', icon: '🧊', price: 1200, position: { x: -3.0, z: 2.4 }, rotation: Math.PI },
    { id: 'stove-1', type: 'stove', category: 'kitchen', name: 'Stove', width: 0.7, depth: 0.65, height: 0.9, color: '#424242', icon: '🍳', price: 850, position: { x: -2.2, z: 2.4 }, rotation: Math.PI },
    { id: 'sink-1', type: 'kitchen-sink', category: 'kitchen', name: 'Sink', width: 0.9, depth: 0.6, height: 0.9, color: '#BDBDBD', icon: '🚰', price: 450, position: { x: -1.2, z: 2.4 }, rotation: Math.PI },
    // The kitchen run faces into the room, not the south wall (#575).
    templateOpening('door-1', 'door', 'north', 1.3, { width: 7, depth: 6 }),
    templateOpening('window-1', 'window', 'north', -2.2, { width: 7, depth: 6 }),
    templateOpening('window-2', 'window', 'east', 0.5, { width: 7, depth: 6 }),
    templateOpening('window-3', 'window', 'south', -1.2, { width: 7, depth: 6 }),
  ]),
  twoStory: {
    name: 'Two-Story Home',
    width: 6,
    height: 5,
    floors: [
      {
        id: 'ground',
        name: 'Ground Floor',
        floorColor: '#D4C5B9',
        items: [
          { id: 'gf-sofa', type: 'sofa', category: 'seating', name: 'Sofa', width: 2.0, depth: 0.9, height: 0.8, color: '#4A5568', icon: '🛋️', price: 650, position: { x: -1.4, z: -1.5 }, rotation: 0 },
          { id: 'gf-tv', type: 'tv', category: 'electronics', name: 'TV Stand', width: 1.5, depth: 0.4, height: 0.5, color: '#2C3E50', icon: '📺', price: 600, position: { x: -1.4, z: 1.8 }, rotation: Math.PI },
          { id: 'gf-fridge', type: 'fridge', category: 'kitchen', name: 'Refrigerator', width: 0.7, depth: 0.7, height: 1.8, color: '#E0E0E0', icon: '🧊', price: 1200, position: { x: 2.2, z: -2.0 }, rotation: -Math.PI / 2 },
          { id: 'gf-stove', type: 'stove', category: 'kitchen', name: 'Stove', width: 0.7, depth: 0.65, height: 0.9, color: '#424242', icon: '🍳', price: 850, position: { x: 2.2, z: -1.1 }, rotation: -Math.PI / 2 },
          { id: 'gf-stairs', type: 'stairs', category: 'structure', name: 'Stairs', width: 1.2, depth: 2.4, height: 3.0, color: '#8B4513', icon: '🪜', price: 1500, position: { x: 2.0, z: 1.0 }, rotation: 0 },
          // The fridge and stove face the room from the east wall (#575).
          templateOpening('gf-door', 'door', 'north', 1.2, { width: 6, depth: 5 }),
          templateOpening('gf-window-1', 'window', 'north', -1.4, { width: 6, depth: 5 }),
          templateOpening('gf-window-2', 'window', 'west', 0.3, { width: 6, depth: 5 }),
        ],
      },
      {
        id: 'first',
        name: 'First Floor',
        floorColor: '#F5E6D3',
        items: [
          { id: 'ff-bed', type: 'bed', category: 'bedroom', name: 'Double Bed', width: 2.0, depth: 1.6, height: 0.6, color: '#E8E8E8', icon: '🛏️', price: 800, position: { x: -1.5, z: -1.5 }, rotation: 0 },
          { id: 'ff-wardrobe', type: 'wardrobe', category: 'bedroom', name: 'Wardrobe', width: 1.4, depth: 0.6, height: 2.1, color: '#6D4C41', icon: '🚪', price: 540, position: { x: -2.0, z: 1.85 }, rotation: Math.PI },
          { id: 'ff-stairs', type: 'stairs', category: 'structure', name: 'Stairs', width: 1.2, depth: 2.4, height: 3.0, color: '#8B4513', icon: '🪜', price: 1500, position: { x: 2.0, z: 1.0 }, rotation: 0 },
          templateOpening('ff-window-1', 'window', 'north', -1.5, { width: 6, depth: 5 }),
          templateOpening('ff-window-2', 'window', 'west', 0, { width: 6, depth: 5 }),
        ],
      },
    ],
  },
  factory: FACTORY_TEMPLATE,
} as const satisfies Record<RoomTemplateKey, Omit<RoomLayout, 'id'>>;
