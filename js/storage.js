// storage.js
// Centralizes all browser local storage read/write logic for the AgriBida prototype.
// Sample data lives in data.js; this file is the only place that talks to localStorage
// so it stays easy to reset before a class presentation.

// Local storage keys, one per data entity.
const STORAGE_KEYS = {
  users: "agribida_users",
  farmerProfiles: "agribida_farmerProfiles",
  buyerProfiles: "agribida_buyerProfiles",
  produceListings: "agribida_produceListings",
  bids: "agribida_bids",
  reviews: "agribida_reviews",
  marketPriceRecords: "agribida_marketPriceRecords",
  currentUser: "agribida_currentUser",
  seeded: "agribida_seeded",
};

// Generic helpers for reading and writing JSON values.
function readJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`AgriBida storage: could not parse "${key}", using fallback.`, error);
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Loads the sample data from data.js into local storage the first time the app opens.
// Safe to call on every page load; it only seeds when no data has been saved yet.
function seedStorageIfEmpty() {
  if (localStorage.getItem(STORAGE_KEYS.seeded)) return;

  writeJSON(STORAGE_KEYS.users, SAMPLE_USERS);
  writeJSON(STORAGE_KEYS.farmerProfiles, SAMPLE_FARMER_PROFILES);
  writeJSON(STORAGE_KEYS.buyerProfiles, SAMPLE_BUYER_PROFILES);
  writeJSON(STORAGE_KEYS.produceListings, SAMPLE_PRODUCE_LISTINGS);
  writeJSON(STORAGE_KEYS.bids, SAMPLE_BIDS);
  writeJSON(STORAGE_KEYS.reviews, SAMPLE_REVIEWS);
  writeJSON(STORAGE_KEYS.marketPriceRecords, SAMPLE_MARKET_PRICE_RECORDS);
  localStorage.setItem(STORAGE_KEYS.seeded, "true");
}

// Resets local storage back to the original sample data from data.js.
// Also clears the signed-in sample user so the app returns to a fresh state.
function resetStorage() {
  localStorage.removeItem(STORAGE_KEYS.seeded);
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  seedStorageIfEmpty();
}

// Users
function getUsers() {
  return readJSON(STORAGE_KEYS.users, []);
}
function saveUsers(users) {
  writeJSON(STORAGE_KEYS.users, users);
}
function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}
// Case-insensitive lookup used by the login and registration forms.
function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  return getUsers().find((user) => user.email && user.email.toLowerCase() === normalized);
}

// Farmer Profiles
function getFarmerProfiles() {
  return readJSON(STORAGE_KEYS.farmerProfiles, []);
}
function saveFarmerProfiles(farmerProfiles) {
  writeJSON(STORAGE_KEYS.farmerProfiles, farmerProfiles);
}
function addFarmerProfile(profile) {
  const profiles = getFarmerProfiles();
  profiles.push(profile);
  saveFarmerProfiles(profiles);
}

// Buyer Profiles
function getBuyerProfiles() {
  return readJSON(STORAGE_KEYS.buyerProfiles, []);
}
function saveBuyerProfiles(buyerProfiles) {
  writeJSON(STORAGE_KEYS.buyerProfiles, buyerProfiles);
}
function addBuyerProfile(profile) {
  const profiles = getBuyerProfiles();
  profiles.push(profile);
  saveBuyerProfiles(profiles);
}

// Produce Listings
function getListings() {
  return readJSON(STORAGE_KEYS.produceListings, []);
}
function saveListings(listings) {
  writeJSON(STORAGE_KEYS.produceListings, listings);
}

// Bids
function getBids() {
  return readJSON(STORAGE_KEYS.bids, []);
}
function saveBids(bids) {
  writeJSON(STORAGE_KEYS.bids, bids);
}

// Reviews
function getReviews() {
  return readJSON(STORAGE_KEYS.reviews, []);
}
function saveReviews(reviews) {
  writeJSON(STORAGE_KEYS.reviews, reviews);
}

// Market-Price Records
function getMarketPriceRecords() {
  return readJSON(STORAGE_KEYS.marketPriceRecords, []);
}
function saveMarketPriceRecords(records) {
  writeJSON(STORAGE_KEYS.marketPriceRecords, records);
}

// Currently signed-in sample user (set by the Role Selection page).
function getCurrentUser() {
  return readJSON(STORAGE_KEYS.currentUser, null);
}
function setCurrentUser(user) {
  writeJSON(STORAGE_KEYS.currentUser, user);
}
function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
}
