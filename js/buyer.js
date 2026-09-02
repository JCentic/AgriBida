// buyer.js
// Buyer-facing page logic: dashboard (browse/filter open listings), the buyer's bid
// relationship shown on listing-details.html, the bid form, and My Bids. Shared
// auth/storage/nav logic stays in script.js and storage.js; shared formatting and
// listing/bid-card/photo markup shared with farmer.js lives in ui.js and is reused
// here as-is.

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

// The verification document currently staged in the uploader, in memory until submit.
let verificationDocument = null;

function renderBuyerProfileSummary(user) {
  const container = document.getElementById("buyer-profile-summary");
  const profile = getBuyerProfiles().find((item) => item.id === user.profileId);
  if (!profile) return;

  container.innerHTML = `
    <p class="profile-summary__name">${escapeHtml(profile.businessName)}</p>
    <p class="profile-summary__meta">${escapeHtml(profile.verificationStatus)}</p>
    <p class="profile-summary__meta profile-summary__rating">${profile.rating.toFixed(1)} &#9733; (${profile.reviewCount} review${profile.reviewCount === 1 ? "" : "s"})</p>
    <div id="verification-request-section"></div>
  `;

  renderVerificationRequestSection(user, profile);
}

// Shows either: a "verified" confirmation line, or the request/update-verification
// uploader (with the buyer's currently-submitted document, if any).
function renderVerificationRequestSection(user, profile) {
  const section = document.getElementById("verification-request-section");
  if (!section) return;

  if (profile.verificationStatus === "Verified Buyer") {
    section.innerHTML = '<p class="status-note">You\'re a verified buyer.</p>';
    return;
  }

  verificationDocument = null;

  const submittedHTML = profile.verificationDocument
    ? `
      <div class="image-preview verification-document-preview">
        <img src="${escapeHtml(profile.verificationDocument)}" alt="Your submitted verification document" />
      </div>
      <p class="profile-summary__meta">Submitted ${formatDateTime(profile.verificationSubmittedAt)}</p>
      <p class="profile-summary__meta">&ldquo;${escapeHtml(profile.verificationRequestReason)}&rdquo;</p>
    `
    : "";

  section.innerHTML = `
    <div class="verification-request">
      <p class="field-hint">${profile.verificationDocument ? "Replace your submitted document and reason, or leave them as-is." : "Upload an image (e.g. a business permit or ID photo) and tell us why you'd like to be verified."}</p>
      ${submittedHTML}
      <div class="field">
        <label for="verification-document-input">${profile.verificationDocument ? "Replace document" : "Verification document"}</label>
        <input type="file" id="verification-document-input" accept="image/*" aria-describedby="verification-document-error" />
        <p class="field-error" id="verification-document-error" role="alert"></p>
      </div>
      <div class="field">
        <label for="verification-reason-input">${profile.verificationDocument ? "Replace reason" : "Reason for requesting verification"}</label>
        <textarea id="verification-reason-input" rows="3" aria-describedby="verification-reason-error"></textarea>
        <p class="field-error" id="verification-reason-error" role="alert"></p>
      </div>
      <button type="button" class="btn btn--primary btn--small" id="verification-submit-btn">
        ${profile.verificationDocument ? "Resubmit for Verification" : "Submit for Verification"}
      </button>
    </div>
  `;

  document.getElementById("verification-document-input").addEventListener("change", handleVerificationDocumentSelected);
  document.getElementById("verification-submit-btn").addEventListener("click", () => handleVerificationSubmit(user));
}

async function handleVerificationDocumentSelected(event) {
  const file = event.target.files && event.target.files[0];
  const errorEl = document.getElementById("verification-document-error");
  errorEl.textContent = "";
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    errorEl.textContent = "Only image files can be added.";
    event.target.value = "";
    return;
  }

  try {
    verificationDocument = await readAndResizeImage(file);
  } catch (error) {
    errorEl.textContent = "The selected file could not be added.";
  }
}

function handleVerificationSubmit(user) {
  const documentErrorEl = document.getElementById("verification-document-error");
  const reasonErrorEl = document.getElementById("verification-reason-error");
  documentErrorEl.textContent = "";
  reasonErrorEl.textContent = "";

  const reason = document.getElementById("verification-reason-input").value.trim();
  let hasError = false;

  if (!verificationDocument) {
    documentErrorEl.textContent = "Select an image to submit for verification.";
    hasError = true;
  }
  if (!reason) {
    reasonErrorEl.textContent = "Tell us why you'd like to be verified.";
    hasError = true;
  }
  if (hasError) return;

  const buyerProfiles = getBuyerProfiles();
  const index = buyerProfiles.findIndex((profile) => profile.id === user.profileId);
  if (index === -1) return;

  buyerProfiles[index] = {
    ...buyerProfiles[index],
    verificationDocument,
    verificationSubmittedAt: new Date().toISOString(),
    verificationRequestReason: reason,
  };
  saveBuyerProfiles(buyerProfiles);

  renderBuyerProfileSummary(user);
  showNotification("Your verification request has been submitted.");
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
    container.appendChild(
      buildListingCard(listing, {
        extraMetaHTML: `<p class="listing-card__meta">Farmer: ${escapeHtml(farmer ? farmer.farmName : "Unknown farm")}</p>`,
        linkHref: `listing-details.html?id=${encodeURIComponent(listing.id)}`,
        linkText: "View Details",
      })
    );
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
      <article class="card bid-card">${buildBidCardHTML("Your Offer", bid, listing.unit)}</article>
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
    <article class="card bid-card">${buildBidCardHTML("Your Offer", bid, listing.unit)}</article>
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
