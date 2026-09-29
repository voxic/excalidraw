import { THEME } from "@excalidraw/excalidraw";
import { cleanup, render } from "@testing-library/react";

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

const mockPrefersDarkColorScheme = (matches: boolean) => {
  window.matchMedia = ((query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList)) as typeof window.matchMedia;
};

describe("useHandleAppTheme", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEYS.LOCAL_STORAGE_THEME);
    window.matchMedia = originalMatchMedia;
    cleanup();
  });

  it("should resolve the system theme only to light or dark", () => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE_THEME, "system");

    mockPrefersDarkColorScheme(true);
    expect(renderAppTheme()).toMatchObject({
      appTheme: "system",
      editorTheme: THEME.DARK,
    });
    cleanup();

    mockPrefersDarkColorScheme(false);
    expect(renderAppTheme()).toMatchObject({
      appTheme: "system",
      editorTheme: THEME.LIGHT,
    });
    expect(localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_THEME)).toBe(
      "system",
    );
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
