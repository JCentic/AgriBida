// data.js
// Initial sample (mock) data for the AgriBida prototype.
// Every record here is demonstration data only — see AGENTS.md.
// storage.js copies these arrays into browser local storage the first time the app opens.

// Sample Users
// role is one of: "farmer", "buyer", "administrator"
// email/password simulate sign-in credentials for the demo login form.
// Plaintext, prototype-only — never store real passwords this way.
const SAMPLE_USERS = [
  {
    id: "user-001",
    name: "Maria Santos",
    email: "maria.santos@agribida.test",
    password: "Farmer#2026",
    role: "farmer",
    location: "Nueva Ecija",
    profileId: "farmer-001",
  },
  {
    id: "user-002",
    name: "Metro Fresh Produce",
    email: "contact@metrofresh.test",
    password: "Buyer#2026",
    role: "buyer",
    location: "Quezon City",
    profileId: "buyer-001",
  },
  {
    id: "user-003",
    name: "Golden Harvest Trading",
    email: "info@goldenharvest.test",
    password: "Buyer#2027",
    role: "buyer",
    location: "Cabanatuan City",
    profileId: "buyer-002",
  },
  {
    id: "user-004",
    name: "Admin User",
    email: "admin@agribida.test",
    password: "Admin#2026",
    role: "administrator",
    location: "Manila",
    profileId: null,
  },
];

// Sample Farmer Profiles
const SAMPLE_FARMER_PROFILES = [
  {
    id: "farmer-001",
    userId: "user-001",
    farmName: "Santos Vegetable Farm",
    produceTypes: ["Tomato", "Eggplant"],
  },
];

// Sample Buyer Profiles
const SAMPLE_BUYER_PROFILES = [
  {
    id: "buyer-001",
    userId: "user-002",
    businessName: "Metro Fresh Produce",
    verificationStatus: "Verified Buyer",
    rating: 4.6,
    reviewCount: 12,
    feedback: ["Pays on time.", "Clear communication."],
  },
  {
    id: "buyer-002",
    userId: "user-003",
    businessName: "Golden Harvest Trading",
    verificationStatus: "Pending Verification",
    rating: 3.8,
    reviewCount: 5,
    feedback: ["Reasonable offers.", "First-time buyer on the platform."],
  },
];

// Sample Produce Listings
// status is one of: "Open", "Selected", "Closed"
const SAMPLE_PRODUCE_LISTINGS = [
  {
    id: "listing-001",
    farmerId: "farmer-001",
    produceName: "Tomato",
    quantity: 150,
    unit: "kg",
    location: "Nueva Ecija",
    preferredPrice: 35,
    availabilityDate: "2026-09-10",
    status: "Open",
    selectedBidId: null,
    images: [
      "assets/produce/tomato-1.svg",
      "assets/produce/tomato-2.svg",
      "assets/produce/tomato-3.svg",
    ],
  },
  {
    id: "listing-002",
    farmerId: "farmer-001",
    produceName: "Eggplant",
    quantity: 80,
    unit: "kg",
    location: "Nueva Ecija",
    preferredPrice: 28,
    availabilityDate: "2026-09-15",
    status: "Open",
    selectedBidId: null,
    images: [
      "assets/produce/eggplant-1.svg",
      "assets/produce/eggplant-2.svg",
      "assets/produce/eggplant-3.svg",
    ],
  },
];

// Sample Bids
// status is one of: "Pending", "Selected", "Not Selected"
const SAMPLE_BIDS = [
  {
    id: "bid-001",
    listingId: "listing-001",
    buyerId: "buyer-001",
    offeredPrice: 38,
    requestedQuantity: 100,
    message: "Can collect on September 10.",
    submittedAt: "2026-08-31T10:30:00",
    status: "Pending",
  },
  {
    id: "bid-002",
    listingId: "listing-001",
    buyerId: "buyer-002",
    offeredPrice: 33,
    requestedQuantity: 50,
    message: "Can pick up anytime after harvest.",
    submittedAt: "2026-08-31T14:15:00",
    status: "Pending",
  },
];

// Sample Reviews (feedback shown on buyer profiles)
const SAMPLE_REVIEWS = [
  {
    id: "review-001",
    buyerId: "buyer-001",
    rating: 5,
    comment: "Buyer communicated clearly and arrived as agreed.",
    reviewerLabel: "Sample Farmer Review",
  },
  {
    id: "review-002",
    buyerId: "buyer-002",
    rating: 4,
    comment: "Fair offer and easy to reach by phone.",
    reviewerLabel: "Sample Farmer Review",
  },
];

// Sample Market-Price Records
const SAMPLE_MARKET_PRICE_RECORDS = [
  {
    id: "price-001",
    produceName: "Tomato",
    location: "Nueva Ecija",
    lowPrice: 30,
    averagePrice: 36,
    highPrice: 42,
    unit: "kg",
    updatedDate: "2026-08-30",
  },
  {
    id: "price-002",
    produceName: "Eggplant",
    location: "Nueva Ecija",
    lowPrice: 24,
    averagePrice: 28,
    highPrice: 32,
    unit: "kg",
    updatedDate: "2026-08-30",
  },
];
