import { KEYS, reseed } from "@excalidraw/common";
import {
  getFreedrawOutlinePoints,
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

  it.each(["constant", "variable"] as const)(
    "segments cover the whole rendered %s-width outline",
    (variability) => {
      // sparse points along a half circle
      const points = Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 7) * Math.PI;
        return pointFrom<LocalPoint>(
          200 - 200 * Math.cos(angle),
          200 * Math.sin(angle),
        );
      });
      const element = API.createElement({
        type: "freedraw",
        points,
        strokeOptions: { variability, streamline: 0.5 },
      });
      const { segments, width } = getRainbowFreedrawSegments(element);

      const distanceToSegments = ([x, y]: number[]) =>
        Math.min(
          ...segments.map(({ from, to }) => {
            const dx = to[0] - from[0];
            const dy = to[1] - from[1];
            const t = Math.max(
              0,
              Math.min(
                1,
                ((x - from[0]) * dx + (y - from[1]) * dy) /
                  (dx * dx + dy * dy || 1),
              ),
            );
            return Math.hypot(x - from[0] - t * dx, y - from[1] - t * dy);
          }),
        );

      // the outline is rendered as quadratic curves through the midpoints of
      // its vertices (see `getSvgPathFromStroke`)
      const outline = getFreedrawOutlinePoints(element);
      const mid = (a: number[], b: number[]) => [
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2,
      ];
      for (let i = 0; i < outline.length; i++) {
        const start = mid(outline.at(i - 1)!, outline[i]);
        const control = outline[i];
        const end = mid(outline[i], outline[(i + 1) % outline.length]);
        for (let t = 0; t <= 1; t += 0.25) {
          const point = [0, 1].map(
            (axis) =>
              (1 - t) ** 2 * start[axis] +
              2 * (1 - t) * t * control[axis] +
              t * t * end[axis],
          );
          expect(distanceToSegments(point)).toBeLessThanOrEqual(width / 2);
        }
      }
    },
  );
});
