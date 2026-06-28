/* app.js — DialCheck. Parses phone numbers 100% locally with libphonenumber-js
   (global `libphonenumber`) and qrcode-generator (global `qrcode`). Single + bulk
   modes, formats, anatomy, time zones, flags, action links, QR (dial/contact, PNG),
   copy-all/share, CSV export, history, PWA. Nothing leaves the browser. */

import { COUNTRY_TZ, MULTI_TZ, MULTI_ZONES, COMMON_REGIONS } from "./data.js";

const LP = window.libphonenumber;
const QR = window.qrcode;
const $ = (id) => document.getElementById(id);
const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };

const RN = (() => { try { return new Intl.DisplayNames(["en"], { type: "region" }); } catch { return null; } })();
const regionName = (cc) => { try { return (RN && RN.of(cc)) || cc; } catch { return cc; } };
const flag = (cc) => (cc ? cc.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : "🏳️");

const TYPE = {
  MOBILE: "Mobile", FIXED_LINE: "Landline", FIXED_LINE_OR_MOBILE: "Landline or mobile",
  TOLL_FREE: "Toll-free", PREMIUM_RATE: "Premium rate", SHARED_COST: "Shared cost",
  VOIP: "VoIP", PERSONAL_NUMBER: "Personal number", PAGER: "Pager", UAN: "UAN", VOICEMAIL: "Voicemail",
};
const LENGTH_REASON = {
  TOO_SHORT: "Too short for this country.", TOO_LONG: "Too long for this country.",
  INVALID_LENGTH: "Wrong length for this country.", INVALID_COUNTRY: "Unknown country code — start with + and the country code.",
  NOT_A_NUMBER: "That doesn't look like a phone number.",
};

const timeAt = (tz) => {
  try {
    const now = new Date();
    const t = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit" }).format(now);
    const hr = +new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour12: false, hour: "2-digit" }).format(now);
    return { t, hr };
  } catch { return null; }
};

async function copy(text, btn) {
  try { await navigator.clipboard.writeText(text); if (btn) { const o = btn.textContent; btn.textContent = "Copied"; setTimeout(() => (btn.textContent = o), 1100); } } catch {}
}
function download(name, type, data) {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// QR drawn to a <canvas> (gives a free PNG download)
function qrCanvas(text, scale = 5, margin = 2) {
  const qr = QR(0, "M"); qr.addData(text); qr.make();
  const n = qr.getModuleCount(), size = (n + margin * 2) * scale;
  const cv = document.createElement("canvas"); cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size); ctx.fillStyle = "#000";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
  return cv;
}

/* ---------- single mode ---------- */
function field(label, value, opts = {}) {
  const row = el("div", "field");
  row.append(el("span", "field__l", label));
  row.append(el("span", "field__v" + (opts.mono ? " mono" : ""), value));
  if (opts.copy) { const b = el("button", "field__copy", "Copy"); b.addEventListener("click", () => copy(value, b)); row.append(b); }
  return row;
}
const chip = (text, cls) => el("span", "fl " + (cls || ""), text);

function buildFlags(p) {
  const out = [];
  const ty = p.getType();
  if (ty === "TOLL_FREE") out.push(chip("Toll-free", "fl--info"));
  if (ty === "PREMIUM_RATE") out.push(chip("Premium rate — may be costly", "fl--warn"));
  if (ty === "SHARED_COST") out.push(chip("Shared cost", "fl--info"));
  if (ty === "VOIP") out.push(chip("VoIP", "fl--info"));
  if (ty === "PAGER" || ty === "VOICEMAIL") out.push(chip(TYPE[ty], "fl--info"));
  const nat = String(p.nationalNumber);
  if (/(\d)\1{5,}/.test(nat)) out.push(chip("Repeated digits", "fl--warn"));
  if (/0123456|1234567|2345678|3456789/.test(nat)) out.push(chip("Sequential digits", "fl--warn"));
  return out;
}

