// Mock data for LIBRA 3D PRINTING marketplace prototype

export const BRAND = {
  logoUrl:
    "https://customer-assets.emergentagent.com/job_da83cff4-2ef6-43de-8704-8f305603e548/artifacts/nu8in5om_Logo-petrol.jpg",
  headerUrl:
    "https://customer-assets.emergentagent.com/job_da83cff4-2ef6-43de-8704-8f305603e548/artifacts/jabjxu1c_Header-petrol.jpg",
};

export const CATEGORIES = [
  {
    id: "home-decor",
    name: "Home Decor",
    blurb: "Statement pieces, sculptural lighting & geometric vases.",
    image:
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: "desk-accessories",
    name: "Desk Accessories",
    blurb: "Organize your workspace with precision-printed tools.",
    image:
      "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: "miniatures",
    name: "Miniatures & Models",
    blurb: "Hand-finished tabletop figures and architectural models.",
    image:
      "https://ix-marketing.imgix.net/global.jpg?auto=format,compress&w=900&q=70",
  },
  {
    id: "replacement-parts",
    name: "Replacement Parts",
    blurb: "Custom-engineered replacements for appliances & gear.",
    image:
      "https://ix-marketing.imgix.net/auto-hero.png?auto=format,compress&w=900&q=70",
  },
  {
    id: "tools-gadgets",
    name: "Tools & Gadgets",
    blurb: "Functional everyday gadgets engineered to last.",
    image:
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: "gifts",
    name: "Gifts",
    blurb: "Personalized, memorable, one-of-a-kind giftables.",
    image:
      "https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: "custom-prints",
    name: "Custom Prints",
    blurb: "Send us your idea, we'll print it to perfection.",
    image:
      "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=900&q=70",
  },
];

export const MATERIALS = ["PLA", "PETG", "ABS", "Resin", "TPU", "Nylon"];
export const COLORS = [
  { name: "Petrol", hex: "#0E5A5C" },
  { name: "Gold", hex: "#D4A53A" },
  { name: "Ivory", hex: "#F2EBDD" },
  { name: "Charcoal", hex: "#2B2B2B" },
  { name: "Forest", hex: "#1F4A3A" },
  { name: "Brick", hex: "#A04A2C" },
  { name: "Cobalt", hex: "#1E4FA8" },
  { name: "Bone", hex: "#E6E1D2" },
];

const img = (path) => `https://images.unsplash.com/${path}?auto=format&fit=crop&w=900&q=70`;

