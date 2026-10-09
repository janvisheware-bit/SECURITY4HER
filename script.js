
"use strict";

/*
  SECURITY4HER — Front-End Prototype
  This demo does not send emergency alerts or upload evidence.
*/

const $ = (selector, root = document) => root.querySelector(selector);

const modalOverlay = $("#modalOverlay");
const modalContent = $("#modalContent");
const modalTitle = $("#modalTitle");
const closeModalButton = $("#closeModal");

const STORAGE_KEY = "security4her_contacts_v1";

let checkInInterval = null;
let remainingSeconds = 0;
let selectedEvidence = [];

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function openModal(title, content) {
  if (!modalOverlay || !modalContent || !modalTitle) {
    alert("The modal elements are missing from index.html.");
    return;
  }

  modalTitle.textContent = title;
  modalContent.innerHTML = content;
  modalOverlay.classList.add("active");
  modalOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  closeModalButton?.focus();
}

function closeModal() {
  if (!modalOverlay) return;

  modalOverlay.classList.remove("active");
  modalOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

closeModalButton?.addEventListener("click", closeModal);

modalOverlay?.addEventListener("click", (event) => {
  if (event.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

// PANIC ALERT
function showPanicAlert() {
  openModal(
    "🚨 Emergency Help",
    `
      <p>If you are in immediate danger, move to a safer place if possible
      and contact local emergency services when it is safe to do so.</p>
      <p><strong>In India, the emergency number is 112.</strong></p>
      <div class="modal-actions">
        <a class="button" href="tel:112">Call 112</a>
        <button class="button secondary" data-action="location">
          Get My Location
        </button>
      </div>
      <p class="status-message" id="locationStatus" role="status"></p>
      <p><small>This demo does not automatically notify police or your contacts.
      The call link opens your device's calling app, if supported.</small></p>
    `
  );
}

$("#panicButton")?.addEventListener("click", showPanicAlert);

// SMART CHECK-IN
function showCheckIn() {
  openModal(
    "⏱️ Smart Check-In",
    `
      <p>Choose how long you want the check-in timer to run.</p>
      <label for="checkInMinutes">Check in after</label>
      <select id="checkInMinutes">
        <option value="1">1 minute (test)</option>
        <option value="5">5 minutes</option>
        <option value="10">10 minutes</option>
        <option value="15">15 minutes</option>
        <option value="30">30 minutes</option>
        <option value="60">1 hour</option>
      </select>
      <p class="status-message" id="timerStatus" role="status">
        Timer has not started.
      </p>
      <div class="modal-actions">
        <button class="button" data-action="startTimer">Start Timer</button>
        <button class="button secondary" data-action="safe">I'm Safe</button>
        <button class="button secondary" data-action="cancelTimer">Cancel Timer</button>
      </div>
      <p><small>The timer works while this page remains open. It does not
      send alerts or run reliably in the background.</small></p>
    `
  );
}

function updateTimerDisplay() {
  const status = $("#timerStatus");
  if (!status) return;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  status.textContent =
    `Time remaining: ${minutes}:${String(seconds).padStart(2, "0")}`;
}

function startCheckIn() {
  const minutesInput = $("#checkInMinutes");
  if (!minutesInput) return;

  clearInterval(checkInInterval);

  remainingSeconds = Number(minutesInput.value) * 60;
  updateTimerDisplay();

  checkInInterval = setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      clearInterval(checkInInterval);
      checkInInterval = null;
      remainingSeconds = 0;

      const status = $("#timerStatus");
      if (status) {
        status.textContent =
          "⚠️ Check-in time reached. Please check your safety. No alert was sent.";
      }
      return;
    }

    updateTimerDisplay();
  }, 1000);
}

function markSafe() {
  clearInterval(checkInInterval);
  checkInInterval = null;
  remainingSeconds = 0;

  openModal(
    "✅ Check-In Complete",
    `<p>Your check-in is marked complete in this demo.</p>
     <p><small>No one was notified.</small></p>
     <button class="button" data-action="close">Done</button>`
  );
}

function cancelCheckIn() {
  clearInterval(checkInInterval);
  checkInInterval = null;
  remainingSeconds = 0;

  openModal(
    "Check-In Cancelled",
    `<p>Your timer has been cancelled.</p>
     <button class="button" data-action="close">Done</button>`
  );
}

// LOCATION
function getMyLocation() {
  const status =
    $("#locationStatus") || $("#locationResult");

  if (!navigator.geolocation) {
    if (status) {
      status.textContent = "Location is not supported by this browser.";
    }
    return;
  }

  if (status) {
    status.textContent =
      "Requesting location permission. Please respond to your browser's prompt.";
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const mapURL =
        `https://www.google.com/maps?q=${latitude},${longitude}`;

      const currentStatus =
        $("#locationStatus") || $("#locationResult");

      if (currentStatus) {
        currentStatus.innerHTML = `
          <strong>Location retrieved.</strong>
          <p>Latitude: ${latitude.toFixed(5)}</p>
          <p>Longitude: ${longitude.toFixed(5)}</p>
          <a href="${mapURL}" target="_blank" rel="noopener noreferrer">
            Open in Google Maps
          </a>
          <p><small>Your location has not been sent to anyone.</small></p>
        `;
      }
    },
    (error) => {
      const currentStatus =
        $("#locationStatus") || $("#locationResult");

      if (!currentStatus) return;

      if (error.code === error.PERMISSION_DENIED) {
        currentStatus.textContent =
          "Location permission was denied. Allow location access in your browser settings to try again.";
      } else if (error.code === error.TIMEOUT) {
        currentStatus.textContent =
          "Location request timed out. Please try again.";
      } else {
        currentStatus.textContent =
          "Unable to retrieve your location. Check your device settings and try again.";
      }
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function showLocation() {
  openModal(
    "📍 Share Location",
    `
      <p>Allow your browser to retrieve your current location.</p>
      <button class="button" data-action="location">Request Location</button>
      <p class="status-message" id="locationResult" role="status"></p>
      <p><small>This demo displays a map link but does not share your location
      with emergency contacts.</small></p>
    `
  );
}

// EVIDENCE CAPTURE
function showEvidence() {
  selectedEvidence = [];

  openModal(
    "📷 Evidence Capture",
    `
      <p>Select photos, videos, or documents to list them in this demo.</p>
      <label for="evidenceFiles">Choose files</label>
      <input id="evidenceFiles" type="file" multiple
        accept="image/*,video/*,.pdf,.txt,.doc,.docx">
      <p class="status-message" id="evidenceStatus" role="status">
        No files selected.
      </p>
      <ul class="evidence-list" id="evidenceList"></ul>
      <div class="modal-actions">
        <button class="button secondary" data-action="clearEvidence">
          Clear Selection
        </button>
      </div>
      <p><small>Files are not uploaded or encrypted by this prototype.
      For sensitive evidence, use a trusted secure storage method.</small></p>
    `
  );
}

function displayEvidence(input) {
  const list = $("#evidenceList");
  const status = $("#evidenceStatus");

  if (!list || !status) return;

  const files = Array.from(input.files || []);
  selectedEvidence = files;
  list.innerHTML = "";

  if (files.length === 0) {
    status.textContent = "No files selected.";
    return;
  }

  files.forEach((file) => {
    const item = document.createElement("li");
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    item.textContent = `${file.name} — ${sizeMB} MB`;
    list.appendChild(item);
  });

  status.textContent =
    `${files.length} file(s) selected in this browser session.`;
}

function clearEvidence() {
  selectedEvidence = [];

  const input = $("#evidenceFiles");
  const list = $("#evidenceList");
  const status = $("#evidenceStatus");

  if (input) input.value = "";
  if (list) list.innerHTML = "";
  if (status) status.textContent = "Selection cleared.";
}

// EMERGENCY CONTACTS
function readContacts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeContacts(contacts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    return true;
  } catch {
    alert("Your browser could not save the contacts.");
    return false;
  }
}

function showContacts() {
  const contacts = readContacts();

  const contactMarkup = contacts.length
    ? contacts.map((contact, index) => `
        <li class="contact-item">
          <div>
            <strong>${escapeHTML(contact.name)}</strong>
            <p>${escapeHTML(contact.phone)}</p>
            <a href="tel:${encodeURIComponent(contact.phone)}">Call contact</a>
          </div>
          <button class="button secondary mini-button"
            data-action="deleteContact" data-index="${index}">
            Delete
          </button>
        </li>
      `).join("")
    : "<li>No contacts saved yet.</li>";

  openModal(
    "📞 Emergency Contacts",
    `
      <p>Add trusted people you may want to contact in an emergency.</p>
      <form id="contactForm">
        <label for="contactName">Contact name</label>
        <input id="contactName" name="contactName" required maxlength="60"
          placeholder="e.g. Family member">

        <label for="contactPhone">Phone number</label>
        <input id="contactPhone" name="contactPhone" type="tel" required
          maxlength="25" placeholder="e.g. +91 98765 43210">

        <div class="modal-actions">
          <button class="button" type="submit">Add Contact</button>
        </div>
      </form>
      <h3>Saved Contacts</h3>
      <ul class="contact-list">${contactMarkup}</ul>
      <p><small>Contacts are saved in this browser on this device.
      They are not automatically notified.</small></p>
    `
  );

  $("#contactForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("#contactName")?.value.trim();
    const phone = $("#contactPhone")?.value.trim();

    if (!name || !phone) return;

    const updated = readContacts();
    updated.push({ name, phone });

    if (writeContacts(updated)) showContacts();
  });
}

function deleteContact(index) {
  const contacts = readContacts();
  const numericIndex = Number(index);

  if (!Number.isInteger(numericIndex) ||
      numericIndex < 0 ||
      numericIndex >= contacts.length) {
    return;
  }

  contacts.splice(numericIndex, 1);

  if (writeContacts(contacts)) showContacts();
}

// SAFETY GUIDE
function showSafetyGuide() {
  openModal(
    "🛡️ Safety Guide",
    `
      <h3>Physical Safety</h3>
      <ul>
        <li>When possible, move toward a well-lit, populated place.</li>
        <li>Tell someone you trust about your plans or route.</li>
        <li>Keep your phone accessible and charged when possible.</li>
        <li>If you are in immediate danger in India, call 112 if safe to do so.</li>
      </ul>
      <h3>Digital Safety</h3>
      <ul>
        <li>Use strong, unique passwords and enable two-factor authentication.</li>
        <li>Review app permissions for location, camera, and microphone.</li>
        <li>Be careful about sharing live location or personal details publicly.</li>
        <li>Use a trusted device if you are worried someone monitors your activity.</li>
      </ul>
      <p>Choose the safest action for your own situation. These reminders cannot
      replace professional or emergency assistance.</p>
    `
  );
}

// PRIVACY SETTINGS
function showPrivacy() {
  const count = readContacts().length;

  openModal(
    "🔐 Privacy Settings",
    `
      <h3>Your prototype data</h3>
      <p>Saved emergency contacts in this browser: <strong>${count}</strong></p>
      <p>Contacts are stored using browser local storage. This is not encrypted
      evidence storage, and other people with access to this browser profile
      may be able to access them.</p>
      <div class="modal-actions">
        <button class="button secondary" data-action="clearContacts">
          Delete All Contacts
        </button>
      </div>
      <p><small>This prototype does not upload evidence or send your location
      to a server. Clearing browser data may also remove saved contacts.</small></p>
    `
  );
}

function clearAllContacts() {
  const confirmed = window.confirm(
    "Delete all saved SECURITY4HER contacts from this browser?"
  );

  if (!confirmed) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    showPrivacy();
  } catch {
    alert("Could not clear contacts from browser storage.");
  }
}