function renderSingle() {
  const raw = $("phone").value.trim();
  const region = $("region").value || undefined;
  const out = $("result");
  if (!raw) { out.hidden = true; return; }
  const p = LP.parsePhoneNumberFromString(raw, region);
  out.hidden = false; out.replaceChildren();

  if (!p || !p.isValid()) {
    let why = "";
    try { const r = LP.validatePhoneNumberLength(raw, region); if (r) why = LENGTH_REASON[r] || ""; } catch {}
    const possible = p && p.isPossible();
    out.append(Object.assign(el("div", "verdict " + (possible ? "verdict--warn" : "verdict--bad")),
      { textContent: (possible ? "△ Possible, but not a valid number. " : "✕ Not a valid number. ") + why }));
    if (!p) return;
  } else {
    out.append(Object.assign(el("div", "verdict verdict--ok"), { textContent: "✓ Valid number" }));
  }

  const cc = p.country;
  const card = el("div", "card");
  card.append(field("Country", `${flag(cc)}  ${regionName(cc)} (${cc || "?"})`));
  card.append(field("Calling code", "+" + p.countryCallingCode, { mono: true }));
  card.append(field("Line type", TYPE[p.getType()] || (p.getType() || "Unknown")));

  const fl = buildFlags(p);
  if (fl.length) { const row = el("div", "field"); row.append(el("span", "field__l", "Flags")); const box = el("span", "flags"); fl.forEach((c) => box.append(c)); row.append(box); card.append(row); }

  if (cc && MULTI_ZONES[cc]) {
    const row = el("div", "field"); row.append(el("span", "field__l", "Local time"));
    const box = el("span", "zones");
    for (const [lab, tz] of MULTI_ZONES[cc]) { const tt = timeAt(tz); if (tt) box.append(el("span", "zone", `${lab} ${tt.t.split(" ").slice(1).join(" ")}`)); }
    row.append(box); card.append(row);
  } else if (cc && COUNTRY_TZ[cc]) {
    const tt = timeAt(COUNTRY_TZ[cc]);
    if (tt) card.append(field("Local time", `${tt.t} — ${tt.hr >= 9 && tt.hr < 21 ? "🟢 reasonable hour to call" : "🌙 might be too early/late"}`));
  }
  card.append(field("Carrier", "Needs a live HLR lookup — prefix can't show it reliably after number portability"));
  out.append(card);

  const fmt = el("div", "card");
  fmt.append(el("h3", "card__h", "Formats"));
  fmt.append(field("E.164", p.number, { mono: true, copy: true }));
  fmt.append(field("International", p.formatInternational(), { mono: true, copy: true }));
  fmt.append(field("National", p.formatNational(), { mono: true, copy: true }));
  fmt.append(field("URI", p.getURI(), { mono: true, copy: true }));
  out.append(fmt);

  const an = el("div", "card");
  an.append(el("h3", "card__h", "Anatomy"));
  an.append(field("Country code", "+" + p.countryCallingCode, { mono: true }));
  an.append(field("National number", String(p.nationalNumber), { mono: true }));
  an.append(field("Dial from abroad", `${p.number}  (or  00 ${p.countryCallingCode} ${p.nationalNumber})`, { mono: true }));
  out.append(an);

  const act = el("div", "card");
  act.append(el("h3", "card__h", "Actions"));
  const links = el("div", "links");
  const mk = (label, href) => { const a = el("a", "linkbtn", label); a.href = href; a.target = "_blank"; a.rel = "noopener"; return a; };
  links.append(mk("📞 Call", p.getURI()));
  links.append(mk("✉️ SMS", "sms:" + p.number));
  links.append(mk("🟢 WhatsApp", "https://wa.me/" + p.number.replace("+", "")));
  const vc = el("button", "linkbtn", "📇 vCard");
  vc.addEventListener("click", () => download(p.number + ".vcf", "text/vcard", `BEGIN:VCARD\nVERSION:3.0\nFN:${p.number}\nTEL;TYPE=CELL:${p.number}\nEND:VCARD\n`));
  links.append(vc);
  const cpAll = el("button", "linkbtn", "📋 Copy all");
  cpAll.addEventListener("click", () => copy(summaryText(p), cpAll));
  links.append(cpAll);
  const share = el("button", "linkbtn", "🔗 Share link");
  share.addEventListener("click", () => copy(`${location.origin}${location.pathname}?n=${encodeURIComponent(p.number)}`, share));
  links.append(share);
  act.append(links);

  const qrWrap = el("div", "qr");
  const qrBox = el("div", "qr__box");
  const modes = { Dial: p.getURI(), Contact: `MECARD:TEL:${p.number};;` };
  let mode = "Dial";
  const paint = () => qrBox.replaceChildren(qrCanvas(modes[mode]));
  paint();
  const tog = el("div", "qr__toggle");
  ["Dial", "Contact"].forEach((m) => { const b = el("button", "qr__t" + (m === mode ? " on" : ""), m); b.addEventListener("click", () => { mode = m; tog.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); paint(); }); tog.append(b); });
  const dl = el("button", "qr__dl", "Save PNG");
  dl.addEventListener("click", () => qrCanvas(modes[mode], 8).toBlob((b) => download(`dialcheck-${p.number}.png`, "image/png", b)));
  qrWrap.append(qrBox, tog, dl);
  act.append(qrWrap);
  out.append(act);

  if (p.isValid()) addHistory(p.number);
}

