// profile.js
// Logic for the shared profile.html page, reachable from the avatar dropdown
// (renderSiteNav() in script.js) for every role. The Account card shows the signed-in
// user's labeled account details (editable inline, moved here from the now-placeholder
// settings.html) plus, for a buyer, their business name, verification badge, and the
// verification request flow — all under "Account", since verifying a buyer's account
// isn't a separate concern from the account itself. A second role-specific card only
// exists for a farmer's Farm Details; administrators have no extra profile fields.

// ---------- Profile page ----------

// The signed-in user backing the Account card's inline-edit form. Kept module-level
// (rather than re-read from storage on every toggle) so the edit toggle button, bound
// once at init, always edits the current values without needing to re-query the DOM
// for a user id.
let profileAccountUser = null;

function initProfilePage() {
  const user = requireAnyRole(["farmer", "buyer", "administrator"]);
  if (!user) return;

  renderProfileAccountCard(user);
  document.getElementById("profile-account-edit-btn").addEventListener("click", toggleProfileAccountEdit);
  initVerificationModal();

  renderProfileRoleCard(user);
}

// Renders the Account card's read-only display (labeled details, plus a buyer's
// business/verification content) and its (closed) inline-edit form. Called at page
// load and again after a successful save or verification submit, so the read-only
// values and the form's starting values both reflect the latest saved data.
function renderProfileAccountCard(user) {
  const container = document.getElementById("profile-account-card");
  if (!container) return;

  profileAccountUser = user;

  const buyerProfile = user.role === "buyer"
    ? getBuyerProfiles().find((item) => item.id === user.profileId)
    : null;

  const detailItems = [
    ["Name", user.name],
    ["Role", ROLE_LABELS[user.role]],
    ["Email", user.email],
    ["Location", user.location],
  ];
  if (buyerProfile) detailItems.push(["Business Name", buyerProfile.businessName]);

  const detailsHTML = detailItems
    .map(([label, value]) => `<div class="detail-item"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");

  const verificationHTML = buyerProfile
    ? `
      <div class="account-verification">
        <span class="verification-badge ${verificationBadgeModifier(buyerProfile)}">${escapeHtml(verificationStatusLabel(buyerProfile))}</span>
        <p class="profile-summary__meta profile-summary__rating">${buyerProfile.rating.toFixed(1)} &#9733; (${buyerProfile.reviewCount} review${buyerProfile.reviewCount === 1 ? "" : "s"})</p>
        <div id="verification-request-section"></div>
      </div>
    `
    : "";

  container.innerHTML = `
    <div id="profile-account-readonly">
      <dl class="detail-grid">${detailsHTML}</dl>
      ${verificationHTML}
    </div>
    <form id="profile-account-form" class="inline-expand auth-form" novalidate>
      <div class="field">
        <label for="profile-account-name">Name</label>
        <input type="text" id="profile-account-name" name="name" aria-describedby="profile-account-name-error" />
        <p class="field-error" id="profile-account-name-error" role="alert"></p>
      </div>
      <div class="field">
        <label for="profile-account-location">Location</label>
        <input type="text" id="profile-account-location" name="location" aria-describedby="profile-account-location-error" />
        <p class="field-error" id="profile-account-location-error" role="alert"></p>
      </div>
      <div class="field">
        <label for="profile-account-email">Email</label>
        <input type="email" id="profile-account-email" name="email" disabled />
        <p class="field-hint">Your sign-in email can't be changed here.</p>
      </div>
      <p class="form-error" id="profile-account-form-error" role="alert"></p>
      <div class="form-actions">
        <button type="button" class="btn btn--secondary btn--block" id="profile-account-cancel-btn">Cancel</button>
        <button type="submit" class="btn btn--primary btn--block" id="profile-account-save-btn">Save Changes</button>
      </div>
    </form>
  `;

  document.getElementById("profile-account-form").addEventListener("submit", handleProfileAccountSubmit);
  document.getElementById("profile-account-cancel-btn").addEventListener("click", closeProfileAccountEdit);

  if (buyerProfile) {
    renderVerificationRequestSection(user, buyerProfile);
  }
}

function toggleProfileAccountEdit() {
  const form = document.getElementById("profile-account-form");
  if (form.classList.contains("is-open")) {
    closeProfileAccountEdit();
  } else {
    openProfileAccountEdit();
  }
}

function openProfileAccountEdit() {
  document.getElementById("profile-account-name").value = profileAccountUser.name;
  document.getElementById("profile-account-location").value = profileAccountUser.location;
  document.getElementById("profile-account-email").value = profileAccountUser.email;
  document.getElementById("profile-account-readonly").hidden = true;
  document.getElementById("profile-account-form").classList.add("is-open");
  document.getElementById("profile-account-edit-btn").setAttribute("aria-expanded", "true");
}

// Discards any in-progress edits (the form is repopulated from profileAccountUser
// every time it's opened) and returns to the read-only display.
function closeProfileAccountEdit() {
  clearFormErrors("profile-account-form");
  document.getElementById("profile-account-readonly").hidden = false;
  document.getElementById("profile-account-form").classList.remove("is-open");
  document.getElementById("profile-account-edit-btn").setAttribute("aria-expanded", "false");
}

function handleProfileAccountSubmit(event) {
  event.preventDefault();
  clearFormErrors("profile-account-form");

  const name = document.getElementById("profile-account-name").value.trim();
  const location = document.getElementById("profile-account-location").value.trim();

  let hasError = false;
  if (!name) {
    showFieldError("profile-account-name", "Name is required.");
    hasError = true;
  }
  if (!location) {
    showFieldError("profile-account-location", "Location is required.");
    hasError = true;
  }
  if (hasError) return;

  const users = getUsers();
  const index = users.findIndex((item) => item.id === profileAccountUser.id);
  if (index === -1) return;

  const updatedUser = { ...users[index], name, location };
  users[index] = updatedUser;
  saveUsers(users);
  setCurrentUser(updatedUser);

  renderSiteNav();
  renderProfileAccountCard(updatedUser);
  showNotification("Your settings have been saved.");
}

function renderProfileRoleCard(user) {
  const section = document.getElementById("profile-role-section");
  const heading = document.getElementById("role-heading");
  const container = document.getElementById("profile-role-card");
  if (!section || !heading || !container) return;

  if (user.role === "farmer") {
    const profile = getFarmerProfiles().find((item) => item.id === user.profileId);
    if (!profile) return;
    section.hidden = false;
    heading.textContent = "Farm Details";
    container.innerHTML = `
      <p class="profile-summary__name">${escapeHtml(profile.farmName)}</p>
      <p class="profile-summary__meta">${(profile.produceTypes || []).map(escapeHtml).join(", ")}</p>
    `;
    return;
  }

  // A buyer's business name and verification content live in the Account card
  // (renderProfileAccountCard()); administrators have no additional profile fields.
  section.hidden = true;
}

// ---------- Buyer verification request ----------

// The verification document currently staged in the modal's uploader, in memory
// until submit.
let verificationDocument = null;

// Shows either: a "verified" confirmation line, or a "Verify Account" / "Update
// Verification Document" button that opens the verification modal (with the buyer's
// currently-submitted document, if any, visible above the button even before the
// modal is opened).
function renderVerificationRequestSection(user, profile) {
  const section = document.getElementById("verification-request-section");
  if (!section) return;

  if (profile.verificationStatus === "Verified Buyer") {
    section.innerHTML = '<p class="status-note">You\'re a verified buyer.</p>';
    return;
  }

  const hasSubmitted = Boolean(profile.verificationDocument);

  section.innerHTML = `
    <div class="verification-request">
      ${hasSubmitted ? `<p class="profile-summary__meta">Submitted ${formatDateTime(profile.verificationSubmittedAt)}</p>` : ""}
      <button type="button" class="btn btn--secondary btn--small" id="verification-toggle-btn" aria-haspopup="dialog">
        ${hasSubmitted ? "Update Verification Document" : "Verify Account"}
      </button>
    </div>
  `;

  document.getElementById("verification-toggle-btn").addEventListener("click", () => openVerificationModal(user, profile));
}

// Wires the verification <dialog>'s close affordances once — the markup is static in
// profile.html, so this only needs to run once at page init. Native <dialog> already
// handles Escape-to-close and focus trapping; this only needs to cover the close
// button and clicking the backdrop (a click lands on the dialog element itself, vs.
// a descendant, when it hits the backdrop).
//
// Focus should return to the trigger button after ANY dismissal path, including the
// browser's native Escape handling (which runs none of our code). "close" is the
// standard event for this, but it's spotty across current <dialog> implementations —
// some fire the newer "toggle" event instead — so this listens for both and just
// checks whether the dialog actually ended up closed, rather than trusting either
// event to fire on its own.
function initVerificationModal() {
  const dialog = document.getElementById("verification-modal");
  const closeBtn = document.getElementById("verification-modal-close-btn");
  if (!dialog || !closeBtn) return;

  closeBtn.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  const restoreFocusIfClosed = () => {
    if (!dialog.hasAttribute("open")) {
      document.getElementById("verification-toggle-btn")?.focus();
    }
  };
  dialog.addEventListener("close", restoreFocusIfClosed);
  dialog.addEventListener("toggle", restoreFocusIfClosed);
}

function openVerificationModal(user, profile) {
  verificationDocument = null;
  const hasSubmitted = Boolean(profile.verificationDocument);

  document.getElementById("verification-modal-heading").textContent =
    hasSubmitted ? "Update Verification Document" : "Verify Account";

  document.getElementById("verification-modal-body").innerHTML = `
    <p class="field-hint">${hasSubmitted ? "Replace your submitted document, or leave it as-is." : "Upload an image (e.g. a business permit or ID photo) to request verification."}</p>
    <div id="verification-preview-area"></div>
    <div class="field">
      <label for="verification-document-input">${hasSubmitted ? "Replace document" : "Verification document"}</label>
      <input type="file" id="verification-document-input" accept="image/*" aria-describedby="verification-document-error" />
      <p class="field-error" id="verification-document-error" role="alert"></p>
    </div>
    <button type="button" class="btn btn--primary btn--block" id="verification-submit-btn">
      ${hasSubmitted ? "Resubmit for Verification" : "Submit for Verification"}
    </button>
  `;

  renderVerificationPreviewArea(profile);

  document.getElementById("verification-document-input").addEventListener("change", (event) => handleVerificationDocumentSelected(event, profile));
  document.getElementById("verification-submit-btn").addEventListener("click", () => handleVerificationSubmit(user));

  // showModal() focuses the dialog's first focusable descendant (the close button)
  // and traps Tab/Shift+Tab inside the dialog natively — no manual focus call needed.
  document.getElementById("verification-modal").showModal();
}

// Shows the staged (unsaved) or already-submitted document as an image preview, or
// the ID-document placeholder graphic when neither exists yet.
function renderVerificationPreviewArea(profile) {
  const area = document.getElementById("verification-preview-area");
  if (!area) return;

  const dataUrl = verificationDocument || profile.verificationDocument;
  area.innerHTML = dataUrl
    ? `
      <div class="image-preview verification-document-preview">
        <img src="${escapeHtml(dataUrl)}" alt="Your verification document" />
      </div>
    `
    : idPlaceholderSVG();
}

// Flat, minimal ID-card illustration shown in the uploader's true empty state
// (no submitted document, no file staged yet). Decorative only, per the app's
// existing green/neutral palette.
function idPlaceholderSVG() {
  return `
    <svg class="id-placeholder" viewBox="0 0 200 130" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="192" height="122" rx="14" fill="#f5f5f7" stroke="#2e7d32" stroke-width="2" />
      <circle cx="48" cy="52" r="18" fill="#2e7d32" />
      <path d="M22 96c0-15 11.5-24 26-24s26 9 26 24" fill="#2e7d32" />
      <rect x="92" y="40" width="88" height="10" rx="5" fill="#d2d2d7" />
      <rect x="92" y="62" width="66" height="10" rx="5" fill="#d2d2d7" />
    </svg>
  `;
}

async function handleVerificationDocumentSelected(event, profile) {
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
    renderVerificationPreviewArea(profile);
  } catch (error) {
    errorEl.textContent = "The selected file could not be added.";
  }
}

function handleVerificationSubmit(user) {
  const documentErrorEl = document.getElementById("verification-document-error");
  documentErrorEl.textContent = "";

  if (!verificationDocument) {
    documentErrorEl.textContent = "Select an image to submit for verification.";
    return;
  }

  const buyerProfiles = getBuyerProfiles();
  const index = buyerProfiles.findIndex((profile) => profile.id === user.profileId);
  if (index === -1) return;

  buyerProfiles[index] = {
    ...buyerProfiles[index],
    verificationDocument,
    verificationSubmittedAt: new Date().toISOString(),
  };
  saveBuyerProfiles(buyerProfiles);

  renderProfileAccountCard(user);
  document.getElementById("verification-modal").close();
  showNotification("Your verification request has been submitted.");
}

// ---------- Page init ----------

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("profile-account-card")) {
    initProfilePage();
  }
});
