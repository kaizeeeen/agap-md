// === AgapMD — Main Application Logic ===

// --- Screen Navigation ---
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = {
    'screen-home': 'nav-home',
    'screen-directory': 'nav-directory',
    'screen-emergency': 'nav-emergency',
    'screen-profile': 'nav-home',
    'screen-market': 'nav-market',
    'screen-ai': 'nav-ai',
    'screen-nav': null
  };
  if (navMap[id]) document.getElementById(navMap[id]).classList.add('active');

  // Reset emergency screen
  if (id === 'screen-emergency') {
    document.getElementById('who-section').style.display = 'block';
    document.getElementById('chat-section').classList.remove('visible');
    document.getElementById('triage-result').classList.remove('visible');
    document.getElementById('chat-messages').innerHTML = '';
    document.querySelectorAll('.who-card').forEach(c => c.classList.remove('selected'));
  }

  // Reset nav screen state when entering
  if (id === 'screen-nav') {
    const btn = document.getElementById('btn-start-nav');
    if (btn) {
      btn.textContent = 'START PRIORITY NAV';
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
    }
    // Reset row 2 to notifying state
    const row2Icon = document.querySelector('#auth-row-2 .reminder-icon');
    const row2Status = document.querySelector('.auth-status-2');
    if (row2Icon) row2Icon.textContent = '🟡';
    if (row2Icon) row2Icon.style.background = 'rgba(245,158,11,0.12)';
    if (row2Status) row2Status.textContent = 'NOTIFYING... ⏳ • Sending...';
  }
}

// --- Emergency Triage: Select Who ---
let urgencyScore = 0;
let triageType = '';

function selectWho(el, type) {
  document.querySelectorAll('.who-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  // Reset score
  urgencyScore = 0;
  triageType = type;

  setTimeout(() => {
    document.getElementById('who-section').style.display = 'none';
    document.getElementById('chat-section').classList.add('visible');
    startTriage(type);
  }, 400);
}

// --- Chat Helpers ---
function addMessage(text, isAI, delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      const msgs = document.getElementById('chat-messages');
      const msg = document.createElement('div');
      msg.className = `chat-msg ${isAI ? 'ai' : 'user'}`;
      if (isAI) {
        msg.innerHTML = `<div class="label"><span style="font-size:14px">🤖</span> AgapMD AI</div>${text}`;
      } else {
        msg.textContent = text;
      }
      msgs.appendChild(msg);
      msgs.scrollTop = msgs.scrollHeight;
      resolve();
    }, delay);
  });
}

function addChips(options, delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      const msgs = document.getElementById('chat-messages');
      const chipDiv = document.createElement('div');
      chipDiv.className = 'symptom-chips';
      chipDiv.style.animation = 'msgIn 0.3s ease-out';
      options.forEach(opt => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.textContent = opt.label;
        chip.onclick = () => {
          chipDiv.remove();
          // Add score points
          if (opt.score) urgencyScore += opt.score;
          addMessage(opt.label, false).then(() => opt.action());
        };
        chipDiv.appendChild(chip);
      });
      msgs.appendChild(chipDiv);
      msgs.scrollTop = msgs.scrollHeight;
      resolve();
    }, delay);
  });
}

// --- Triage Flow with Score ---
async function startTriage(type) {
  if (type === 'pet') {
    await addMessage("I understand this is stressful. Let me help you fast. What's happening with your pet?", true, 300);
    await addChips([
      { label: "Vomiting / Diarrhea", score: 10, action: askPetDuration },
      { label: "Not eating / Weak", score: 15, action: askPetDuration },
      { label: "Difficulty breathing", score: 50, action: askPetResponsive },
      { label: "Bleeding / Injury", score: 45, action: askPetResponsive },
    ], 600);
  } else if (type === 'dental') {
    await addMessage("I'll help with your dental concern. What's happening?", true, 300);
    await addChips([
      { label: "Mild toothache", score: 5, action: askDuration },
      { label: "Severe throbbing pain", score: 30, action: askDuration },
      { label: "Broken / chipped tooth", score: 25, action: askDuration },
      { label: "Swollen face / gums", score: 40, action: askDuration },
    ], 600);
  } else {
    // human or child
    await addMessage("Let me help you find the right care. Can you describe what's happening?", true, 300);
    await addChips([
      { label: "Fever / Feeling sick", score: 10, action: askDuration },
      { label: "Severe pain", score: 25, action: askDuration },
      { label: "Difficulty breathing", score: 50, action: askSeverity },
      { label: "Injury / Bleeding", score: 40, action: askSeverity },
    ], 600);
  }
}

