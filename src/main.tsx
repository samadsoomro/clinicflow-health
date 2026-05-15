import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Prevent PWA install prompt completely
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
});
