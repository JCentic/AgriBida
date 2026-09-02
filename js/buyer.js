// buyer.js
// Buyer-facing page logic: dashboard (browse/filter open listings), the buyer's bid
// relationship shown on listing-details.html, the bid form, and My Bids. Shared
// auth/storage/nav logic stays in script.js and storage.js; shared display helpers
// (escapeHtml, formatCurrency, formatDateTime, formatDateOnly, statusBadgeClass,
// renderListingDetail, renderListingImages) are defined as globals in farmer.js and
// reused here as-is.

// Maps bid form field names to their input element ids.
const BID_FIELD_IDS = {
  offeredPrice: "bid-price",
  requestedQuantity: "bid-quantity",
};

// ---------- Buyer Dashboard ----------

function initBuyerDashboard() {
  const user = requireRole("buyer");
  if (!user) return;

  renderBuyerProfileSummary(user);

  const produceSelect = document.getElementById("buyer-filter-produce");
  const locationInput = document.getElementById("buyer-filter-location");

  populateProduceFilterOptions(produceSelect);
  renderBuyerListings(produceSelect.value, locationInput.value);

  produceSelect.addEventListener("change", () => {
    renderBuyerListings(produceSelect.value, locationInput.value);
  });
  locationInput.addEventListener("input", () => {
    renderBuyerListings(produceSelect.value, locationInput.value);
  });
}

function renderBuyerProfileSummary(user) {
  const container = document.getElementById("buyer-profile-summary");
  const profile = getBuyerProfiles().find((item) => item.id === user.profileId);
  if (!profile) return;

  container.innerHTML = `
    <p class="profile-summary__name">${escapeHtml(profile.businessName)}</p>
    <p class="profile-summary__meta">${escapeHtml(profile.verificationStatus)}</p>
    <p class="profile-summary__meta profile-summary__rating">${profile.rating.toFixed(1)} &#9733; (${profile.reviewCount} review${profile.reviewCount === 1 ? "" : "s"})</p>
  `;
}

function getOpenListings() {
  return getListings().filter((listing) => listing.status === "Open");
}

function populateProduceFilterOptions(selectEl) {
  const produceNames = [...new Set(getOpenListings().map((listing) => listing.produceName))].sort();

  selectEl.innerHTML = '<option value="">All produce</option>';
  produceNames.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    selectEl.appendChild(option);
  });
}

function renderBuyerListings(produceFilter, locationFilter) {
  const container = document.getElementById("buyer-listings-container");
  const matchCount = document.getElementById("buyer-listings-match-count");
  const openListings = getOpenListings();

  const normalizedLocation = locationFilter.trim().toLowerCase();
  const filtered = openListings.filter((listing) => {
    const matchesProduce = !produceFilter || listing.produceName === produceFilter;
    const matchesLocation = !normalizedLocation || listing.location.toLowerCase().includes(normalizedLocation);
    return matchesProduce && matchesLocation;
  });

  if (openListings.length === 0) {
    matchCount.textContent = "";
    container.innerHTML = '<p class="empty-state">No open listings are available right now.</p>';
    return;
  }

  if (filtered.length === 0) {
    matchCount.textContent = "0 listings match your filters.";
    container.innerHTML = '<p class="empty-state">No open listings match your filters. Try a different produce type or location.</p>';
    return;
  }

  matchCount.textContent = `${filtered.length} listing${filtered.length === 1 ? "" : "s"} match your filters.`;

  const farmerProfiles = getFarmerProfiles();

  container.innerHTML = "";
  filtered.forEach((listing) => {
    const farmer = farmerProfiles.find((profile) => profile.id === listing.farmerId);
    const coverImage = listing.images && listing.images.length > 0
      ? `<img class="listing-card__thumb" src="${escapeHtml(listing.images[0])}" alt="${escapeHtml(listing.produceName)} photo" />`
      : "";
    const card = document.createElement("article");
    card.className = "card listing-card";
    card.innerHTML = `
      ${coverImage}
      <div class="listing-card__title-row">
        <h4 class="listing-card__title">${escapeHtml(listing.produceName)}</h4>
        <span class="status-badge ${statusBadgeClass(listing.status)}">${escapeHtml(listing.status)}</span>
      </div>
      <p class="listing-card__meta">${listing.quantity} ${escapeHtml(listing.unit)} &middot; ${escapeHtml(listing.location)}</p>
      <p class="listing-card__meta">Preferred price: ${formatCurrency(listing.preferredPrice)} / ${escapeHtml(listing.unit)}</p>
      <p class="listing-card__meta">Farmer: ${escapeHtml(farmer ? farmer.farmName : "Unknown farm")}</p>
      <a class="listing-card__link" href="listing-details.html?id=${encodeURIComponent(listing.id)}">View Details &rarr;</a>
    `;
    container.appendChild(card);
  });
}

