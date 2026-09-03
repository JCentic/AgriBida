// script.js
// Shared app startup plus the unified authentication screen (sign in + registration).
// Once farmer/buyer/administrator dashboards exist, page-specific logic can move
// into its own file; for this starting structure everything lives here.

const ROLE_LABELS = {
  farmer: "Farmer",
  buyer: "Buyer",
  administrator: "Administrator",
};

// Maps each role to its future dashboard page. Pages don't exist yet — routeToDashboard()
// uses this only to describe where sign-in will lead once those pages are built.
const ROLE_DASHBOARDS = {
  farmer: "farmer-dashboard.html",
  buyer: "buyer-dashboard.html",
  administrator: "admin-dashboard.html",
};

// A single role-specific quick link shown in the profile dropdown, alongside the
// pages every role gets (Dashboard, Profile, Settings, Sign Out).
const ROLE_SHORTCUTS = {
  farmer: { label: "My Listings", href: "farmer-dashboard.html" },
  buyer: { label: "My Bids", href: "my-bids.html" },
  administrator: { label: "Manage Buyers", href: "admin-buyers.html" },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Maps registration field names to their input element ids.
const REGISTER_FIELD_IDS = {
  name: "register-name",
  email: "register-email",
  location: "register-location",
  role: "register-role",
  roleDetail: "register-roledetail",
  password: "register-password",
  confirmPassword: "register-confirm-password",
};

// Shows a short message in the shared footer/notification area.
function showNotification(message) {
  const notificationArea = document.getElementById("notification-area");
  if (!notificationArea) return;
  notificationArea.textContent = message;
}

// ---------- Field/form error helpers ----------

function showFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(`${inputId}-error`);
  if (errorEl) errorEl.textContent = message;
  if (input) input.setAttribute("aria-invalid", "true");
}

function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
  });
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  const formError = form.querySelector(".form-error");
  if (formError) formError.textContent = "";
}

// ---------- Sequential sample id generation (e.g. "user-005") ----------

function generateSequentialId(prefix, items) {
  const maxSuffix = items.reduce((max, item) => {
    const match = /^[a-zA-Z]+-(\d+)$/.exec(item.id);
    const suffix = match ? parseInt(match[1], 10) : 0;
    return Math.max(max, suffix);
  }, 0);
  return `${prefix}-${String(maxSuffix + 1).padStart(3, "0")}`;
}

// ---------- Auth mode toggle (Sign In <-> Create Account) ----------

function setAuthMode(mode) {
  const isRegister = mode === "register";

  document.getElementById("signin-form").hidden = isRegister;
  document.getElementById("register-form").hidden = !isRegister;
  document.querySelector('[data-mode="signin"]').hidden = isRegister;
  document.querySelector('[data-mode="register"]').hidden = !isRegister;

  document.getElementById("auth-heading").textContent = isRegister
    ? "Create your AgriBida account"
    : "Sign in to AgriBida";
  document.getElementById("auth-subtitle").textContent = isRegister
    ? "Register as a farmer or buyer to get started."
    : "Enter your account details to continue.";

  clearFormErrors("signin-form");
  clearFormErrors("register-form");
}

// Keeps the role-specific name field labeled correctly as the applicant picks a role.
function handleRegisterRoleChange(event) {
  const label = document.getElementById("register-roledetail-label");
  label.textContent = event.target.value === "buyer" ? "Business name" : "Farm name";
}

// ---------- Sign In ----------

function handleSignInSubmit(event) {
  event.preventDefault();
  clearFormErrors("signin-form");

  const email = document.getElementById("signin-email").value;
  const password = document.getElementById("signin-password").value;

  let hasError = false;
  if (!email.trim()) {
    showFieldError("signin-email", "Email is required.");
    hasError = true;
  }
  if (!password) {
    showFieldError("signin-password", "Password is required.");
    hasError = true;
  }
  if (hasError) return;

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    document.getElementById("signin-form-error").textContent = "Incorrect email or password.";
    const passwordInput = document.getElementById("signin-password");
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  setCurrentUser(user);
  routeToDashboard(user);
}

