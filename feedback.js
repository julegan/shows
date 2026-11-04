(() => {
  "use strict";
  const invite = document.getElementById("feedbackInvite");
  const dialog = document.getElementById("feedbackDialog");
  const form = document.getElementById("feedbackForm");
  if (!invite || !dialog || !form) return;

  const status = document.getElementById("feedbackStatus");
  const submit = document.getElementById("feedbackSubmit");
  const done = document.getElementById("feedbackDone");
  const verification = document.getElementById("feedbackVerification");
  const endpoint = "/api/shows/feedback";
  let sitekey = "";
  let widgetId = null;
  let loader = null;
  let previousFocus = null;

  function message(value) { status.textContent = value; }
  function loadVerification() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (loader) return loader;
    loader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error("Verification unavailable"));
      script.onerror = () => reject(new Error("Verification unavailable"));
      document.head.appendChild(script);
    }).catch(error => { loader = null; throw error; });
    return loader;
  }

  async function openFeedback(options = {}) {
    if (!sitekey || dialog.open) return;
    previousFocus = document.activeElement;
    form.hidden = false;
    done.hidden = true;
    form.reset();
    document.getElementById("feedbackCategory").value = options.category || "idea";
    document.getElementById("feedbackLink").value = options.link || "";
    message("");
    dialog.showModal();
    document.getElementById("feedbackDetails").focus();
    try {
      const turnstile = await loadVerification();
      if (!dialog.open) return;
      if (widgetId === null) {
        widgetId = turnstile.render(verification, { sitekey, action: "shows_feedback", theme: "dark" });
      } else {
        turnstile.reset(widgetId);
      }
    } catch (_) {
      message("Verification couldn't load. Please try again when you're connected.");
    }
  }

  window.SHOWS_OPEN_FEEDBACK = openFeedback;
  document.querySelectorAll("[data-feedback-launch]").forEach(button => {
    button.addEventListener("click", () => openFeedback());
  });
  document.getElementById("feedbackClose").addEventListener("click", () => dialog.close());
  done.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    window.turnstile?.reset(widgetId);
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const token = window.turnstile?.getResponse(widgetId);
    if (!token) { message("Complete the verification to send feedback."); return; }
    const payload = {
      category: document.getElementById("feedbackCategory").value,
      details: document.getElementById("feedbackDetails").value.trim(),
      link: document.getElementById("feedbackLink").value.trim(),
      token
    };
    if (payload.details.length < 10 || payload.details.length > 2000) {
      message("Please write between 10 and 2,000 characters."); return;
    }
    submit.disabled = true;
    message("Sending…");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Submission failed");
      form.hidden = true;
      done.hidden = false;
      message("Thank you — your feedback was sent for review.");
      done.focus();
    } catch (_) {
      message("Couldn't send feedback. Please try again.");
      window.turnstile?.reset(widgetId);
    } finally {
      submit.disabled = false;
    }
  });

  // Enable the affordance only when the deployed receiver and spam protection
  // are configured. The static canonical preview has no receiver of its own.
  fetch(endpoint + "/config", { cache: "no-store" })
    .then(response => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
    .then(config => {
      if (config.enabled !== true || typeof config.sitekey !== "string" || !config.sitekey) return;
      sitekey = config.sitekey;
      invite.hidden = false;
      window.SHOWS_FEEDBACK_READY = true;
    })
    .catch(() => {});
})();
