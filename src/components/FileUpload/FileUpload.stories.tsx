import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FileUpload, type UploadItem } from ".";

const MB = 1024 * 1024;

const meta = {
  title: "Components/File Upload",
  component: FileUpload,
  args: {
    label: "Attachments",
    hint: "PNG, JPG or PDF · max 10 MB",
    accept: ".png,.jpg,.jpeg,.pdf",
    maxSize: 10 * MB,
    multiple: false,
    disabled: false,
  },
  argTypes: {
    maxSize: { control: "number", description: "Bytes" },
    error: { control: "text" },
    onFilesAccepted: { action: "filesAccepted" },
    onFileRejected: { action: "fileRejected" },
    onCancel: { action: "cancel" },
    onRemove: { action: "remove" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "File Upload / Dropzone (Figma 330:10272). Variants: Idle, Drag over, Uploading, Uploaded, Error.",
      },
    },
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

/** Puts the wrapped dropzone into its Drag over state by dispatching a real dragenter. */
function DraggingOver({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current
      ?.querySelector("[data-state]")
      ?.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true }));
  }, []);
  return <div ref={ref}>{children}</div>;
}

export const DragOver: Story = {
  render: (args) => (
    <DraggingOver>
      <FileUpload {...args} />
    </DraggingOver>
  ),
};

export const Uploading: Story = {
  args: { items: [{ id: "1", name: "project-brief.pdf", size: 1.2 * MB, status: "uploading", progress: 25 }] },
};

export const Uploaded: Story = {
  args: { items: [{ id: "1", name: "project-brief.pdf", size: 1.2 * MB, status: "uploaded" }] },
};

export const ErrorState: Story = {
  name: "Error",
  args: { error: "File exceeds 10 MB. Try a smaller file." },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Drop or browse for real files: accepted ones "upload" with simulated progress. */
export const TryIt: Story = {
  args: { multiple: true },
  render: (args) => {
    const [items, setItems] = useState<UploadItem[]>([]);
    const timers = useRef(new Map<string, number>());
    useEffect(() => () => timers.current.forEach((t) => clearInterval(t)), []);

    const start = (files: File[]) => {
      for (const file of files) {
        const id = `${file.name}-${Date.now()}`;
        setItems((prev) => [...prev, { id, name: file.name, size: file.size, status: "uploading", progress: 0 }]);
        const timer = window.setInterval(() => {
          setItems((prev) =>
            prev.map((item) => {
              if (item.id !== id) return item;
              const progress = (item.progress ?? 0) + 10;
              if (progress >= 100) {
                clearInterval(timers.current.get(id));
                return { ...item, status: "uploaded", progress: 100 };
              }
              return { ...item, progress };
            }),
          );
        }, 150);
        timers.current.set(id, timer);
      }
    };
    const drop = (id: string) => {
      clearInterval(timers.current.get(id));
      setItems((prev) => prev.filter((item) => item.id !== id));
    };

    return <FileUpload {...args} items={items} onFilesAccepted={start} onCancel={drop} onRemove={drop} />;
  },
};
