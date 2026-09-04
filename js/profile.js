// profile.js
// Logic for the shared profile.html page, reachable from the avatar dropdown
// (renderSiteNav() in script.js) for every role. Shows the signed-in user's account
// details plus a role-specific card: farm details for a farmer, business details and
// the verification request flow for a buyer. Administrators have no extra profile
// fields, so their role card stays hidden.

// ---------- Profile page ----------

function initProfilePage() {
  const user = requireAnyRole(["farmer", "buyer", "administrator"]);
  if (!user) return;

  renderProfileAccountCard(user);
  renderProfileRoleCard(user);
}

function renderProfileAccountCard(user) {
  const container = document.getElementById("profile-account-card");
  if (!container) return;

  container.innerHTML = `
    <p class="profile-summary__name">${escapeHtml(user.name)}</p>
    <p class="profile-summary__meta">${escapeHtml(ROLE_LABELS[user.role])}</p>
    <p class="profile-summary__meta">${escapeHtml(user.email)}</p>
    <p class="profile-summary__meta">${escapeHtml(user.location)}</p>
  `;
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

  if (user.role === "buyer") {
    const profile = getBuyerProfiles().find((item) => item.id === user.profileId);
    if (!profile) return;
    section.hidden = false;
    heading.textContent = "Business & Verification";
    container.innerHTML = `
      <p class="profile-summary__name">${escapeHtml(profile.businessName)}</p>
      <span class="verification-badge ${verificationBadgeModifier(profile.verificationStatus)}">${escapeHtml(profile.verificationStatus)}</span>
      <p class="profile-summary__meta profile-summary__rating">${profile.rating.toFixed(1)} &#9733; (${profile.reviewCount} review${profile.reviewCount === 1 ? "" : "s"})</p>
      <div id="verification-request-section"></div>
    `;
    renderVerificationRequestSection(user, profile);
    return;
  }

  // Administrators have no additional profile fields to show.
  section.hidden = true;
}

// ---------- Buyer verification request ----------

// The verification document currently staged in the uploader, in memory until submit.
let verificationDocument = null;

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

  renderProfileRoleCard(user);
  showNotification("Your verification request has been submitted.");
}

// ---------- Page init ----------

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("profile-account-card")) {
    initProfilePage();
  }
});
