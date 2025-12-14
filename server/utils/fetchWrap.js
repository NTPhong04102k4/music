async function fetchWrap(...args) {
  if (typeof global !== "undefined" && typeof global.fetch === "function") {
    return global.fetch(...args);
  }
  // Fallback for Node < 18
  const mod = await import("node-fetch");
  const fetchFn = mod.default || mod;
  return fetchFn(...args);
}

module.exports = { fetchWrap };
