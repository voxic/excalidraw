import { THEME, isDarkTheme, isTheme } from "@excalidraw/common";

describe("theme helpers", () => {
  it("isDarkTheme() is true only for the dark theme", () => {
    expect(isDarkTheme(THEME.DARK)).toBe(true);
    expect(isDarkTheme(THEME.LIGHT)).toBe(false);
    expect(isDarkTheme(THEME.SEPIA)).toBe(false);
    expect(isDarkTheme(undefined)).toBe(false);
    expect(isDarkTheme(null)).toBe(false);
  });

  it("isTheme() accepts known themes and rejects everything else", () => {
    expect(isTheme(THEME.LIGHT)).toBe(true);
    expect(isTheme(THEME.DARK)).toBe(true);
    expect(isTheme(THEME.SEPIA)).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme("midnight")).toBe(false);
    expect(isTheme(42)).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });
});