// Duration step (adds moderate score)
async function askPetDuration() {
  await addMessage("How long has this been going on?", true, 500);
  await addChips([
    { label: "Just started (< 1 hour)", score: 5, action: askPetResponsive },
    { label: "A few hours", score: 10, action: askPetResponsive },
    { label: "Since yesterday", score: 15, action: askPetResponsive },
    { label: "Multiple days", score: 25, action: askPetResponsive },
  ], 400);
}

async function askDuration() {
  await addMessage("How long has this been going on?", true, 500);
  await addChips([
    { label: "Just now", score: 5, action: askSeverity },
    { label: "A few hours", score: 10, action: askSeverity },
    { label: "Since yesterday", score: 15, action: askSeverity },
    { label: "Several days", score: 20, action: askSeverity },
  ], 400);
}

// Severity / responsiveness step
async function askPetResponsive() {
  await addMessage("Is your pet still responsive? Can they stand/walk?", true, 500);
  await addChips([
    { label: "Yes, acting mostly normal", score: 0, action: finalizeTriage },
    { label: "Yes, but seems weak", score: 10, action: finalizeTriage },
    { label: "No, barely moving", score: 35, action: finalizeTriage },
  ], 400);
}

async function askSeverity() {
  await addMessage("How would you rate the severity right now?", true, 500);
  await addChips([
    { label: "Mild — manageable", score: 0, action: finalizeTriage },
    { label: "Moderate — uncomfortable", score: 10, action: finalizeTriage },
    { label: "Severe — needs help now", score: 30, action: finalizeTriage },
  ], 400);
}

// --- Finalize & render result ---
async function finalizeTriage() {
  const aiMsg = urgencyScore > 40
    ? "🚨 This is critical. I'm finding you the nearest emergency facility immediately."
    : urgencyScore >= 20
    ? "I'd recommend seeing a professional soon. Let me find a nearby option."
    : "This doesn't seem urgent, but let me give you some guidance and options.";

  await addMessage(aiMsg, true, 400);
  setTimeout(() => showTriageResult(urgencyScore), 900);
}

