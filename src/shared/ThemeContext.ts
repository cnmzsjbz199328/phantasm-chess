import { createContext, useContext } from "react";
import type { SceneTheme } from "./themes";
import { THEMES } from "./themes";

export const ThemeContext = createContext<SceneTheme>(THEMES[0]);
export const useTheme = () => useContext(ThemeContext);
