import { THEME } from "@excalidraw/excalidraw";
import { useEffect, useLayoutEffect, useState } from "react";

import { isMemberOf } from "@excalidraw/common";

import type { Theme } from "@excalidraw/element/types";

import { STORAGE_KEYS } from "./app_constants";

const getDarkThemeMediaQuery = (): MediaQueryList | undefined =>
  window.matchMedia?.("(prefers-color-scheme: dark)");

export const useHandleAppTheme = () => {
  const [appTheme, setAppTheme] = useState<Theme | "system">(() => {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_THEME);
    return storedTheme === "system" ||
      (storedTheme && isMemberOf(Object.values(THEME), storedTheme))
      ? storedTheme
      : THEME.LIGHT;
  });
  const [editorTheme, setEditorTheme] = useState<Theme>(THEME.LIGHT);

  useEffect(() => {
    const mediaQuery = getDarkThemeMediaQuery();

    const handleChange = (e: MediaQueryListEvent) => {
      setEditorTheme(e.matches ? THEME.DARK : THEME.LIGHT);
    };

    if (appTheme === "system") {
      mediaQuery?.addEventListener("change", handleChange);
    }

    return () => {
      mediaQuery?.removeEventListener("change", handleChange);
    };
  }, [appTheme]);

  useLayoutEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE_THEME, appTheme);

    if (appTheme === "system") {
      setEditorTheme(
        getDarkThemeMediaQuery()?.matches ? THEME.DARK : THEME.LIGHT,
      );
    } else {
      setEditorTheme(appTheme);
    }
  }, [appTheme]);

  return { editorTheme, appTheme, setAppTheme };
};
