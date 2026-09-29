import { THEME } from "@excalidraw/excalidraw";
import { render } from "@testing-library/react";

import { STORAGE_KEYS } from "../app_constants";
import { useHandleAppTheme } from "../useHandleAppTheme";

const renderAppTheme = () => {
  const result: { current?: ReturnType<typeof useHandleAppTheme> } = {};
  const ThemeProbe = () => {
    result.current = useHandleAppTheme();
    return null;
  };
  render(<ThemeProbe />);
  return result.current!;
};

describe("useHandleAppTheme", () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEYS.LOCAL_STORAGE_THEME);
  });

  it("should restore the persisted sepia theme", () => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE_THEME, THEME.SEPIA);

    const { appTheme, editorTheme } = renderAppTheme();

    expect(appTheme).toBe(THEME.SEPIA);
    expect(editorTheme).toBe(THEME.SEPIA);
  });

  it("should fall back to light for unknown persisted themes", () => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE_THEME, "midnight");

    const { appTheme, editorTheme } = renderAppTheme();

    expect(appTheme).toBe(THEME.LIGHT);
    expect(editorTheme).toBe(THEME.LIGHT);
    expect(localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_THEME)).toBe(
      THEME.LIGHT,
    );
  });
});