// --- Triage Result Rendering ---
function showTriageResult(score) {
  const resultEl = document.getElementById('triage-result');
  const bannerEl = document.getElementById('urgency-banner');
  const detailsEl = document.getElementById('triage-details');
  const facilityEl = document.getElementById('nearest-facility');
  const actionsEl = document.getElementById('triage-actions');

  // Remove old classes
  bannerEl.className = 'urgency-banner';

  if (score > 40) {
    // === CRITICAL ===
    bannerEl.classList.add('urgency-critical');
    bannerEl.innerHTML = `
      <div class="urgency-label">🚨 CRITICAL — Score: ${score}</div>
      <h3>Seek immediate emergency care</h3>
      <p>Based on the symptoms described, this requires professional attention right now. Do not delay.</p>
    `;

    facilityEl.style.display = 'block';
    facilityEl.innerHTML = `
      <div class="nearest-label">📍 Nearest Emergency Facility</div>
      <h4>${triageType === 'pet' ? 'VetCare Animal Clinic' : 'Metro General Hospital'}</h4>
      <div class="facility-meta">${triageType === 'pet' ? '0.8 km away • Open now • Emergency vet on duty' : '2.5 km away • Open 24hrs • ER available'}</div>
      <div class="facility-tags">
        <span class="facility-tag">24hr Emergency</span>
        <span class="facility-tag">${triageType === 'pet' ? 'Surgery' : 'Trauma'}</span>
        <span class="facility-tag">ICU</span>
      </div>
      <div class="action-buttons">
        <button class="btn-primary">🚗 Navigate Now</button>
        <button class="btn-secondary">📞 Call</button>
      </div>
    `;

    actionsEl.innerHTML = `
      <button class="send-ahead-btn" onclick="sendAhead()">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        Send triage summary ahead
      </button>
    `;
    document.getElementById('green-light-action').innerHTML = `
      <button class="green-light-btn" onclick="showScreen('screen-nav')">
        🟢 Activate Green-Light Route
      </button>
    `;
    detailsEl.innerHTML = '';

  } else if (score >= 20) {
    // === URGENT ===
    bannerEl.classList.add('urgency-urgent');
    bannerEl.innerHTML = `
      <div class="urgency-label">⚠️ URGENT — Score: ${score}</div>
      <h3>See a professional soon</h3>
      <p>Your symptoms suggest you should visit a clinic within the next few hours. Monitor closely.</p>
    `;

    facilityEl.style.display = 'block';
    facilityEl.innerHTML = `
      <div class="nearest-label">📍 Recommended Nearby</div>
      <h4>${triageType === 'pet' ? 'VetCare Animal Clinic' : triageType === 'dental' ? 'Smile Dental Clinic' : 'Metro General Hospital'}</h4>
      <div class="facility-meta">${triageType === 'pet' ? '0.8 km away • Open now' : triageType === 'dental' ? '1.2 km away • Walk-ins accepted' : '2.5 km away • Open 24hrs'}</div>
      <div class="facility-tags">
        <span class="facility-tag">Walk-in OK</span>
        <span class="facility-tag">Open Now</span>
      </div>
      <div class="action-buttons">
        <button class="btn-primary">Navigate Now</button>
        <button class="btn-secondary">📞 Call</button>
      </div>
    `;

    actionsEl.innerHTML = '';
    document.getElementById('green-light-action').innerHTML = '';
    detailsEl.innerHTML = '';

  } else {
    // === NON-URGENT ===
    bannerEl.classList.add('urgency-low');
    bannerEl.innerHTML = `
      <div class="urgency-label">✅ LOW URGENCY — Score: ${score}</div>
      <h3>Home care recommended</h3>
      <p>Based on your symptoms, you can likely manage this at home. Here are some suggestions.</p>
    `;

    facilityEl.style.display = 'none';
    actionsEl.innerHTML = '';
    document.getElementById('green-light-action').innerHTML = '';

    detailsEl.innerHTML = `
      <div class="home-care-card">
        <h4>💡 Home Care Suggestions</h4>
        <ul>
          ${triageType === 'pet' ? `
            <li>Keep your pet hydrated with small sips of water</li>
            <li>Offer bland food (boiled chicken + rice) in small portions</li>
            <li>Monitor temperature and behavior closely</li>
            <li>If symptoms worsen or persist beyond 24 hours, visit a vet</li>
          ` : triageType === 'dental' ? `
            <li>Rinse with warm salt water every few hours</li>
            <li>Take over-the-counter pain relief as directed</li>
            <li>Avoid very hot or cold foods</li>
            <li>Schedule a dental visit within the next few days</li>
          ` : `
            <li>Rest and stay well-hydrated</li>
            <li>Take over-the-counter medication for fever or pain as needed</li>
            <li>Monitor symptoms — seek help if they worsen</li>
            <li>Consider scheduling a checkup if not improving in 2-3 days</li>
          `}
        </ul>
      </div>
    `;
  }

  // Show the result
  document.getElementById('chat-section').classList.remove('visible');
  resultEl.classList.add('visible');
  document.getElementById('sent-confirmation').style.display = 'none';
}

// --- Send Ahead ---
function sendAhead() {
  const btn = document.querySelector('.send-ahead-btn');
  if (btn) btn.style.display = 'none';
  document.getElementById('sent-confirmation').style.display = 'block';
}

