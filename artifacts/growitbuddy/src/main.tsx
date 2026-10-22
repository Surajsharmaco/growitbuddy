import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import { API_BASE } from "./lib/api";
import "./index.css";

setBaseUrl(API_BASE.replace(/\/api\/?$/, "") || null);

createRoot(document.getElementById("root")!).render(<App />);
