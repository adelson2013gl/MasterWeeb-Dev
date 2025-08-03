
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// SEGURANÇA CRÍTICA: Inicializar gerenciador de segurança antes de qualquer outra coisa
import './lib/supabaseSecurityManager';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