// --- Directory Filters ---
function initDirectoryFilters() {
  const pills = document.querySelectorAll('#directory-filters .filter-pill');
  const cards = document.querySelectorAll('#directory-clinic-list .clinic-card');
  const pins = document.querySelectorAll('.map-pin-interactive[data-clinic]');

  function applyFilter(filterValue) {
    cards.forEach(card => {
      let show = false;

      if (filterValue === 'all') {
        show = true;
      } else if (filterValue === 'open') {
        show = card.dataset.open === 'true';
      } else if (filterValue === 'open24') {
        show = card.dataset.open24 === 'true';
      } else {
        show = card.dataset.category === filterValue;
      }

      if (show) {
        card.classList.remove('clinic-card-hidden');
      } else {
        card.classList.add('clinic-card-hidden');
      }
    });

    // Sync map pins with visible cards
    pins.forEach(pin => {
      const matchingCard = document.querySelector(`#directory-clinic-list .clinic-card[data-clinic="${pin.dataset.clinic}"]`);
      if (matchingCard && matchingCard.classList.contains('clinic-card-hidden')) {
        pin.style.opacity = '0.15';
        pin.style.pointerEvents = 'none';
      } else {
        pin.style.opacity = '';
        pin.style.pointerEvents = '';
      }
    });
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      applyFilter(pill.dataset.filter);
    });
  });
}

// --- Interactive Map ---
function initInteractiveMap() {
  const clinicCards = document.querySelectorAll('#directory-clinic-list .clinic-card[data-clinic]');
  const mapPins = document.querySelectorAll('.map-pin-interactive[data-clinic]');
  let activeClinic = null;

  function highlightClinic(clinicId) {
    if (activeClinic === clinicId) {
      // Deselect
      activeClinic = null;
      mapPins.forEach(pin => {
        pin.classList.remove('active-pin', 'dimmed');
      });
      clinicCards.forEach(card => {
        card.classList.remove('active-card');
      });
      return;
    }

    activeClinic = clinicId;

    // Update pins
    mapPins.forEach(pin => {
      if (pin.dataset.clinic === clinicId) {
        pin.classList.add('active-pin');
        pin.classList.remove('dimmed');
      } else {
        pin.classList.remove('active-pin');
        pin.classList.add('dimmed');
      }
    });

    // Update cards
    clinicCards.forEach(card => {
      if (card.dataset.clinic === clinicId) {
        card.classList.add('active-card');
      } else {
        card.classList.remove('active-card');
      }
    });
  }

  // Clinic card click
  clinicCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      highlightClinic(card.dataset.clinic);
    });
  });

  // Map pin click
  mapPins.forEach(pin => {
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      highlightClinic(pin.dataset.clinic);

      // Scroll the matching card into view
      const matchingCard = document.querySelector(`#directory-clinic-list .clinic-card[data-clinic="${pin.dataset.clinic}"]`);
      if (matchingCard) {
        matchingCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
}

// --- Marketplace Tab Switching ---
function showMarketTab(tabName, el) {
  // Hide all sections
  document.getElementById('market-ambulances').style.display = 'none';
  document.getElementById('market-gear').style.display = 'none';
  document.getElementById('market-meds').style.display = 'none';

  // Show selected
  document.getElementById('market-' + tabName).style.display = 'flex';

  // Update pills
  document.querySelectorAll('#market-filters .filter-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
}

// --- Green-Light Priority Nav ---
function startPriorityNav() {
  const btn = document.getElementById('btn-start-nav');
  if (btn) {
    btn.textContent = '🟢 NAVIGATING...';
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';
  }
  // Update row 2 to alerted
  const row2Icon = document.querySelector('#auth-row-2 .reminder-icon');
  const row2Status = document.querySelector('.auth-status-2');
  if (row2Icon) {
    row2Icon.textContent = '🟢';
    row2Icon.style.background = 'rgba(16,185,129,0.12)';
  }
  if (row2Status) row2Status.textContent = 'ALERTED ✅ • Just now';
}

function endTrip() {
  showScreen('screen-home');
}

// --- Expose functions globally for onclick handlers ---
window.showScreen = showScreen;
window.selectWho = selectWho;
window.sendAhead = sendAhead;
window.showMarketTab = showMarketTab;
window.startPriorityNav = startPriorityNav;
window.endTrip = endTrip;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initDirectoryFilters();
  initInteractiveMap();
});
