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

// ---------- Listing photos (optional, up to MAX_LISTING_IMAGES) ----------
// Stored as base64 data URLs in local storage since there is no server to upload to;
// each photo is downscaled/compressed client-side first to stay well under the
// browser's local storage quota.

const MAX_LISTING_IMAGES = 3;
const MAX_IMAGE_DIMENSION = 800;
const IMAGE_JPEG_QUALITY = 0.72;

// The photos currently attached to the listing form, in memory until the form saves.
let listingImages = [];

// Reads an image file and returns a downscaled/compressed JPEG data URL.
function readAndResizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Could not read the file."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not read the photo."));
      image.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", IMAGE_JPEG_QUALITY));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

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

function renderImagePreviews() {
  const container = document.getElementById("listing-images-preview");
  const input = document.getElementById("listing-images-input");
  const label = document.querySelector('label[for="listing-images-input"]');
  const count = document.getElementById("listing-images-count");
  if (!container || !input) return;

  container.innerHTML = "";
  listingImages.forEach((src, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "image-preview";

    const img = document.createElement("img");
    img.src = src;
    img.alt = `Photo ${index + 1}`;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "image-preview__remove";
    removeBtn.setAttribute("aria-label", `Remove photo ${index + 1}`);
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      listingImages.splice(index, 1);
      renderImagePreviews();
    });

    wrapper.append(img, removeBtn);
    container.appendChild(wrapper);
  });

  const atMax = listingImages.length >= MAX_LISTING_IMAGES;
  input.disabled = atMax;
  if (label) label.classList.toggle("is-disabled", atMax);
  if (count) count.textContent = `${listingImages.length}/${MAX_LISTING_IMAGES} photos added`;
}

async function handleImagesSelected(event) {
  const files = Array.from(event.target.files || []);
  const errorEl = document.getElementById("listing-images-error");
  errorEl.textContent = "";
  if (files.length === 0) return;

  const remainingSlots = MAX_LISTING_IMAGES - listingImages.length;
  const filesToAdd = files.slice(0, remainingSlots);
  if (files.length > filesToAdd.length) {
    errorEl.textContent = `Only ${MAX_LISTING_IMAGES} photos are allowed; the rest were not added.`;
  }

  for (const file of filesToAdd) {
    if (!file.type.startsWith("image/")) {
      errorEl.textContent = "Only image files can be added.";
      continue;
    }
    try {
      const dataUrl = await readAndResizeImage(file);
      listingImages.push(dataUrl);
    } catch (error) {
      errorEl.textContent = "One of the selected photos could not be added.";
    }
  }

  event.target.value = "";
  renderImagePreviews();
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
      images: [...listingImages],
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
    images: [...listingImages],
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

  listingImages = [];

  if (listingId) {
    const listing = getListings().find((item) => item.id === listingId);
    if (!listing || listing.farmerId !== user.profileId) {
      window.location.href = "farmer-dashboard.html";
      return;
    }
    editingListing = listing;
    listingImages = [...(listing.images || [])];

    document.getElementById("form-heading").textContent = "Edit Produce Listing";
    document.getElementById("form-subtitle").textContent = "Update the details below.";
    document.getElementById("listing-submit-btn").textContent = "Save Changes";
    populateListingForm(editingListing);
  }

  document.getElementById("listing-images-input").addEventListener("change", handleImagesSelected);
  renderImagePreviews();

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

// Builds a swipeable/scroll-snap carousel (track + prev/next buttons + dots) for a
// listing that has a full set of photos — a static grid gets cramped at 3 across,
// especially on mobile, so a full set is worth browsing one at a time instead.
function buildImageCarousel(listing, images) {
  const carousel = document.createElement("div");
  carousel.className = "image-carousel";

  const track = document.createElement("div");
  track.className = "image-carousel__track";
  track.setAttribute("tabindex", "0");
  track.setAttribute("role", "group");
  track.setAttribute("aria-roledescription", "carousel");
  track.setAttribute("aria-label", `${listing.produceName} photos, ${images.length} total`);

  images.forEach((src, index) => {
    const slide = document.createElement("div");
    slide.className = "image-carousel__slide";
    const img = document.createElement("img");
    img.src = src;
    img.alt = `${listing.produceName} photo ${index + 1} of ${images.length}`;
    slide.appendChild(img);
    track.appendChild(slide);
  });

  const dots = document.createElement("div");
  dots.className = "image-carousel__dots";
  const dotButtons = images.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "image-carousel__dot";
    if (index === 0) dot.classList.add("is-active");
    dot.setAttribute("aria-label", `Go to photo ${index + 1}`);
    dot.addEventListener("click", () => goToSlide(index));
    dots.appendChild(dot);
    return dot;
  });

  function goToSlide(index) {
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    track.scrollTo({ left: track.clientWidth * clamped, behavior: "smooth" });
  }

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "image-carousel__nav image-carousel__nav--prev";
  prevBtn.setAttribute("aria-label", "Previous photo");
  prevBtn.textContent = "‹";
  prevBtn.addEventListener("click", () => {
    goToSlide(Math.round(track.scrollLeft / track.clientWidth) - 1);
  });

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "image-carousel__nav image-carousel__nav--next";
  nextBtn.setAttribute("aria-label", "Next photo");
  nextBtn.textContent = "›";
  nextBtn.addEventListener("click", () => {
    goToSlide(Math.round(track.scrollLeft / track.clientWidth) + 1);
  });

  track.addEventListener("scroll", () => {
    const current = Math.round(track.scrollLeft / track.clientWidth);
    dotButtons.forEach((dot, index) => dot.classList.toggle("is-active", index === current));
  });

  carousel.append(track, prevBtn, nextBtn, dots);
  return carousel;
}

function renderListingImages(listing) {
  const container = document.getElementById("listing-images-gallery");
  if (!container) return;

  const images = listing.images || [];
  if (images.length === 0) {
    container.className = "";
    container.innerHTML = '<p class="empty-state">No photos added for this listing yet.</p>';
    return;
  }

  if (images.length >= MAX_LISTING_IMAGES) {
    container.className = "";
    container.innerHTML = "";
    container.appendChild(buildImageCarousel(listing, images));
    return;
  }

  container.className = "image-gallery";
  container.innerHTML = "";
  images.forEach((src, index) => {
    const img = document.createElement("img");
    img.className = "image-gallery__img";
    img.src = src;
    img.alt = `${listing.produceName} photo ${index + 1}`;
    container.appendChild(img);
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
  renderListingImages(listing);
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