export const PRODUCTS = [
  {
    id: "geometric-plant-pot",
    name: "Geometric Plant Pot",
    category: "home-decor",
    price: 38,
    rating: 4.8,
    reviews: 124,
    bestSeller: true,
    inStock: true,
    material: "PLA",
    materials: ["PLA", "PETG"],
    colors: ["Petrol", "Ivory", "Charcoal"],
    dimensions: '120 × 120 × 140 mm',
    description:
      "A faceted geometric planter with a tessellated surface that catches light from every angle. Drainage hole and matte finish included.",
    images: [
      img("photo-1485955900006-10f4d324d411"),
      img("photo-1459411552884-841db9b3cc2a"),
      img("photo-1483794344563-d27a8d18014e"),
    ],
    new: true,
  },
  {
    id: "cable-organizer-clips",
    name: "Cable Organizer Clips",
    category: "desk-accessories",
    price: 12,
    rating: 4.6,
    reviews: 89,
    bestSeller: true,
    inStock: true,
    material: "PETG",
    materials: ["PETG", "ABS"],
    colors: ["Charcoal", "Gold", "Ivory"],
    dimensions: 'Set of 6 · 30 × 18 × 12 mm each',
    description:
      "Clip-on cable management for desks, monitors and TV mounts. Strong adhesive backing and snap-lock for thick cables.",
    images: [
      img("photo-1558959356-2f36b410cd99"),
      img("photo-1593062096033-9a26b09da705"),
    ],
    new: false,
  },
  {
    id: "custom-keychain",
    name: "Custom Keychain",
    category: "gifts",
    price: 9,
    rating: 4.9,
    reviews: 312,
    bestSeller: true,
    inStock: true,
    material: "PLA",
    materials: ["PLA", "Resin"],
    colors: ["Gold", "Petrol", "Brick", "Cobalt"],
    dimensions: '60 × 28 × 4 mm',
    description:
      "Personalized keychain printed with your name, initials or favorite shape. Sealed with a sleek satin coat.",
    images: [
      img("photo-1602080109637-5f9c00a8c1e9"),
      img("photo-1607344645866-009c320b63e0"),
    ],
    new: true,
  },
  {
    id: "miniature-dragon-figure",
    name: "Miniature Dragon Figure",
    category: "miniatures",
    price: 42,
    rating: 4.9,
    reviews: 76,
    bestSeller: false,
    inStock: true,
    material: "Resin",
    materials: ["Resin"],
    colors: ["Charcoal", "Forest", "Gold"],
    dimensions: '90 × 70 × 110 mm',
    description:
      "Hand-finished tabletop dragon, ready to paint or display. Resin-printed at 25-micron layer height for razor-sharp detail.",
    images: [
      img("photo-1606503153255-59d8b8b18d2c"),
      img("photo-1612198273689-fb53d7ec70a8"),
    ],
    new: false,
  },
  {
    id: "replacement-knob",
    name: "Replacement Knob",
    category: "replacement-parts",
    price: 7,
    rating: 4.5,
    reviews: 41,
    bestSeller: false,
    inStock: true,
    material: "ABS",
    materials: ["ABS", "PETG"],
    colors: ["Charcoal", "Bone"],
    dimensions: '32 × 32 × 18 mm',
    description:
      "Replacement knob for appliances, dressers and audio gear. Send us your spec or pick from 40+ presets.",
    images: [
      img("photo-1581092918056-0c4c3acd3789"),
      img("photo-1581092580497-e0d23cbdf1dc"),
    ],
    new: false,
  },
  {
    id: "desk-phone-stand",
    name: "Desk Phone Stand",
    category: "desk-accessories",
    price: 24,
    rating: 4.7,
    reviews: 198,
    bestSeller: true,
    inStock: true,
    material: "PETG",
    materials: ["PETG", "PLA"],
    colors: ["Petrol", "Charcoal", "Gold"],
    dimensions: '110 × 80 × 95 mm',
    description:
      "Minimal phone stand with cable pass-through and silicone grip pads. Holds devices up to 13 mm thick.",
    images: [
      img("photo-1565849904461-04a58ad377e0"),
      img("photo-1525547719571-a2d4ac8945e2"),
    ],
    new: true,
  },
  {
    id: "wall-art-panel",
    name: "Wall Art Panel",
    category: "home-decor",
    price: 89,
    rating: 4.8,
    reviews: 54,
    bestSeller: false,
    inStock: false,
    material: "PLA",
    materials: ["PLA", "PETG"],
    colors: ["Gold", "Ivory", "Petrol"],
    dimensions: '400 × 400 × 18 mm',
    description:
      "A modular parametric wall panel inspired by topographic maps. Mount as a single piece or build a custom mural.",
    images: [
      img("photo-1604147495798-57beb5d6af73"),
      img("photo-1483794344563-d27a8d18014e"),
    ],
    new: false,
  },
  {
    id: "tool-holder",
    name: "Tool Holder",
    category: "tools-gadgets",
    price: 32,
    rating: 4.6,
    reviews: 67,
    bestSeller: false,
    inStock: true,
    material: "ABS",
    materials: ["ABS", "Nylon"],
    colors: ["Charcoal", "Brick"],
    dimensions: '220 × 90 × 60 mm',
    description:
      "Workbench tool caddy with magnetic strip, drill-bit ports and screwdriver slots. Built for daily abuse.",
    images: [
      img("photo-1530124566582-a618bc2615dc"),
      img("photo-1581092918056-0c4c3acd3789"),
    ],
    new: true,
  },
];

export const REVIEWS = [
  {
    id: "r1",
    name: "Amelia R.",
    rating: 5,
    date: "Jan 12, 2026",
    title: "Stunning detail.",
    body: "The layer lines are practically invisible. Looks even better in person than in the photos.",
  },
  {
    id: "r2",
    name: "Marcus K.",
    rating: 5,
    date: "Dec 28, 2025",
    title: "Premium feel.",
    body: "Packaging was beautiful, finish is flawless. Will definitely order again.",
  },
  {
    id: "r3",
    name: "Priya S.",
    rating: 4,
    date: "Dec 04, 2025",
    title: "Great quality.",
    body: "Shipped fast and arrived in perfect condition. Color matched what was shown online.",
  },
];

// Admin mockup data
export const ADMIN_ORDERS = [
  { id: "#LB-10421", customer: "Sofia M.", total: 142, status: "Shipped", date: "Feb 18" },
  { id: "#LB-10420", customer: "Liam P.", total: 38, status: "Processing", date: "Feb 18" },
  { id: "#LB-10419", customer: "Hana T.", total: 246, status: "Delivered", date: "Feb 17" },
  { id: "#LB-10418", customer: "Jonas B.", total: 89, status: "Processing", date: "Feb 17" },
  { id: "#LB-10417", customer: "Ines R.", total: 24, status: "Shipped", date: "Feb 16" },
];

export const ADMIN_REQUESTS = [
  { id: "CR-204", name: "Rafael Q.", idea: "Custom drone landing gear", material: "Nylon", status: "Pending" },
  { id: "CR-203", name: "Theo W.", idea: "Replica vintage radio knob", material: "ABS", status: "Quoted" },
  { id: "CR-202", name: "Mira L.", idea: "Wedding cake topper", material: "Resin", status: "Pending" },
  { id: "CR-201", name: "Anders K.", idea: "Architectural model 1:200", material: "PLA", status: "In Progress" },
];
