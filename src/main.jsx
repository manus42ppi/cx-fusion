import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { CSS } from "./constants/colors.js";

const style = document.createElement("style");
style.textContent = CSS;
document.head.appendChild(style);

createRoot(document.getElementById("root")).render(<App />);
