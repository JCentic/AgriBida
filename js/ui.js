// ui.js
// Shared display helpers used by both farmer.js and buyer.js: text formatting,
// status styling, and the listing-card / bid-card / photo-gallery markup that
// both roles render. Centralized here so it has one owner instead of living in
// whichever role's file happened to need it first. Depends on nothing else;
// load it before farmer.js and buyer.js on any page that uses them.

// Photo cap shared by the upload form (farmer.js) and the gallery/carousel
// threshold below.
const MAX_LISTING_IMAGES = 3;

// ---------- Formatting ----------

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

// ---------- Listing card (dashboard/browse grids) ----------

// Builds the "article.card.listing-card" summary used on both the farmer
// dashboard and the buyer dashboard/browse grid. `extraMetaHTML` lets a caller
// insert an extra meta line (e.g. the buyer view's "Farmer: ..." line) without
// forking the whole template; `linkHref`/`linkText` set the trailing action link.
function buildListingCard(listing, { extraMetaHTML = "", linkHref, linkText }) {
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
    ${extraMetaHTML}
    <a class="listing-card__link" href="${linkHref}">${linkText} &rarr;</a>
  `;
  return card;
}

// ---------- Bid card (bids-received list, and a buyer's own bid) ----------

// Builds the inner markup of an "article.card.bid-card": header (title + price),
// a meta line, and an optional quoted message. Shared by the farmer's "bids
// received" list and the buyer's own bid summary, since both show the same bid
// fields and differ only in the title and in what surrounds the card.
function buildBidCardHTML(title, bid, unit) {
  return `
    <div class="bid-card__header">
      <h4 class="bid-card__buyer">${escapeHtml(title)}</h4>
      <span class="bid-card__price">${formatCurrency(bid.offeredPrice)} / ${escapeHtml(unit)}</span>
    </div>
    <p class="bid-card__meta">Requested quantity: ${bid.requestedQuantity} ${escapeHtml(unit)} &middot; Submitted ${formatDateTime(bid.submittedAt)} &middot; Status: ${escapeHtml(bid.status)}</p>
    ${bid.message ? `<p class="bid-card__message">&ldquo;${escapeHtml(bid.message)}&rdquo;</p>` : ""}
  `;
}

// ---------- Listing detail header + photos (shared by farmer and buyer views) ----------

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