function summaryText(p) {
  const cc = p.country;
  return [
    `Number: ${p.number}`, `Valid: ${p.isValid() ? "yes" : "no"}`,
    `Country: ${regionName(cc)} (${cc}) +${p.countryCallingCode}`,
    `Type: ${TYPE[p.getType()] || p.getType() || "unknown"}`,
    `International: ${p.formatInternational()}`, `National: ${p.formatNational()}`,
    `— analyzed locally with DialCheck`,
  ].join("\n");
}

/* ---------- history ---------- */
const HKEY = "dialcheck:recent";
const getHist = () => { try { return JSON.parse(localStorage.getItem(HKEY)) || []; } catch { return []; } };
function addHistory(e164) {
  let h = getHist().filter((x) => x !== e164); h.unshift(e164); h = h.slice(0, 8);
  try { localStorage.setItem(HKEY, JSON.stringify(h)); } catch {}
  renderHistory();
}
function renderHistory() {
  const h = getHist(), wrap = $("recent"); wrap.replaceChildren();
  if (!h.length) { wrap.hidden = true; return; }
  wrap.hidden = false; wrap.append(el("span", "recent__l", "Recent:"));
  for (const n of h) { const c = el("button", "chip", n); c.addEventListener("click", () => { $("phone").value = n; renderSingle(); }); wrap.append(c); }
  const clr = el("button", "chip chip--clear", "clear");
  clr.addEventListener("click", () => { localStorage.removeItem(HKEY); renderHistory(); });
  wrap.append(clr);
}

