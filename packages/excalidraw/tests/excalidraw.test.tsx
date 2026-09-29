import { queryByText, queryByTestId } from "@testing-library/react";
import { useMemo } from "react";

import { CODES, THEME } from "@excalidraw/common";

import { t } from "../i18n";
import { Excalidraw, Footer, MainMenu } from "../index";
import { actionExportWithDarkMode } from "../actions/actionExport";
import { actionToggleTheme } from "../actions/actionCanvas";
import { MoonIcon, SunIcon } from "../components/icons";
import * as StaticScene from "../renderer/staticScene";

import { Keyboard } from "./helpers/ui";
import {
  act,
  fireEvent,
  GlobalTestState,
  toggleMenu,
  render,
  waitFor,
} from "./test-utils";

import type { AppState } from "../types";

const { h } = window;

describe("<Excalidraw/>", () => {
  afterEach(() => {
    const menu = document.querySelector(".dropdown-menu");
    if (menu) {
      toggleMenu(document.querySelector(".excalidraw")!);
    }
  });

  describe("Test zenModeEnabled prop", () => {
    it('should show exit zen mode button when zen mode is set and zen mode option in context menu when zenModeEnabled is "undefined"', async () => {
      const { container } = await render(<Excalidraw />);
      expect(
        container.getElementsByClassName("disable-zen-mode--visible").length,
      ).toBe(0);
      expect(h.state.zenModeEnabled).toBe(false);

      fireEvent.contextMenu(GlobalTestState.interactiveCanvas, {
        button: 2,
        clientX: 1,
        clientY: 1,
      });
      const contextMenu = document.querySelector(".context-menu");
      fireEvent.click(queryByText(contextMenu as HTMLElement, "Zen mode")!);
      expect(h.state.zenModeEnabled).toBe(true);
      expect(container.querySelector(".excalidraw")).toHaveClass(
        "excalidraw--zen-mode",
      );
      expect(
        container.getElementsByClassName("disable-zen-mode--visible").length,
      ).toBe(1);
    });

    it("should not show exit zen mode button and zen mode option in context menu when zenModeEnabled is set", async () => {
      const { container } = await render(<Excalidraw zenModeEnabled={true} />);
      expect(
        container.getElementsByClassName("disable-zen-mode--visible").length,
      ).toBe(0);
      expect(h.state.zenModeEnabled).toBe(true);

      fireEvent.contextMenu(GlobalTestState.interactiveCanvas, {
        button: 2,
        clientX: 1,
        clientY: 1,
      });
      const contextMenu = document.querySelector(".context-menu");
      expect(queryByText(contextMenu as HTMLElement, "Zen mode")).toBe(null);
      expect(h.state.zenModeEnabled).toBe(true);
      expect(
        container.getElementsByClassName("disable-zen-mode--visible").length,
      ).toBe(0);
    });
  });

  it("should render the footer only when Footer is passed as children", async () => {
    //Footer not passed hence it will not render the footer
    let { container } = await render(
      <Excalidraw>
        <div>This is a custom footer</div>
      </Excalidraw>,
    );
    expect(container.querySelector(".footer-center")).toBe(null);

    // Footer passed hence it will render the footer
    ({ container } = await render(
      <Excalidraw>
        <Footer>
          <div>This is a custom footer</div>
        </Footer>
      </Excalidraw>,
    ));
    expect(container.querySelector(".footer-center")).toMatchInlineSnapshot(
      `
      <div
        class="footer-center zen-mode-transition"
      >
        <div>
          This is a custom footer
        </div>
      </div>
    `,
    );
  });

  describe("Test gridModeEnabled prop", () => {
    it('should show grid mode in context menu when gridModeEnabled is "undefined"', async () => {
      const { container } = await render(<Excalidraw />);
      expect(h.state.gridModeEnabled).toBe(false);

      expect(
        container.getElementsByClassName("disable-zen-mode--visible").length,
      ).toBe(0);
      fireEvent.contextMenu(GlobalTestState.interactiveCanvas, {
        button: 2,
        clientX: 1,
        clientY: 1,
      });
      const contextMenu = document.querySelector(".context-menu");
      fireEvent.click(queryByText(contextMenu as HTMLElement, "Toggle grid")!);
      expect(h.state.gridModeEnabled).toBe(true);
    });

    it('should not show grid mode in context menu when gridModeEnabled is not "undefined"', async () => {
      const { container } = await render(
        <Excalidraw gridModeEnabled={false} />,
      );
      expect(h.state.gridModeEnabled).toBe(false);

      expect(
        container.getElementsByClassName("disable-zen-mode--visible").length,
      ).toBe(0);
      fireEvent.contextMenu(GlobalTestState.interactiveCanvas, {
        button: 2,
        clientX: 1,
        clientY: 1,
      });
      const contextMenu = document.querySelector(".context-menu");
      expect(queryByText(contextMenu as HTMLElement, "Show grid")).toBe(null);
      expect(h.state.gridModeEnabled).toBe(false);
    });
  });

  describe("Test UIOptions prop", () => {
    describe("Test canvasActions", () => {
      it('should render menu with default items when "UIOPtions" is "undefined"', async () => {
        const { container } = await render(
          <Excalidraw UIOptions={undefined} />,
        );
        //open menu
        toggleMenu(container);
        expect(queryByTestId(container, "dropdown-menu")).toMatchSnapshot();
      });

      it("should hide clear canvas button when clearCanvas is false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { clearCanvas: false } }} />,
        );
        //open menu
        toggleMenu(container);
        expect(queryByTestId(container, "clear-canvas-button")).toBeNull();
      });

      it("should hide export button when export is false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { export: false } }} />,
        );
        //open menu
        toggleMenu(container);
        expect(queryByTestId(container, "json-export-button")).toBeNull();
      });

      it("should hide 'Save as image' button when 'saveAsImage' is false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { saveAsImage: false } }} />,
        );
        //open menu
        toggleMenu(container);
        expect(queryByTestId(container, "image-export-button")).toBeNull();
      });

      it("should hide load button when loadScene is false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { loadScene: false } }} />,
        );

        expect(queryByTestId(container, "load-button")).toBeNull();
      });

      it("should hide save as button when saveFileToDisk is false", async () => {
        const { container } = await render(
          <Excalidraw
            UIOptions={{ canvasActions: { export: { saveFileToDisk: false } } }}
          />,
        );
        //open menu
        toggleMenu(container);
        expect(queryByTestId(container, "save-as-button")).toBeNull();
      });

      it("should hide save button when saveToActiveFile is false", async () => {
        const { container } = await render(
          <Excalidraw
            UIOptions={{ canvasActions: { saveToActiveFile: false } }}
          />,
        );
        //open menu
        toggleMenu(container);
        expect(queryByTestId(container, "save-button")).toBeNull();
      });

      it("should hide the canvas background picker when changeViewBackgroundColor is false", async () => {
        const { container } = await render(
          <Excalidraw
            UIOptions={{ canvasActions: { changeViewBackgroundColor: false } }}
          />,
        );
        //open menu
        toggleMenu(container);
        expect(queryByTestId(container, "canvas-background-label")).toBeNull();
        expect(queryByTestId(container, "canvas-background-picker")).toBeNull();
      });

      it("should hide the canvas background picker even if passed if the `canvasActions.changeViewBackgroundColor` is set to false", async () => {
        const { container } = await render(
          <Excalidraw
            UIOptions={{ canvasActions: { changeViewBackgroundColor: false } }}
          >
            <MainMenu>
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
          </Excalidraw>,
        );
        //open menu
        toggleMenu(container);
        expect(queryByTestId(container, "canvas-background-label")).toBeNull();
        expect(queryByTestId(container, "canvas-background-picker")).toBeNull();
      });

      it("should hide the theme toggle when theme is false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { toggleTheme: false } }} />,
        );
        //open menu
        toggleMenu(container);
        expect(queryByTestId(container, "toggle-dark-mode")).toBeNull();
      });

      it("should not render default items in custom menu even if passed if the prop in `canvasActions` is set to false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { loadScene: false } }}>
            <MainMenu>
              <MainMenu.ItemCustom>
                <button
                  style={{ height: "2rem" }}
                  onClick={() => window.alert("custom menu item")}
                >
                  custom item
                </button>
              </MainMenu.ItemCustom>
              <MainMenu.DefaultItems.LoadScene />
            </MainMenu>
          </Excalidraw>,
        );
        //open menu
        toggleMenu(container);
        // load button shouldn't be rendered since `UIActions.canvasActions.loadScene` is `false`
        expect(queryByTestId(container, "load-button")).toBeNull();
      });
    });
  });

  describe("Test theme prop", () => {
    it("should show the theme toggle by default", async () => {
      const { container } = await render(<Excalidraw />);
      expect(h.state.theme).toBe(THEME.LIGHT);
      //open menu
      toggleMenu(container);
      const darkModeToggle = queryByTestId(container, "toggle-dark-mode");
      expect(darkModeToggle).toBeTruthy();
    });

    it("should not show theme toggle when the theme prop is defined", async () => {
      const { container } = await render(<Excalidraw theme={THEME.DARK} />);

      expect(h.state.theme).toBe(THEME.DARK);
      //open menu
      toggleMenu(container);
      expect(queryByTestId(container, "toggle-dark-mode")).toBe(null);
    });

    it("should show theme mode toggle when `UIOptions.canvasActions.toggleTheme` is true", async () => {
      const { container } = await render(
        <Excalidraw
          theme={THEME.DARK}
          UIOptions={{ canvasActions: { toggleTheme: true } }}
        />,
      );
      expect(h.state.theme).toBe(THEME.DARK);
      //open menu
      toggleMenu(container);
      const darkModeToggle = queryByTestId(container, "toggle-dark-mode");
      expect(darkModeToggle).toBeTruthy();
    });

    it("should not show theme toggle when `UIOptions.canvasActions.toggleTheme` is false", async () => {
      const { container } = await render(
        <Excalidraw
          UIOptions={{ canvasActions: { toggleTheme: false } }}
          theme={THEME.DARK}
        />,
      );
      expect(h.state.theme).toBe(THEME.DARK);
      //open menu
      toggleMenu(container);
      const darkModeToggle = queryByTestId(container, "toggle-dark-mode");
      expect(darkModeToggle).toBe(null);
    });

    it("should sync export theme with the UI theme when there is no session override", async () => {
      await render(<Excalidraw theme={THEME.DARK} />);

      expect(h.state.exportWithDarkMode).toBe(true);

      act(() => {
        h.setState({ exportWithDarkMode: false });
      });

      await waitFor(() => {
        expect(h.state.exportWithDarkMode).toBe(true);
      });
    });

    it("should keep the export theme override for the current session", async () => {
      await render(<Excalidraw theme={THEME.LIGHT} />);

      act(() => {
        (h.app as any).actionManager.executeAction(
          actionExportWithDarkMode,
          "ui",
          true,
        );
      });

      expect(h.app.sessionExportThemeOverride).toBe(THEME.DARK);
      expect(h.state.exportWithDarkMode).toBe(true);

      act(() => {
        h.setState({ theme: THEME.DARK });
      });

      act(() => {
        h.setState({ theme: THEME.LIGHT });
      });

      await waitFor(() => {
        expect(h.state.exportWithDarkMode).toBe(true);
      });
    });
  });

  describe("Test name prop", () => {
    it("should allow editing name", async () => {
      const { container } = await render(<Excalidraw />);
      //open menu
      toggleMenu(container);
      fireEvent.click(queryByTestId(container, "image-export-button")!);
      const textInput: HTMLInputElement | null = document.querySelector(
        ".ImageExportModal .ImageExportModal__preview__filename .TextInput",
      );
      expect(textInput?.value).toContain(`${t("labels.untitled")}`);
      expect(textInput?.nodeName).toBe("INPUT");
    });

    it('should set the name when the name prop is present"', async () => {
      const name = "test";
      const { container } = await render(<Excalidraw name={name} />);
      //open menu
      toggleMenu(container);
      await fireEvent.click(queryByTestId(container, "image-export-button")!);
      const textInput = document.querySelector(
        ".ImageExportModal .ImageExportModal__preview__filename .TextInput",
      ) as HTMLInputElement;
      expect(textInput?.value).toEqual(name);
      expect(textInput?.nodeName).toBe("INPUT");
    });
  });

  describe("Test autoFocus prop", () => {
    it("should not focus when autoFocus is false", async () => {
      const { container } = await render(<Excalidraw />);

      expect(
        container.querySelector(".excalidraw") === document.activeElement,
      ).toBe(false);
    });

    it("should focus when autoFocus is true", async () => {
      const { container } = await render(<Excalidraw autoFocus={true} />);

      expect(
        container.querySelector(".excalidraw") === document.activeElement,
      ).toBe(true);
    });
  });

  describe("<MainMenu/>", () => {
    it("should render main menu with host menu items if passed from host", async () => {
      const { container } = await render(
        <Excalidraw>
          <MainMenu>
            <MainMenu.Item onSelect={() => window.alert("Clicked")}>
              Click me
            </MainMenu.Item>
            <MainMenu.ItemLink href="blog.excalidaw.com">
              Excalidraw blog
            </MainMenu.ItemLink>
            <MainMenu.ItemCustom>
              <button
                style={{ height: "2rem" }}
                onClick={() => window.alert("custom menu item")}
              >
                custom menu item
              </button>
            </MainMenu.ItemCustom>
            <MainMenu.DefaultItems.Help />
          </MainMenu>
        </Excalidraw>,
      );
      //open menu
      toggleMenu(container);
      expect(queryByTestId(container, "dropdown-menu")).toMatchSnapshot();
    });

    it("should update themeToggle text even if MainMenu memoized", async () => {
      const CustomExcalidraw = () => {
        const customMenu = useMemo(() => {
          return (
            <MainMenu>
              <MainMenu.DefaultItems.ToggleTheme allowSystemTheme={false} />
            </MainMenu>
          );
        }, []);

        return <Excalidraw>{customMenu}</Excalidraw>;
      };

      const { container } = await render(<CustomExcalidraw />);
      //open menu
      toggleMenu(container);

      expect(h.state.theme).toBe(THEME.LIGHT);

      expect(
        queryByTestId(container, "toggle-dark-mode")?.textContent,
      ).toContain(t("buttons.darkMode"));

      fireEvent.click(queryByTestId(container, "toggle-dark-mode")!);

      expect(
        queryByTestId(container, "toggle-dark-mode")?.textContent,
      ).toContain(t("buttons.lightMode"));
    });

    it("should show theme toggle when the theme prop and onThemeChange are defined", async () => {
      const onThemeChange = vi.fn();
      const { container } = await render(
        <Excalidraw theme={THEME.DARK} onThemeChange={onThemeChange} />,
      );

      expect(h.state.theme).toBe(THEME.DARK);
      //open menu
      toggleMenu(container);
      const darkModeToggle = queryByTestId(container, "toggle-dark-mode");
      expect(darkModeToggle).toBeTruthy();
    });

    it("should call onThemeChange instead of mutating theme when defined", async () => {
      const onThemeChange = vi.fn();
      const { container } = await render(
        <Excalidraw theme={THEME.LIGHT} onThemeChange={onThemeChange} />,
      );

      //open menu
      toggleMenu(container);
      fireEvent.click(queryByTestId(container, "toggle-dark-mode")!);

      expect(onThemeChange).toHaveBeenCalledWith(THEME.DARK);
      expect(h.state.theme).toBe(THEME.LIGHT);
    });
  });

  describe("Test sepia theme", () => {
    it("should toggle the theme classes on the editor root", async () => {
      const { container } = await render(<Excalidraw theme={THEME.SEPIA} />);
      const root = container.querySelector(".excalidraw")!;

      expect(h.state.theme).toBe(THEME.SEPIA);
      expect(root).toHaveClass("theme--sepia");
      expect(root).not.toHaveClass("theme--dark");

      act(() => {
        h.setState({ theme: THEME.DARK });
      });
      expect(root).toHaveClass("theme--dark");
      expect(root).not.toHaveClass("theme--sepia");

      act(() => {
        h.setState({ theme: THEME.LIGHT });
      });
      expect(root).not.toHaveClass("theme--dark");
      expect(root).not.toHaveClass("theme--sepia");
    });

    it("should toggle the theme classes on portal containers", async () => {
      await render(<Excalidraw theme={THEME.SEPIA} />);

      act(() => {
        h.setState({ openDialog: { name: "help" } });
      });

      const modalContainer = await waitFor(() => {
        const element = document.querySelector(".excalidraw-modal-container");
        expect(element).not.toBeNull();
        return element!;
      });
      expect(modalContainer).toHaveClass("excalidraw", "theme--sepia");
      expect(modalContainer).not.toHaveClass("theme--dark");

      act(() => {
        h.setState({ theme: THEME.DARK });
      });
      expect(modalContainer).toHaveClass("theme--dark");
      expect(modalContainer).not.toHaveClass("theme--sepia");
    });

    it("should export like light mode", async () => {
      await render(<Excalidraw theme={THEME.SEPIA} />);

      expect(h.state.exportWithDarkMode).toBe(false);

      act(() => {
        h.setState({ exportWithDarkMode: true });
      });

      await waitFor(() => {
        expect(h.state.exportWithDarkMode).toBe(false);
      });
    });

    it("should render the grid without dark mode colors", async () => {
      const renderStaticScene = vi.spyOn(StaticScene, "renderStaticScene");

      try {
        await render(<Excalidraw theme={THEME.SEPIA} gridModeEnabled />);

        const sepiaGridRenders = renderStaticScene.mock.calls.filter(
          ([config]) =>
            config.renderConfig.renderGrid &&
            config.renderConfig.theme === THEME.SEPIA,
        );
        expect(sepiaGridRenders.length).toBeGreaterThan(0);
        expect(
          renderStaticScene.mock.results.every(
            (result) => result.type === "return",
          ),
        ).toBe(true);
      } finally {
        renderStaticScene.mockRestore();
      }
    });

    it("should toggle to dark and then light from the main menu", async () => {
      const { container } = await render(<Excalidraw />);

      act(() => {
        h.setState({ theme: THEME.SEPIA });
      });

      toggleMenu(container);
      const getToggle = () => queryByTestId(container, "toggle-dark-mode")!;

      expect(getToggle().textContent).toContain(t("buttons.darkMode"));

      fireEvent.click(getToggle());
      expect(h.state.theme).toBe(THEME.DARK);
      expect(getToggle().textContent).toContain(t("buttons.lightMode"));

      fireEvent.click(getToggle());
      expect(h.state.theme).toBe(THEME.LIGHT);
      expect(getToggle().textContent).toContain(t("buttons.darkMode"));
    });

    it("should toggle to dark and then light with the keyboard shortcut", async () => {
      await render(<Excalidraw handleKeyboardGlobally={true} />);

      act(() => {
        h.setState({ theme: THEME.SEPIA });
      });

      Keyboard.withModifierKeys({ alt: true, shift: true }, () => {
        Keyboard.codeDown(CODES.D);
      });
      expect(h.state.theme).toBe(THEME.DARK);

      Keyboard.withModifierKeys({ alt: true, shift: true }, () => {
        Keyboard.codeDown(CODES.D);
      });
      expect(h.state.theme).toBe(THEME.LIGHT);
    });

    it("should label the toggle theme action as switching to dark mode", async () => {
      await render(<Excalidraw />);

      const getLabelAndIcon = (theme: AppState["theme"]) => {
        const appState = { ...h.state, theme };
        const { label, icon } = actionToggleTheme;
        return [
          typeof label === "function"
            ? label(h.elements, appState, h.app)
            : label,
          typeof icon === "function" ? icon(appState, h.elements) : icon,
        ];
      };

      expect(getLabelAndIcon(THEME.LIGHT)).toEqual([
        "buttons.darkMode",
        MoonIcon,
      ]);
      expect(getLabelAndIcon(THEME.SEPIA)).toEqual([
        "buttons.darkMode",
        MoonIcon,
      ]);
      expect(getLabelAndIcon(THEME.DARK)).toEqual([
        "buttons.lightMode",
        SunIcon,
      ]);
    });

    it("should offer sepia in the theme radio", async () => {
      const onThemeChange = vi.fn();
      const ThemedExcalidraw = ({ theme }: { theme: AppState["theme"] }) => (
        <Excalidraw theme={theme} onThemeChange={onThemeChange}>
          <MainMenu>
            <MainMenu.DefaultItems.ToggleTheme allowSystemTheme theme={theme} />
          </MainMenu>
        </Excalidraw>
      );

      const { container, rerender } = await render(
        <ThemedExcalidraw theme={THEME.LIGHT} />,
      );
      toggleMenu(container);

      const getRadios = () =>
        Array.from(
          container.querySelectorAll<HTMLInputElement>(
            'input[type="radio"][name="theme"]',
          ),
        );

      expect(
        getRadios().map((radio) => radio.getAttribute("aria-label")),
      ).toEqual([
        expect.stringContaining(t("buttons.lightMode")),
        expect.stringContaining(t("buttons.darkMode")),
        t("buttons.sepiaMode"),
        t("buttons.systemMode"),
      ]);
      expect(getRadios()[0].checked).toBe(true);

      fireEvent.click(getRadios()[2]);
      expect(onThemeChange).toHaveBeenCalledWith(THEME.SEPIA);

      rerender(<ThemedExcalidraw theme={THEME.SEPIA} />);

      expect(h.state.theme).toBe(THEME.SEPIA);
      expect(getRadios()[2].checked).toBe(true);
      expect(container.querySelector(".excalidraw")).toHaveClass(
        "theme--sepia",
      );
    });
  });

  it("should apply a custom class name to the editor root", async () => {
    const { container } = await render(
      <Excalidraw className="custom-excalidraw" />,
    );

    expect(container.querySelector(".excalidraw")).toHaveClass(
      "custom-excalidraw",
    );
  });
});
