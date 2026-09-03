// settings.js
// Logic for the shared settings.html page, reachable from the avatar dropdown
// (renderSiteNav() in script.js) for every role. Lets the signed-in user update their
// display name and location; email stays read-only since it's the sign-in identifier.

function initSettingsPage() {
  const user = requireAnyRole(["farmer", "buyer", "administrator"]);
  if (!user) return;

  document.getElementById("settings-name").value = user.name;
  document.getElementById("settings-location").value = user.location;
  document.getElementById("settings-email").value = user.email;

  document.getElementById("settings-form").addEventListener("submit", (event) => handleSettingsSubmit(event, user));
}

function handleSettingsSubmit(event, user) {
  event.preventDefault();
  clearFormErrors("settings-form");

  const name = document.getElementById("settings-name").value.trim();
  const location = document.getElementById("settings-location").value.trim();

  let hasError = false;
  if (!name) {
    showFieldError("settings-name", "Name is required.");
    hasError = true;
  }
  if (!location) {
    showFieldError("settings-location", "Location is required.");
    hasError = true;
  }
  if (hasError) return;

  const users = getUsers();
  const index = users.findIndex((item) => item.id === user.id);
  if (index === -1) return;

  const updatedUser = { ...users[index], name, location };
  users[index] = updatedUser;
  saveUsers(users);
  setCurrentUser(updatedUser);

  renderSiteNav();
  showNotification("Your settings have been saved.");
}

// ---------- Page init ----------

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("settings-form")) {
    initSettingsPage();
  }
});