// BUTTON ACTIONS
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  switch (button.dataset.action) {
    case "close":
      closeModal();
      break;
    case "startTimer":
      startCheckIn();
      break;
    case "safe":
      markSafe();
      break;
    case "cancelTimer":
      cancelCheckIn();
      break;
    case "location":
      getMyLocation();
      break;
    case "deleteContact":
      deleteContact(button.dataset.index);
      break;
    case "clearContacts":
      clearAllContacts();
      break;
    case "clearEvidence":
      clearEvidence();
      break;
  }
});

// FEATURE CARDS
document.addEventListener("click", (event) => {
  const featureButton = event.target.closest("[data-feature]");
  if (!featureButton) return;

  switch (featureButton.dataset.feature) {
    case "checkin":
      showCheckIn();
      break;
    case "location":
      showLocation();
      break;
    case "evidence":
      showEvidence();
      break;
    case "contacts":
      showContacts();
      break;
    case "guide":
      showSafetyGuide();
      break;
    case "privacy":
      showPrivacy();
      break;
  }
});

// EVIDENCE FILE PICKER
document.addEventListener("change", (event) => {
  if (event.target.id === "evidenceFiles") {
    displayEvidence(event.target);
  }
});

console.log("SECURITY4HER prototype JavaScript loaded successfully.");
