// admin.js
// Administrator-facing page logic: dashboard summary and buyer verification &
// reputation management. Shared auth/storage/nav logic stays in script.js and
// storage.js; shared formatting and the verification-badge modifier shared with
// farmer.js live in ui.js / farmer.js and are reused here as-is.

// ---------- Administrator Dashboard ----------

function initAdminDashboard() {
  const user = requireRole("administrator");
  if (!user) return;

  renderAdminStats();
}

function renderAdminStats() {
  const container = document.getElementById("admin-stats-container");
  const buyerProfiles = getBuyerProfiles();
  const pendingCount = buyerProfiles.filter(
    (profile) => profile.verificationStatus === "Pending Verification"
  ).length;

  const stats = [
    { value: buyerProfiles.length, label: "Total Sample Buyers", highlight: false },
    { value: pendingCount, label: "Pending Verification", highlight: true },
    { value: getListings().length, label: "Total Sample Produce Listings", highlight: false },
  ];

  container.innerHTML = "";
  stats.forEach((stat) => {
    const card = document.createElement("article");
    card.className = `card stat-card${stat.highlight ? " stat-card--highlight" : ""}`;
    card.innerHTML = `
      <span class="stat-card__value">${stat.value}</span>
      <p class="stat-card__label">${escapeHtml(stat.label)}</p>
    `;
    container.appendChild(card);
  });
}

// ---------- Buyer Verification & Reputation Management ----------
// Rating, review count, and buyer feedback are sample reputation data the
// administrator reviews but does not edit here — they are display-only. The only
// administrator actions on this page are: change verification status (via the
// status menu) and write a short note explaining that decision.

// Element id helpers, namespaced by buyer profile id.
function adminBuyerFieldIds(profileId) {
  return {
    menuBtn: `admin-buyer-menu-btn-${profileId}`,
    menu: `admin-buyer-menu-${profileId}`,
    note: `admin-buyer-note-${profileId}`,
  };
}

// Closes any open status menu other than the one being opened (or all, if none).
function closeOpenAdminBuyerMenus(exceptProfileId) {
  document.querySelectorAll(".status-menu.is-open").forEach((menu) => {
    if (exceptProfileId && menu.id === adminBuyerFieldIds(exceptProfileId).menu) return;
    menu.classList.remove("is-open");
    const btn = document.getElementById(menu.dataset.menuBtnId);
    if (btn) btn.setAttribute("aria-expanded", "false");
  });
}

// Clicking anywhere outside an open status menu closes it.
document.addEventListener("click", (event) => {
  if (event.target.closest(".status-menu-wrap")) return;
  closeOpenAdminBuyerMenus();
});

function initAdminBuyers() {
  const user = requireRole("administrator");
  if (!user) return;

  renderAdminBuyers();
}

// Sorts Pending Verification buyers first, since that's the actionable queue.
function sortedBuyerProfiles() {
  return [...getBuyerProfiles()].sort((a, b) => {
    const aPending = a.verificationStatus === "Pending Verification" ? 0 : 1;
    const bPending = b.verificationStatus === "Pending Verification" ? 0 : 1;
    return aPending - bPending;
  });
}

function renderAdminBuyers() {
  const container = document.getElementById("admin-buyers-container");
  const buyerProfiles = sortedBuyerProfiles();

  if (buyerProfiles.length === 0) {
    container.innerHTML = '<p class="empty-state">There are no sample buyer profiles yet.</p>';
    return;
  }

  container.innerHTML = "";
  buyerProfiles.forEach((profile) => {
    container.appendChild(buildAdminBuyerCard(profile));
  });
}

