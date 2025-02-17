"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export function ClientDndProvider({ children }) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}