// ---------- Buyer's own bid relationship on listing-details.html ----------

function findBuyerBid(user, listingId) {
  return getBids().find((bid) => bid.listingId === listingId && bid.buyerId === user.profileId);
}

function renderBuyerBidSection(user, listing) {
  const container = document.getElementById("buyer-bid-container");
  const bid = findBuyerBid(user, listing.id);
  const bidFormLink = `bid-form.html?listingId=${encodeURIComponent(listing.id)}`;

  if (listing.status === "Open") {
    if (!bid) {
      container.innerHTML = `
        <p class="status-note">You haven't placed a bid on this listing yet.</p>
        <a href="${bidFormLink}" class="btn btn--primary">Place a Bid</a>
      `;
      return;
    }

    container.innerHTML = `
      <article class="card bid-card">
        <div class="bid-card__header">
          <h4 class="bid-card__buyer">Your Offer</h4>
          <span class="bid-card__price">${formatCurrency(bid.offeredPrice)} / ${escapeHtml(listing.unit)}</span>
        </div>
        <p class="bid-card__meta">Requested quantity: ${bid.requestedQuantity} ${escapeHtml(listing.unit)} &middot; Submitted ${formatDateTime(bid.submittedAt)} &middot; Status: ${escapeHtml(bid.status)}</p>
        ${bid.message ? `<p class="bid-card__message">&ldquo;${escapeHtml(bid.message)}&rdquo;</p>` : ""}
      </article>
      <p class="detail-actions"><a href="${bidFormLink}" class="btn btn--secondary btn--small">Update Bid</a></p>
    `;
    return;
  }

  // Selected or Closed: read-only, no bid actions.
  if (!bid) {
    container.innerHTML = '<p class="status-note">This listing is no longer open. You did not place a bid on it.</p>';
    return;
  }

  const wasSelected = listing.selectedBidId === bid.id;
  const outcomeNote = wasSelected
    ? "Your bid was the one selected by the farmer."
    : "This listing is no longer open. Your bid was not selected.";

  container.innerHTML = `
    <article class="card bid-card">
      <div class="bid-card__header">
        <h4 class="bid-card__buyer">Your Offer</h4>
        <span class="bid-card__price">${formatCurrency(bid.offeredPrice)} / ${escapeHtml(listing.unit)}</span>
      </div>
      <p class="bid-card__meta">Requested quantity: ${bid.requestedQuantity} ${escapeHtml(listing.unit)} &middot; Submitted ${formatDateTime(bid.submittedAt)} &middot; Status: ${escapeHtml(bid.status)}</p>
      ${bid.message ? `<p class="bid-card__message">&ldquo;${escapeHtml(bid.message)}&rdquo;</p>` : ""}
    </article>
    <p class="status-note">${outcomeNote}</p>
  `;
}

// ---------- Submit or Update Bid ----------

function validateBidForm(values) {
  const errors = {};

  const rawPrice = values.offeredPrice.trim();
  const offeredPrice = Number(rawPrice);
  if (!rawPrice) {
    errors.offeredPrice = "Offered price is required.";
  } else if (!Number.isFinite(offeredPrice) || offeredPrice <= 0) {
    errors.offeredPrice = "Offered price must be a positive number.";
  }

  const rawQuantity = values.requestedQuantity.trim();
  const requestedQuantity = Number(rawQuantity);
  if (!rawQuantity) {
    errors.requestedQuantity = "Requested quantity is required.";
  } else if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
    errors.requestedQuantity = "Requested quantity must be a positive number.";
  }

  return errors;
}

function populateBidForm(bid) {
  document.getElementById("bid-price").value = bid.offeredPrice;
  document.getElementById("bid-quantity").value = bid.requestedQuantity;
  document.getElementById("bid-message").value = bid.message || "";
}

function readBidFormValues() {
  return {
    offeredPrice: document.getElementById("bid-price").value,
    requestedQuantity: document.getElementById("bid-quantity").value,
  };
}

