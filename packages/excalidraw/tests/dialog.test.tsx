import { t } from "../i18n";
import { Excalidraw } from "../index";

import { API } from "./helpers/api";
import { render, waitFor } from "./test-utils";

const getModal = () => document.querySelector<HTMLElement>(".Modal")!;

describe("Dialog accessible name", () => {
  it("points aria-labelledby at the rendered title", async () => {
    await render(<Excalidraw />);

    API.setAppState({ openDialog: { name: "help" } });

    await waitFor(() => expect(getModal()).not.toBeNull());

    const modal = getModal();
    const labelledBy = modal.getAttribute("aria-labelledby");
    const title = document.querySelector<HTMLElement>("h2.Dialog__title")!;

    expect(title).not.toBeNull();
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toBe(title);
    expect(modal.getAttribute("aria-label")).toBeNull();
  });

  it("falls back to aria-label when no title is rendered", async () => {
    await render(<Excalidraw />);

    API.setAppState({ openDialog: { name: "imageExport" } });

    await waitFor(() => expect(getModal()).not.toBeNull());

    const modal = getModal();

    expect(document.querySelector("h2.Dialog__title")).toBeNull();
    expect(modal.getAttribute("aria-labelledby")).toBeNull();
    expect(modal.getAttribute("aria-label")).toBe(
      t("imageExportDialog.header"),
    );
  });
});
