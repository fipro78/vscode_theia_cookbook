import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Person from "./Person.tsx";
import Pet from "./Pet.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>
);

// eslint-disable-next-line react-refresh/only-export-components
function RootComponent() {
  const currentPath = document.documentElement.getAttribute("data-root");
  if (currentPath === "person-root") {
    return <Person />;
  } else if (currentPath === "pet-root") {
    return <Pet />;
  }
}