// ---------- Registration ----------

function validateRegistrationForm(values) {
  const errors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = "Full name is required.";
  } else if (name.length > 60) {
    errors.name = "Full name must be 60 characters or fewer.";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  } else if (findUserByEmail(email)) {
    errors.email = "An account with this email already exists.";
  }

  if (!values.location.trim()) {
    errors.location = "Location is required.";
  }

  if (!values.role) {
    errors.role = "Select a role.";
  }

  if (!values.roleDetail.trim()) {
    errors.roleDetail = values.role === "buyer" ? "Business name is required." : "Farm name is required.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

// Creates the new user record plus its matching farmer/buyer profile, and saves both.
function createAccount(values) {
  const newUserId = generateSequentialId("user", getUsers());
  const role = values.role;
  const roleDetail = values.roleDetail.trim();

  let profileId;
  if (role === "farmer") {
    profileId = generateSequentialId("farmer", getFarmerProfiles());
    addFarmerProfile({ id: profileId, userId: newUserId, farmName: roleDetail, produceTypes: [] });
  } else {
    profileId = generateSequentialId("buyer", getBuyerProfiles());
    addBuyerProfile({
      id: profileId,
      userId: newUserId,
      businessName: roleDetail,
      verificationStatus: "Pending Verification",
      rating: 0,
      reviewCount: 0,
      feedback: [],
      verificationDocument: null,
      verificationSubmittedAt: null,
      verificationRequestReason: null,
      verificationNote: null,
    });
  }

  const newUser = {
    id: newUserId,
    name: values.name.trim(),
    email: values.email.trim(),
    password: values.password,
    role,
    location: values.location.trim(),
    profileId,
  };
  addUser(newUser);
  return newUser;
}

function handleRegisterSubmit(event) {
  event.preventDefault();
  clearFormErrors("register-form");

  const values = {
    name: document.getElementById("register-name").value,
    email: document.getElementById("register-email").value,
    location: document.getElementById("register-location").value,
    role: document.getElementById("register-role").value,
    roleDetail: document.getElementById("register-roledetail").value,
    password: document.getElementById("register-password").value,
    confirmPassword: document.getElementById("register-confirm-password").value,
  };

  const errors = validateRegistrationForm(values);
  const errorFields = Object.keys(errors);

  if (errorFields.length > 0) {
    errorFields.forEach((field) => showFieldError(REGISTER_FIELD_IDS[field], errors[field]));
    document.getElementById(REGISTER_FIELD_IDS[errorFields[0]]).focus();
    return;
  }

  const newUser = createAccount(values);
  setCurrentUser(newUser);
  routeToDashboard(newUser);
}

// ---------- RBAC routing ----------

// RBAC entry point: stores the signed-in user, then routes to the role's dashboard.
function routeToDashboard(user) {
  if (user.role === "farmer" || user.role === "buyer" || user.role === "administrator") {
    window.location.href = ROLE_DASHBOARDS[user.role];
    return;
  }

  const destination = ROLE_DASHBOARDS[user.role];
  showNotification(
    `Welcome, ${user.name}. You're signed in as ${ROLE_LABELS[user.role]}. ` +
      `(The ${ROLE_LABELS[user.role]} dashboard isn't built yet — it will open ${destination}.)`
  );
}

// Route guard for role-specific pages: redirects to the sign-in page and returns null
// when no user is signed in or the signed-in user has a different role; otherwise
// returns the signed-in user so the calling page can render with it.
function requireRole(expectedRole) {
  const user = getCurrentUser();
  if (!user || user.role !== expectedRole) {
    window.location.href = "index.html";
    return null;
  }
  return user;
}

// Route guard for pages shared by more than one role (e.g. listing-details.html):
// redirects to the sign-in page and returns null when no user is signed in or the
// signed-in user's role isn't in expectedRoles; otherwise returns the signed-in user.
function requireAnyRole(expectedRoles) {
  const user = getCurrentUser();
  if (!user || !expectedRoles.includes(user.role)) {
    window.location.href = "index.html";
    return null;
  }
  return user;
}

// ---------- Shared navigation & sign out ----------

function handleSignOut() {
  clearCurrentUser();
  window.location.href = "index.html";
}

// Builds the initials shown on the profile avatar, e.g. "Metro Fresh Produce" -> "MF".
function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0].toUpperCase());
  return initials.join("") || "?";
}

