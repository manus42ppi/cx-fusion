// jsdom doesn't provide window.location by default — set a base
Object.defineProperty(window, "location", {
  value: { hash: "", pathname: "/", href: "http://localhost/" },
  writable: true,
});