/* ---------- bulk mode ---------- */
const bulkLines = () => $("bulk-in").value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
function refreshColumnPicker() {
  const lines = bulkLines();
  const cols = Math.max(0, ...lines.slice(0, 5).map((l) => (l.includes(",") ? l.split(",").length : 0)));
  const wrap = $("bulk-col-wrap"), sel = $("bulk-col");
  if (cols >= 2) { wrap.hidden = false; if (sel.options.length !== cols) { sel.replaceChildren(); for (let i = 0; i < cols; i++) sel.append(new Option("Column " + (i + 1), i)); } }
  else wrap.hidden = true;
}
function runBulk() {
  const region = $("region").value || undefined;
  const colWrap = $("bulk-col-wrap");
  const col = !colWrap.hidden ? +$("bulk-col").value : null;
  let tokens = [];
  for (const line of bulkLines()) {
    if (col != null && line.includes(",")) { const cells = line.split(","); if (cells[col] != null) tokens.push(cells[col].trim()); }
    else tokens.push(...line.split(/[,;\t]+/).map((s) => s.trim()).filter(Boolean));
  }
  tokens = tokens.filter(Boolean);
  let rows = tokens.map((tok) => {
    const p = LP.parsePhoneNumberFromString(tok, region);
    return { input: tok, valid: p ? p.isValid() : false, country: p ? p.country || "" : "",
      type: p ? (TYPE[p.getType()] || p.getType() || "") : "", e164: p ? p.number : "", national: p ? p.formatNational() : "" };
  });
  if ($("bulk-validonly").checked) rows = rows.filter((r) => r.valid);
  if ($("bulk-dedupe").checked) { const seen = new Set(); rows = rows.filter((r) => { const k = r.e164 || r.input; if (seen.has(k)) return false; seen.add(k); return true; }); }

  const host = $("bulk-out"); host.replaceChildren();
  $("bulk-count").textContent = rows.length ? `${rows.filter((r) => r.valid).length}/${rows.length} valid` : "";

  const sum = $("bulk-summary"); sum.replaceChildren();
  const byC = {}; rows.forEach((r) => { if (r.country) byC[r.country] = (byC[r.country] || 0) + 1; });
  Object.entries(byC).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => sum.append(el("span", "cpill", `${flag(c)} ${c} ${n}`)));

  if (!rows.length) return;
  const head = el("div", "brow brow--head");
  ["Input", "Valid", "Country", "Type", "E.164"].forEach((h) => head.append(el("span", null, h)));
  host.append(head);
  for (const r of rows) {
    const row = el("div", "brow");
    row.append(el("span", "mono", r.input));
    row.append(el("span", r.valid ? "ok" : "bad", r.valid ? "✓" : "✕"));
    row.append(el("span", null, r.country ? `${flag(r.country)} ${r.country}` : "—"));
    row.append(el("span", null, r.type || "—"));
    row.append(el("span", "mono", r.e164 || "—"));
    host.append(row);
  }
  $("bulk-export").onclick = () => {
    const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const csv = "input,valid,country,type,e164,national\n" +
      rows.map((r) => [esc(r.input), r.valid, r.country, esc(r.type), r.e164, esc(r.national)].join(",")).join("\n");
    download("dialcheck-export.csv", "text/csv", csv);
  };
}

/* ---------- wiring ---------- */
function fillRegions() {
  const sel = $("region");
  sel.append(new Option("Auto-detect (use +country)", ""));
  for (const cc of COMMON_REGIONS) sel.append(new Option(`${flag(cc)} ${regionName(cc)} (+${LP.getCountryCallingCode(cc)})`, cc));
  sel.value = "IN";
}

let t;
$("phone").addEventListener("input", (e) => {
  const v = $("phone").value;
  if (!(e.inputType || "").startsWith("delete") && $("phone").selectionStart === v.length) {
    const f = new LP.AsYouType($("region").value || undefined).input(v);
    if (f && f.replace(/\D/g, "") === v.replace(/\D/g, "") && f.length >= v.length) $("phone").value = f;
  }
  clearTimeout(t); t = setTimeout(renderSingle, 200);
});
$("region").addEventListener("change", renderSingle);
$("phone").addEventListener("keydown", (e) => { if (e.key === "Enter") renderSingle(); });
$("bulk-run").addEventListener("click", runBulk);
$("bulk-in").addEventListener("input", refreshColumnPicker);
$("bulk-file").addEventListener("change", async (e) => { const f = e.target.files[0]; if (f) { $("bulk-in").value = await f.text(); refreshColumnPicker(); runBulk(); } });

document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === tab));
  $("single").hidden = tab.dataset.mode !== "single";
  $("bulk").hidden = tab.dataset.mode !== "bulk";
}));

(() => {
  try { sessionStorage.setItem("dialcheck:splashed", "1"); } catch {}
  const nav = $("nav"), tg = $("nav-toggle"), lk = $("nav-links");
  if (tg && nav) tg.addEventListener("click", () => tg.setAttribute("aria-expanded", String(nav.classList.toggle("is-open"))));
  if (lk) lk.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("is-open")));
  const y = $("year"); if (y) y.textContent = new Date().getFullYear();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();

fillRegions();
renderHistory();
const pre = new URLSearchParams(location.search).get("n");
if (pre) { $("phone").value = pre; renderSingle(); }