// Fills the shared nav bar with a profile avatar for the signed-in user. Clicking the
// avatar opens a dropdown with Dashboard/Profile/Settings/a role shortcut/Sign Out.
// Falls back to the placeholder text when no one is signed in.
function renderSiteNav() {
  const container = document.getElementById("site-nav-content");
  if (!container) return;

  const user = getCurrentUser();
  if (!user) {
    container.innerHTML = '<p class="site-nav__placeholder">Navigation appears here after you sign in.</p>';
    return;
  }

  const shortcut = ROLE_SHORTCUTS[user.role];

  container.innerHTML = `
    <div class="nav-profile">
      <button type="button" class="nav-profile__trigger" id="nav-profile-trigger" aria-haspopup="true" aria-expanded="false">
        <span class="nav-profile__avatar" aria-hidden="true">${escapeHtml(getInitials(user.name))}</span>
        <span class="nav-profile__name">${escapeHtml(user.name)}</span>
      </button>
      <div class="nav-profile__menu" id="nav-profile-menu" role="menu" hidden>
        <p class="nav-profile__menu-heading">${escapeHtml(user.name)} &middot; ${escapeHtml(ROLE_LABELS[user.role])}</p>
        <a class="nav-profile__menu-item" role="menuitem" href="${ROLE_DASHBOARDS[user.role]}">Dashboard</a>
        <a class="nav-profile__menu-item" role="menuitem" href="profile.html">Profile</a>
        <a class="nav-profile__menu-item" role="menuitem" href="settings.html">Settings</a>
        ${shortcut ? `<a class="nav-profile__menu-item" role="menuitem" href="${shortcut.href}">${escapeHtml(shortcut.label)}</a>` : ""}
        <button type="button" class="nav-profile__menu-item nav-profile__menu-item--btn" role="menuitem" id="nav-signout-btn">Sign Out</button>
      </div>
    </div>
  `;

  document.getElementById("nav-signout-btn").addEventListener("click", handleSignOut);
  initNavProfileDropdown();
}

// Wires the avatar button to open/close its dropdown: toggle on click, close on
// outside click or Escape.
function initNavProfileDropdown() {
  const trigger = document.getElementById("nav-profile-trigger");
  const menu = document.getElementById("nav-profile-menu");
  if (!trigger || !menu) return;

  const closeMenu = () => {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  };

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = !menu.hidden;
    if (isOpen) {
      closeMenu();
    } else {
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    }
  });

  document.addEventListener("click", (event) => {
    if (!menu.hidden && !menu.contains(event.target) && event.target !== trigger) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      closeMenu();
      trigger.focus();
    }
  });
}

// ---------- Page init ----------

function initAuthPage() {
  const signInForm = document.getElementById("signin-form");
  const registerForm = document.getElementById("register-form");
  if (!signInForm || !registerForm) return;

  signInForm.addEventListener("submit", handleSignInSubmit);
  registerForm.addEventListener("submit", handleRegisterSubmit);
  document.getElementById("show-register-btn").addEventListener("click", () => setAuthMode("register"));
  document.getElementById("show-signin-btn").addEventListener("click", () => setAuthMode("signin"));
  document.getElementById("register-role").addEventListener("change", handleRegisterRoleChange);
}

// App entry point: seed sample data, then set up the current page.
document.addEventListener("DOMContentLoaded", () => {
  seedStorageIfEmpty();
  renderSiteNav();
  initAuthPage();
});