function buildAdminBuyerCard(profile) {
  const ids = adminBuyerFieldIds(profile.id);

  const card = document.createElement("article");
  card.className = "card admin-buyer-card";
  card.innerHTML = `
    <div class="admin-buyer-card__header">
      <h4 class="admin-buyer-card__name">${escapeHtml(profile.businessName)}</h4>
      <div class="admin-buyer-card__header-actions">
        <span class="verification-badge ${verificationBadgeModifier(profile.verificationStatus)}">${escapeHtml(profile.verificationStatus)}</span>
        <div class="status-menu-wrap">
          <button
            type="button"
            id="${ids.menuBtn}"
            class="status-menu-btn"
            aria-haspopup="menu"
            aria-expanded="false"
            aria-label="Change verification status for ${escapeHtml(profile.businessName)}"
          >&#8942;</button>
          <div id="${ids.menu}" class="status-menu" role="menu" data-menu-btn-id="${ids.menuBtn}">
            <button type="button" class="status-menu__item" role="menuitemradio" data-status="Verified Buyer" aria-checked="${profile.verificationStatus === "Verified Buyer"}">Verified Buyer</button>
            <button type="button" class="status-menu__item" role="menuitemradio" data-status="Pending Verification" aria-checked="${profile.verificationStatus === "Pending Verification"}">Pending Verification</button>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-buyer-card__document">
      ${buildAdminVerificationDocumentHTML(profile)}
    </div>

    <dl class="admin-buyer-card__reputation">
      <div class="admin-buyer-card__reputation-row">
        <dt>Rating</dt>
        <dd>${profile.rating.toFixed(1)} &#9733; (${profile.reviewCount} review${profile.reviewCount === 1 ? "" : "s"})</dd>
      </div>
    </dl>
    ${buildAdminFeedbackHTML(profile)}

    <div class="field admin-buyer-card__note">
      <label for="${ids.note}">Verification note (your reason for this decision)</label>
      <textarea id="${ids.note}" rows="3"></textarea>
      <div class="form-actions">
        <button type="button" class="btn btn--secondary btn--small" id="${ids.note}-save">Save Note</button>
      </div>
    </div>
  `;

  card.querySelector(`#${CSS.escape(ids.note)}`).value = profile.verificationNote || "";

  card.querySelectorAll(".status-menu__item").forEach((item) => {
    item.addEventListener("click", () => handleStatusMenuSelect(profile.id, item.dataset.status));
  });
  card.querySelector(`#${CSS.escape(ids.menuBtn)}`).addEventListener("click", (event) => {
    event.stopPropagation();
    toggleAdminBuyerMenu(profile.id);
  });
  card.querySelector(`#${CSS.escape(ids.note)}-save`).addEventListener("click", () => handleAdminNoteSave(profile.id));

  return card;
}

// Read-only view of the buyer's submitted mock verification document and their
// stated reason for requesting verification — administrator review context, no
// remove control.
function buildAdminVerificationDocumentHTML(profile) {
  if (!profile.verificationDocument) {
    return '<p class="status-note">No verification document submitted.</p>';
  }

  return `
    <div class="image-preview verification-document-preview">
      <img src="${escapeHtml(profile.verificationDocument)}" alt="${escapeHtml(profile.businessName)}'s submitted verification document" />
    </div>
    <p class="profile-summary__meta">Submitted ${formatDateTime(profile.verificationSubmittedAt)}</p>
    ${profile.verificationRequestReason ? `<p class="profile-summary__meta">&ldquo;${escapeHtml(profile.verificationRequestReason)}&rdquo;</p>` : ""}
  `;
}

// Read-only list of sample farmer feedback backing the buyer's rating — display only.
function buildAdminFeedbackHTML(profile) {
  const items = (profile.feedback || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  if (!items) return "";
  return `<ul class="admin-buyer-card__feedback-list">${items}</ul>`;
}

function toggleAdminBuyerMenu(profileId) {
  const ids = adminBuyerFieldIds(profileId);
  const menu = document.getElementById(ids.menu);
  const btn = document.getElementById(ids.menuBtn);
  const willOpen = !menu.classList.contains("is-open");
  closeOpenAdminBuyerMenus();
  menu.classList.toggle("is-open", willOpen);
  btn.setAttribute("aria-expanded", String(willOpen));
}

function handleStatusMenuSelect(profileId, newStatus) {
  closeOpenAdminBuyerMenus();

  const buyerProfiles = getBuyerProfiles();
  const index = buyerProfiles.findIndex((profile) => profile.id === profileId);
  if (index === -1) return;

  if (buyerProfiles[index].verificationStatus === newStatus) return;

  buyerProfiles[index] = { ...buyerProfiles[index], verificationStatus: newStatus };
  saveBuyerProfiles(buyerProfiles);

  renderAdminBuyers();
  showNotification(`${buyerProfiles[index].businessName} is now ${newStatus}.`);
}

function handleAdminNoteSave(profileId) {
  const ids = adminBuyerFieldIds(profileId);
  const note = document.getElementById(ids.note).value.trim();

  const buyerProfiles = getBuyerProfiles();
  const index = buyerProfiles.findIndex((profile) => profile.id === profileId);
  if (index === -1) return;

  buyerProfiles[index] = { ...buyerProfiles[index], verificationNote: note || null };
  saveBuyerProfiles(buyerProfiles);

  renderAdminBuyers();
  showNotification(`Saved verification note for ${buyerProfiles[index].businessName}.`);
}

// ---------- Page init ----------

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("admin-stats-container")) {
    initAdminDashboard();
  } else if (document.getElementById("admin-buyers-container")) {
    initAdminBuyers();
  }
});
