// farmer.js
// Farmer-facing page logic: dashboard, create/edit listing form, and listing detail
// (bids received). Shared auth/storage/nav logic stays in script.js and storage.js.

// Maps listing form field names to their input element ids.
const LISTING_FIELD_IDS = {
  produceName: "listing-produce-name",
  quantity: "listing-quantity",
  unit: "listing-unit",
  location: "listing-location",
  preferredPrice: "listing-price",
  availabilityDate: "listing-date",
};

// ---------- Small shared formatting helpers ----------

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

function formatCurrency(amount) {
  return `₱${Number(amount).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
}

// Formats a full ISO timestamp (e.g. a bid's submittedAt).
function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

// Formats a plain "YYYY-MM-DD" date without shifting by timezone.
function formatDateOnly(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function statusBadgeClass(status) {
  if (status === "Open") return "status-badge--open";
  if (status === "Selected") return "status-badge--selected";
  return "status-badge--closed";
}

// ---------- Farmer Dashboard ----------

function initFarmerDashboard() {
  const user = requireRole("farmer");
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get("created") === "1") {
    showNotification("Listing created and published as Open.");
  }

  renderFarmerListings(user);
  renderRecentBids(user);
  renderPriceSummary(user);
}

function renderFarmerListings(user) {
  const container = document.getElementById("listings-container");
  const listings = getListings().filter((listing) => listing.farmerId === user.profileId);

  if (listings.length === 0) {
    container.innerHTML = '<p class="empty-state">You have no listings yet. Create one to start receiving bids.</p>';
    return;
  }

  container.innerHTML = "";
  listings.forEach((listing) => {
    const card = document.createElement("article");
    card.className = "card listing-card";
    card.innerHTML = `
      <div class="listing-card__title-row">
        <h4 class="listing-card__title">${escapeHtml(listing.produceName)}</h4>
        <span class="status-badge ${statusBadgeClass(listing.status)}">${escapeHtml(listing.status)}</span>
      </div>
      <p class="listing-card__meta">${listing.quantity} ${escapeHtml(listing.unit)} &middot; ${escapeHtml(listing.location)}</p>
      <p class="listing-card__meta">Preferred price: ${formatCurrency(listing.preferredPrice)} / ${escapeHtml(listing.unit)}</p>
      <a class="listing-card__link" href="listing-details.html?id=${encodeURIComponent(listing.id)}">View bids &rarr;</a>
    `;
    container.appendChild(card);
  });
}

function renderRecentBids(user) {
  const container = document.getElementById("recent-bids-container");
  const listings = getListings().filter((listing) => listing.farmerId === user.profileId);
  const listingIds = listings.map((listing) => listing.id);

  const bids = getBids()
    .filter((bid) => listingIds.includes(bid.listingId))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 5);

  if (bids.length === 0) {
    container.innerHTML = '<p class="empty-state">No bids have been submitted on your listings yet.</p>';
    return;
  }

  const buyerProfiles = getBuyerProfiles();

  container.innerHTML = "";
  bids.forEach((bid) => {
    const buyer = buyerProfiles.find((profile) => profile.id === bid.buyerId);
    const listing = listings.find((item) => item.id === bid.listingId);
    const row = document.createElement("div");
    row.className = "bid-summary-row";
    row.innerHTML = `
      <span class="bid-summary-row__buyer">${escapeHtml(buyer ? buyer.businessName : "Unknown buyer")}</span>
      <span class="bid-summary-row__meta">${escapeHtml(listing ? listing.produceName : "")} &middot; ${formatCurrency(bid.offeredPrice)} &middot; ${formatDateTime(bid.submittedAt)}</span>
    `;
    container.appendChild(row);
  });
}

function renderPriceSummary(user) {
  const container = document.getElementById("price-summary-container");
  const produceTypes = [
    ...new Set(
      getListings()
        .filter((listing) => listing.farmerId === user.profileId)
        .map((listing) => listing.produceName)
    ),
  ];

  const records = getMarketPriceRecords().filter((record) => produceTypes.includes(record.produceName));

  if (records.length === 0) {
    container.innerHTML = '<p class="empty-state">No sample market-price data is available for your listed produce yet.</p>';
    return;
  }

  container.innerHTML = "";
  records.forEach((record) => {
    const row = document.createElement("div");
    row.className = "price-summary-row";
    row.innerHTML = `
      <span class="price-summary-row__produce">${escapeHtml(record.produceName)} &middot; ${escapeHtml(record.location)}</span>
      <span class="price-summary-row__range">Low ${formatCurrency(record.lowPrice)} &middot; Avg ${formatCurrency(record.averagePrice)} &middot; High ${formatCurrency(record.highPrice)} / ${escapeHtml(record.unit)}</span>
    `;
    container.appendChild(row);
  });
}

// ---------- Create / Edit Produce Listing ----------

function validateListingForm(values) {
  const errors = {};

  const produceName = values.produceName.trim();
  if (!produceName) {
    errors.produceName = "Produce name is required.";
  } else if (produceName.length > 60) {
    errors.produceName = "Produce name must be 60 characters or fewer.";
  }

  if (!values.unit) {
    errors.unit = "Select a unit.";
  }

  const location = values.location.trim();
  if (!location) {
    errors.location = "Location is required.";
  } else if (location.length > 60) {
    errors.location = "Location must be 60 characters or fewer.";
  }

  const rawQuantity = values.quantity.trim();
  const quantity = Number(rawQuantity);
  if (!rawQuantity) {
    errors.quantity = "Quantity is required.";
  } else if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.quantity = "Quantity must be a positive number.";
  }

  const rawPrice = values.preferredPrice.trim();
  const preferredPrice = Number(rawPrice);
  if (!rawPrice) {
    errors.preferredPrice = "Preferred price is required.";
  } else if (!Number.isFinite(preferredPrice) || preferredPrice <= 0) {
    errors.preferredPrice = "Preferred price must be a positive number.";
  }

  if (!values.availabilityDate) {
    errors.availabilityDate = "Availability date is required.";
  } else {
    const today = new Date().toISOString().slice(0, 10);
    if (values.availabilityDate < today) {
      errors.availabilityDate = "Availability date cannot be in the past.";
    }
  }

  return errors;
}

function populateListingForm(listing) {
  document.getElementById("listing-produce-name").value = listing.produceName;
  document.getElementById("listing-quantity").value = listing.quantity;
  document.getElementById("listing-unit").value = listing.unit;
  document.getElementById("listing-location").value = listing.location;
  document.getElementById("listing-price").value = listing.preferredPrice;
  document.getElementById("listing-date").value = listing.availabilityDate;
}

function readListingFormValues() {
  return {
    produceName: document.getElementById("listing-produce-name").value,
    quantity: document.getElementById("listing-quantity").value,
    unit: document.getElementById("listing-unit").value,
    location: document.getElementById("listing-location").value,
    preferredPrice: document.getElementById("listing-price").value,
    availabilityDate: document.getElementById("listing-date").value,
  };
}

function handleListingFormSubmit(event, user, editingListing) {
  event.preventDefault();
  clearFormErrors("listing-form");

  const values = readListingFormValues();
  const errors = validateListingForm(values);
  const errorFields = Object.keys(errors);

  if (errorFields.length > 0) {
    errorFields.forEach((field) => showFieldError(LISTING_FIELD_IDS[field], errors[field]));
    document.getElementById(LISTING_FIELD_IDS[errorFields[0]]).focus();
    return;
  }

  const listings = getListings();
  const produceName = values.produceName.trim();
  const location = values.location.trim();
  const quantity = Number(values.quantity);
  const preferredPrice = Number(values.preferredPrice);

  if (editingListing) {
    const index = listings.findIndex((listing) => listing.id === editingListing.id);
    listings[index] = {
      ...listings[index],
      produceName,
      quantity,
      unit: values.unit,
      location,
      preferredPrice,
      availabilityDate: values.availabilityDate,
    };
    saveListings(listings);
    window.location.href = `listing-details.html?id=${encodeURIComponent(editingListing.id)}&saved=1`;
    return;
  }

  const newListing = {
    id: generateSequentialId("listing", listings),
    farmerId: user.profileId,
    produceName,
    quantity,
    unit: values.unit,
    location,
    preferredPrice,
    availabilityDate: values.availabilityDate,
    status: "Open",
    selectedBidId: null,
  };
  listings.push(newListing);
  saveListings(listings);
  window.location.href = "farmer-dashboard.html?created=1";
}

function initListingForm() {
  const user = requireRole("farmer");
  if (!user) return;

  const form = document.getElementById("listing-form");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const listingId = params.get("id");
  let editingListing = null;

  if (listingId) {
    const listing = getListings().find((item) => item.id === listingId);
    if (!listing || listing.farmerId !== user.profileId) {
      window.location.href = "farmer-dashboard.html";
      return;
    }
    editingListing = listing;

    document.getElementById("form-heading").textContent = "Edit Produce Listing";
    document.getElementById("form-subtitle").textContent = "Update the details below.";
    document.getElementById("listing-submit-btn").textContent = "Save Changes";
    populateListingForm(editingListing);
  }

  form.addEventListener("submit", (event) => handleListingFormSubmit(event, user, editingListing));
}

// ---------- Listing Detail — bids received ----------

function renderListingDetail(listing) {
  document.getElementById("listing-title").textContent = listing.produceName;
  document.getElementById("listing-subtitle").textContent =
    `${listing.quantity} ${listing.unit} available in ${listing.location}`;

  const badge = document.getElementById("listing-status-badge");
  badge.textContent = listing.status;
  badge.className = `status-badge ${statusBadgeClass(listing.status)}`;

  const editLink = document.getElementById("listing-edit-link");
  if (editLink) editLink.href = `listing-form.html?id=${encodeURIComponent(listing.id)}`;

  const grid = document.getElementById("listing-detail-grid");
  const items = [
    ["Produce", listing.produceName],
    ["Quantity", `${listing.quantity} ${listing.unit}`],
    ["Location", listing.location],
    ["Preferred price", `${formatCurrency(listing.preferredPrice)} / ${listing.unit}`],
    ["Availability date", formatDateOnly(listing.availabilityDate)],
    ["Status", listing.status],
  ];

  grid.innerHTML = "";
  items.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "detail-item";
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    item.append(dt, dd);
    grid.appendChild(item);
  });
}

function renderListingBids(listing) {
  const container = document.getElementById("bids-list-container");
  const bids = getBids()
    .filter((bid) => bid.listingId === listing.id)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  if (bids.length === 0) {
    container.innerHTML = '<p class="empty-state">No bids have been submitted for this listing yet.</p>';
    return;
  }

  const buyerProfiles = getBuyerProfiles();

  container.innerHTML = "";
  bids.forEach((bid) => {
    const buyer = buyerProfiles.find((profile) => profile.id === bid.buyerId);
    const card = document.createElement("article");
    card.className = "card bid-card";
    card.innerHTML = `
      <div class="bid-card__header">
        <h4 class="bid-card__buyer">${escapeHtml(buyer ? buyer.businessName : "Unknown buyer")}</h4>
        <span class="bid-card__price">${formatCurrency(bid.offeredPrice)} / ${escapeHtml(listing.unit)}</span>
      </div>
      <p class="bid-card__meta">Requested quantity: ${bid.requestedQuantity} ${escapeHtml(listing.unit)} &middot; Submitted ${formatDateTime(bid.submittedAt)} &middot; Status: ${escapeHtml(bid.status)}</p>
      ${bid.message ? `<p class="bid-card__message">&ldquo;${escapeHtml(bid.message)}&rdquo;</p>` : ""}
    `;
    container.appendChild(card);
  });
}

function initListingDetails() {
  const user = requireRole("farmer");
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const listingId = params.get("id");
  const listing = getListings().find((item) => item.id === listingId);

  if (!listing || listing.farmerId !== user.profileId) {
    window.location.href = "farmer-dashboard.html";
    return;
  }

  if (params.get("saved") === "1") {
    showNotification("Listing changes saved.");
  }

  renderListingDetail(listing);
  renderListingBids(listing);
}

// ---------- Page init ----------

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("listings-container")) {
    initFarmerDashboard();
  } else if (document.getElementById("listing-form")) {
    initListingForm();
  } else if (document.getElementById("bids-list-container")) {
    initListingDetails();
  }
});
