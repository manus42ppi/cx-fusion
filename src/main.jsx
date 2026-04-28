import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import { CSS } from "./constants/colors.js";

const style = document.createElement("style");
style.textContent = CSS;
document.head.appendChild(style);

// Same Clerk account as SocialFlow Pro
const PUBLISHABLE_KEY = "pk_test_ZW5nYWdpbmctYWxwYWNhLTYxLmNsZXJrLmFjY291bnRzLmRldiQ";

createRoot(document.getElementById("root")).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
