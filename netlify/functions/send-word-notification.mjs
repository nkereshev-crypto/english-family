// Netlify Scheduled Function — runs on Netlify's own servers at the times
// configured in netlify.toml, and sends a push notification with a random
// English word (and its Russian translation) via OneSignal.
//
// Requires two environment variables to be set in the Netlify dashboard
// (Site settings → Environment variables) — NOT committed to the repo:
//   ONESIGNAL_APP_ID   — e.g. 01d59c44-6615-49b8-9a76-d208584e7c35
//   ONESIGNAL_API_KEY  — the secret App API Key from OneSignal (os_v2_app_...)

import words from "./words-data.mjs";

export default async () => {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;

  if (!appId || !apiKey) {
    console.error("Missing ONESIGNAL_APP_ID or ONESIGNAL_API_KEY environment variables.");
    return new Response("Missing OneSignal configuration", { status: 500 });
  }

  const [en, ru] = words[Math.floor(Math.random() * words.length)];
  const body = `${en} — ${ru}`;

  try {
    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["Subscribed Users"],
        headings: { en: "English for Family 📚", ru: "English for Family 📚" },
        contents: { en: body, ru: body },
      }),
    });

    const result = await res.json();
    console.log("OneSignal response:", res.status, JSON.stringify(result));

    if (!res.ok) {
      return new Response(`OneSignal error: ${JSON.stringify(result)}`, { status: 502 });
    }
    return new Response(`Sent: ${body}`, { status: 200 });
  } catch (err) {
    console.error("Failed to send notification:", err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
};
