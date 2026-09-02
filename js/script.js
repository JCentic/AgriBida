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

// Fills the shared nav bar with the signed-in user's name/role, a dashboard link, and
// a Sign Out action. Falls back to the placeholder text when no one is signed in.
function renderSiteNav() {
  const container = document.getElementById("site-nav-content");
  if (!container) return;

  const user = getCurrentUser();
  if (!user) {
    container.innerHTML = '<p class="site-nav__placeholder">Navigation appears here after you sign in.</p>';
    return;
  }

  container.innerHTML = "";

  const info = document.createElement("span");
  info.className = "site-nav__user";
  info.textContent = `${user.name} · ${ROLE_LABELS[user.role]}`;

  const dashboardLink = document.createElement("a");
  dashboardLink.className = "site-nav__link";
  dashboardLink.href = ROLE_DASHBOARDS[user.role];
  dashboardLink.textContent = "Dashboard";

  const signOutBtn = document.createElement("button");
  signOutBtn.type = "button";
  signOutBtn.className = "link-btn site-nav__signout";
  signOutBtn.textContent = "Sign Out";
  signOutBtn.addEventListener("click", handleSignOut);

  container.append(info, dashboardLink, signOutBtn);
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