function handleBidFormSubmit(event, user, listing, editingBid) {
  event.preventDefault();
  clearFormErrors("bid-form");

  const values = readBidFormValues();
  const errors = validateBidForm(values);
  const errorFields = Object.keys(errors);

  if (errorFields.length > 0) {
    errorFields.forEach((field) => showFieldError(BID_FIELD_IDS[field], errors[field]));
    document.getElementById(BID_FIELD_IDS[errorFields[0]]).focus();
    return;
  }

  const offeredPrice = Number(values.offeredPrice);
  const requestedQuantity = Number(values.requestedQuantity);
  const message = document.getElementById("bid-message").value.trim();
  const bids = getBids();

  if (editingBid) {
    const index = bids.findIndex((bid) => bid.id === editingBid.id);
    bids[index] = {
      ...bids[index],
      offeredPrice,
      requestedQuantity,
      message,
      submittedAt: new Date().toISOString(),
    };
    saveBids(bids);
  } else {
    bids.push({
      id: generateSequentialId("bid", bids),
      listingId: listing.id,
      buyerId: user.profileId,
      offeredPrice,
      requestedQuantity,
      message,
      submittedAt: new Date().toISOString(),
      status: "Pending",
    });
    saveBids(bids);
  }

  window.location.href = `listing-details.html?id=${encodeURIComponent(listing.id)}&bidSaved=1`;
}

function initBidForm() {
  const user = requireRole("buyer");
  if (!user) return;

  const form = document.getElementById("bid-form");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const listingId = params.get("listingId");
  const listing = getListings().find((item) => item.id === listingId);

  if (!listing) {
    window.location.href = "buyer-dashboard.html";
    return;
  }

  if (listing.status !== "Open") {
    window.location.href = `listing-details.html?id=${encodeURIComponent(listing.id)}&blocked=notopen`;
    return;
  }

  document.getElementById("bid-form-produce").textContent = listing.produceName;
  document.getElementById("bid-form-price").textContent = `${formatCurrency(listing.preferredPrice)} / ${listing.unit}`;

  const editingBid = findBuyerBid(user, listing.id);
  if (editingBid) {
    document.getElementById("form-heading").textContent = "Update Your Bid";
    document.getElementById("form-subtitle").textContent = "Update the offer you already placed on this listing.";
    document.getElementById("bid-submit-btn").textContent = "Save Changes";
    populateBidForm(editingBid);
  }

  form.addEventListener("submit", (event) => handleBidFormSubmit(event, user, listing, editingBid));
}

// ---------- My Bids ----------

function initMyBids() {
  const user = requireRole("buyer");
  if (!user) return;

  const container = document.getElementById("my-bids-container");
  const listings = getListings();
  const bids = getBids()
    .filter((bid) => bid.buyerId === user.profileId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  if (bids.length === 0) {
    container.innerHTML = `
      <p class="empty-state">You haven't submitted any bids yet.</p>
      <a href="buyer-dashboard.html" class="btn btn--secondary btn--small">Browse Listings</a>
    `;
    return;
  }

  container.innerHTML = "";
  bids.forEach((bid) => {
    const listing = listings.find((item) => item.id === bid.listingId);
    const produceName = listing ? listing.produceName : "Listing no longer available";
    const unit = listing ? listing.unit : "";

    const card = document.createElement("article");
    card.className = "card listing-card";

    const actionHtml = listing && listing.status === "Open"
      ? `<a class="listing-card__link" href="bid-form.html?listingId=${encodeURIComponent(listing.id)}">Update Bid &rarr;</a>`
      : `<p class="listing-card__meta">${listing && listing.selectedBidId === bid.id ? "Your bid was selected." : "This listing is no longer open."}</p>`;

    card.innerHTML = `
      <div class="listing-card__title-row">
        <h4 class="listing-card__title">${escapeHtml(produceName)}</h4>
        <span class="status-badge ${statusBadgeClass(bid.status)}">${escapeHtml(bid.status)}</span>
      </div>
      <p class="listing-card__meta">Offered: ${formatCurrency(bid.offeredPrice)} / ${escapeHtml(unit)} &middot; Requested: ${bid.requestedQuantity} ${escapeHtml(unit)}</p>
      <p class="listing-card__meta">Submitted ${formatDateTime(bid.submittedAt)}</p>
      ${listing ? `<a class="listing-card__link" href="listing-details.html?id=${encodeURIComponent(listing.id)}">View Listing &rarr;</a>` : ""}
      ${actionHtml}
    `;
    container.appendChild(card);
  });
}

// ---------- Page init ----------

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("buyer-listings-container")) {
    initBuyerDashboard();
  } else if (document.getElementById("bid-form")) {
    initBidForm();
  } else if (document.getElementById("my-bids-container")) {
    initMyBids();
  }
});
