"use strict";

function haFavicon(html) {
  const s = String(html || "");

  return (
    /<link[^>]+rel=["'](?:shortcut\s+)?icon["']/i.test(s) ||
    /<link[^>]+rel=["']apple-touch-icon["']/i.test(s)
  );
}

function insertarFavicon(html) {
  if (!html || typeof html !== "string") {
    return html;
  }

  if (!/<html[\s>]/i.test(html)) {
    return html;
  }

  if (!/<head[\s>]/i.test(html)) {
    return html;
  }

  if (haFavicon(html)) {
    return html;
  }

  const favicon = [
    '<link rel="icon" href="/favicon.ico" sizes="any">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/app/assets/favicon-32x32.png">',
    '<link rel="icon" type="image/png" sizes="192x192" href="/app/assets/favicon-192x192.png">',
    '<link rel="icon" type="image/png" sizes="512x512" href="/app/assets/favicon-512x512.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="/app/assets/apple-touch-icon.png">'
  ].join("\n");

  if (/<\/head>/i.test(html)) {
    return html.replace(
      /<\/head>/i,
      favicon + "\n</head>"
    );
  }

  return html;
}

module.exports = function faviconGlobalMiddleware() {
  return function(req, res, next) {
    if (req.method !== "GET") {
      return next();
    }

    const originalSend = res.send.bind(res);

    res.send = function(body) {
      return originalSend(
        insertarFavicon(body)
      );
    };

    return next();
  };
};

module.exports.insertarFavicon = insertarFavicon;
