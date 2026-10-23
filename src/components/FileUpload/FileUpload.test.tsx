import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUpload, formatFileSize } from ".";

const MB = 1024 * 1024;
const makeFile = (name: string, size: number, type: string) => {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};
const dropzone = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-state]")!;
const drop = (el: HTMLElement, files: File[]) => {
  const event = createEvent.drop(el);
  Object.defineProperty(event, "dataTransfer", { value: { files, dropEffect: "none" } });
  fireEvent(el, event);
};

describe("FileUpload / Dropzone", () => {
  it("renders the Idle variant content", () => {
    const { container } = render(<FileUpload />);
    expect(screen.getByText("Attachments")).toBeInTheDocument();
    expect(screen.getByText("Drag & drop files or")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "browse" })).toBeInTheDocument();
    expect(screen.getByText("PNG, JPG or PDF · max 10 MB")).toBeInTheDocument();
    expect(dropzone(container)).toHaveAttribute("data-state", "idle");
    expect(screen.getByLabelText("Attachments")).toHaveAttribute("type", "file");
  });

  it("switches to Drag over while a drag is inside, and back on leave", () => {
    const { container } = render(<FileUpload />);
    const zone = dropzone(container);
    fireEvent.dragEnter(zone);
    expect(zone).toHaveAttribute("data-state", "dragOver");
    expect(screen.getByText("Drop files to upload")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "browse" })).toBeNull();
    fireEvent.dragEnter(zone); // entering a child
    fireEvent.dragLeave(zone);
    expect(zone).toHaveAttribute("data-state", "dragOver");
    fireEvent.dragLeave(zone);
    expect(zone).toHaveAttribute("data-state", "idle");
  });

  it("accepts a valid dropped file", () => {
    const onFilesAccepted = vi.fn();
    const { container } = render(<FileUpload onFilesAccepted={onFilesAccepted} />);
    const zone = dropzone(container);
    fireEvent.dragEnter(zone);
    const file = makeFile("brief.pdf", 2 * MB, "application/pdf");
    drop(zone, [file]);
    expect(onFilesAccepted).toHaveBeenCalledWith([file]);
    expect(zone).toHaveAttribute("data-state", "idle");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the Error variant for a file over the size limit", () => {
    const onFilesAccepted = vi.fn();
    const onFileRejected = vi.fn();
    const { container } = render(
      <FileUpload onFilesAccepted={onFilesAccepted} onFileRejected={onFileRejected} />,
    );
    const big = makeFile("huge.png", 11 * MB, "image/png");
    drop(dropzone(container), [big]);
    expect(onFilesAccepted).not.toHaveBeenCalled();
    expect(onFileRejected).toHaveBeenCalledWith(big, "size");
    expect(screen.getByRole("alert")).toHaveTextContent("File exceeds 10 MB. Try a smaller file.");
    expect(dropzone(container)).toHaveAttribute("data-state", "error");
    expect(screen.getByLabelText("Attachments")).toHaveAttribute("aria-invalid", "true");
  });

  it("rejects file types outside `accept`", async () => {
    const onFileRejected = vi.fn();
    render(<FileUpload onFileRejected={onFileRejected} />);
    const exe = makeFile("setup.exe", 1000, "application/octet-stream");
    await userEvent.upload(screen.getByLabelText("Attachments"), exe, { applyAccept: false });
    expect(onFileRejected).toHaveBeenCalledWith(exe, "type");
    expect(screen.getByRole("alert")).toHaveTextContent("File type not supported.");
  });

  it("accepts files picked with the browse dialog", async () => {
    const onFilesAccepted = vi.fn();
    render(<FileUpload onFilesAccepted={onFilesAccepted} />);
    const png = makeFile("photo.png", 500 * 1024, "image/png");
    await userEvent.upload(screen.getByLabelText("Attachments"), png);
    expect(onFilesAccepted).toHaveBeenCalledWith([png]);
  });

  it("only takes the first file unless `multiple`", () => {
    const onFilesAccepted = vi.fn();
    const { container, rerender } = render(<FileUpload onFilesAccepted={onFilesAccepted} />);
    const a = makeFile("a.png", 10, "image/png");
    const b = makeFile("b.png", 10, "image/png");
    drop(dropzone(container), [a, b]);
    expect(onFilesAccepted).toHaveBeenLastCalledWith([a]);
    rerender(<FileUpload multiple onFilesAccepted={onFilesAccepted} />);
    drop(dropzone(container), [a, b]);
    expect(onFilesAccepted).toHaveBeenLastCalledWith([a, b]);
  });

  it("renders the Uploading row with progress and cancel", async () => {
    const onCancel = vi.fn();
    render(
      <FileUpload
        onCancel={onCancel}
        items={[{ id: "f1", name: "project-brief.pdf", size: 1.2 * MB, status: "uploading", progress: 25 }]}
      />,
    );
    expect(screen.getByText("project-brief.pdf")).toBeInTheDocument();
    expect(screen.getByText("Uploading…")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    await userEvent.click(screen.getByRole("button", { name: "Cancel upload of project-brief.pdf" }));
    expect(onCancel).toHaveBeenCalledWith("f1");
  });

  it("renders the Uploaded row with size, status and remove", async () => {
    const onRemove = vi.fn();
    render(
      <FileUpload
        onRemove={onRemove}
        items={[{ id: "f1", name: "project-brief.pdf", size: 1.2 * MB, status: "uploaded" }]}
      />,
    );
    expect(screen.getByText("1.2 MB · Uploaded")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Uploaded" })).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Remove project-brief.pdf" }));
    expect(onRemove).toHaveBeenCalledWith("f1");
  });

  it("shows an external error and ignores input when disabled", () => {
    const onFilesAccepted = vi.fn();
    const { container, rerender } = render(<FileUpload error="Server unavailable" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Server unavailable");
    rerender(<FileUpload disabled onFilesAccepted={onFilesAccepted} />);
    drop(dropzone(container), [makeFile("a.png", 10, "image/png")]);
    expect(onFilesAccepted).not.toHaveBeenCalled();
  });

  it("formats sizes like the design", () => {
    expect(formatFileSize(1.2 * MB)).toBe("1.2 MB");
    expect(formatFileSize(10 * MB)).toBe("10 MB");
    expect(formatFileSize(2048)).toBe("2 KB");
  });
});
