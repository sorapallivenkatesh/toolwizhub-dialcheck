# DialCheck — inspect any phone number, privately

A privacy-first web tool that validates and analyzes phone numbers **100% in your
browser** — country, line type, every format, local time, call/SMS/WhatsApp links,
QR, and vCard. Bulk mode cleans a whole list and exports CSV. Nothing is uploaded.

> DialCheck never looks up a person's identity ("who owns this number") and never does
> a live carrier lookup — there's no data source for the first, and the second needs
> a paid HLR service. It only reports what's derivable offline from the number itself.

## Run
```
npm run site    # http://localhost:8094
```

## Layout
```
index.html        app shell (single + bulk modes)
css/styles.css    ToolWizHub house theme
js/app.js         parse → render (formats, anatomy, time zone, links, QR, vCard, CSV)
js/data.js        country → time-zone map
lib/              vendored libphonenumber-js + qrcode-generator (no build step)
privacy.html · robots.txt · sitemap.xml
```

Part of [ToolWizHub](https://toolwizhub.com).
