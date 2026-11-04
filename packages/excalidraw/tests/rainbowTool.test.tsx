import { KEYS, reseed } from "@excalidraw/common";
import {
  getRainbowFreedrawSegments,
  isRainbowFreeDrawElement,
} from "@excalidraw/element";
import { pointFrom } from "@excalidraw/math";

import type { LocalPoint } from "@excalidraw/math";

import type { ExcalidrawFreeDrawElement } from "@excalidraw/element/types";

import { Excalidraw } from "../index";
import { exportToSvg } from "../scene/export";

import { API } from "./helpers/api";
import { Keyboard, Pointer, UI } from "./helpers/ui";
import { act, fireEvent, render, screen } from "./test-utils";

const { h } = window;
const mouse = new Pointer("mouse");

const drawStroke = () => {
  mouse.reset();
  mouse.down(10, 10);
  mouse.move(150, 0);
  mouse.move(150, 80);
  mouse.move(-100, 60);
  mouse.up();
};

describe("rainbow tool", () => {
  beforeEach(async () => {
    reseed(7);
    await render(<Excalidraw handleKeyboardGlobally={true} />);
  });

  afterEach(async () => {
    await act(async () => {});
  });

  it("is activated with Shift+P", () => {
    Keyboard.withModifierKeys({ shift: true }, () => {
      Keyboard.keyPress(KEYS.P);
    });
    expect(h.state.activeTool.type).toBe("rainbow");
  });

  it("is activated from the extra tools menu", () => {
    fireEvent.click(screen.getByTitle("More tools"));
    fireEvent.click(screen.getByTestId("toolbar-rainbow"));
    expect(h.state.activeTool.type).toBe("rainbow");
  });

  it("draws rainbow freedraw elements and stays active", () => {
    act(() => h.app.setActiveTool({ type: "rainbow" }));

    drawStroke();
    drawStroke();

    expect(h.elements).toHaveLength(2);
    for (const element of h.elements) {
      expect(element.type).toBe("freedraw");
      expect(isRainbowFreeDrawElement(element)).toBe(true);
      expect(
        (element as ExcalidrawFreeDrawElement).points.length,
      ).toBeGreaterThan(2);
    }
    expect(h.state.activeTool.type).toBe("rainbow");
  });

  it("regular freedraw elements are not rainbow", () => {
    UI.clickTool("freedraw");
    drawStroke();
    expect(isRainbowFreeDrawElement(h.elements[0])).toBe(false);
  });

  it("hides the stroke color picker for rainbow strokes", () => {
    UI.clickTool("freedraw");
    expect(screen.queryByTestId("color-top-pick-#1e1e1e")).not.toBeNull();

    act(() => h.app.setActiveTool({ type: "rainbow" }));
    expect(screen.queryByTestId("color-top-pick-#1e1e1e")).toBeNull();

    drawStroke();
    act(() => h.app.setActiveTool({ type: "selection" }));
    API.setSelectedElements([...h.app.scene.getNonDeletedElements()]);
    expect(screen.queryByTestId("color-top-pick-#1e1e1e")).toBeNull();
  });

  it("exports rainbow strokes to SVG as clipped multicolor segments", async () => {
    act(() => h.app.setActiveTool({ type: "rainbow" }));
    drawStroke();

    const svg = await exportToSvg(
      h.app.scene.getNonDeletedElements(),
      { exportBackground: false, viewBackgroundColor: "#fff" },
      {},
    );

    const clipPath = svg.querySelector("clipPath[id^='rainbow-clipPath-']");
    expect(clipPath).not.toBeNull();
    const group = svg.querySelector(`g[clip-path='url(#${clipPath!.id})']`)!;
    const colors = new Set(
      Array.from(group.querySelectorAll("line")).map((line) =>
        line.getAttribute("stroke"),
      ),
    );
    expect(colors.size).toBeGreaterThan(2);
  });

  it("cycles colors along long segments between sparse input points", () => {
    const element = API.createElement({
      type: "freedraw",
      points: [pointFrom<LocalPoint>(0, 0), pointFrom<LocalPoint>(400, 0)],
    });

    const { segments } = getRainbowFreedrawSegments(element);
    const colors = new Set(segments.map((segment) => segment.color));
    expect(colors.size).toBeGreaterThan(30);
    for (const { from, to } of segments) {
      expect(Math.hypot(to[0] - from[0], to[1] - from[1])).toBeLessThanOrEqual(
        5.0001,
      );
    }
  });
});
