import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FileUpload, type UploadItem } from "./components/FileUpload";
import {
  Sidebar,
  analyticsIcon,
  documentsIcon,
  homeIcon,
  insightsIcon,
  integrationsIcon,
  plansIcon,
  settingsIcon,
  teamIcon,
  type SidebarNavItem,
} from "./components/Sidebar";
import {
  TabBar,
  dashboardSquare01Icon,
  folder01Icon,
  libraryIcon,
  moreHorizontalIcon,
  settings01Icon,
  workflowSquare01Icon,
  type TabBarItem,
} from "./components/TabBar";

// Mirrors the instance content of Figma node 580:1841 (Tab Bar / Style=Icon Tabs).
const tabItems: TabBarItem[] = [
  { value: "overview", label: "Overview", icon: dashboardSquare01Icon },
  { value: "workflows", label: "Workflows", icon: workflowSquare01Icon },
  { value: "knowledge", label: "Knowledge", icon: libraryIcon },
  { value: "files", label: "Files", icon: folder01Icon },
  { value: "settings", label: "Settings", icon: settings01Icon },
  { value: "more", label: "More", icon: moreHorizontalIcon, chevron: true },
];

const MB = 1024 * 1024;

// Mirrors the content of the Sidebar instances in Figma frame 1501:4459 ("Left nav").
const sidebarSections: SidebarNavItem[][] = [
  [
    { id: "overview", label: "Overview", icon: homeIcon },
    { id: "documents", label: "Documents", icon: documentsIcon },
    { id: "analytics", label: "Analytics", icon: analyticsIcon, badge: "New" },
    { id: "insights", label: "Insights", icon: insightsIcon },
    { id: "plans", label: "Plans", icon: plansIcon },
  ],
  [
    { id: "team", label: "Team", icon: teamIcon },
    { id: "integrations", label: "Integrations", icon: integrationsIcon },
    { id: "settings", label: "Settings", icon: settingsIcon },
  ],
];
const sidebarUser = { name: "Syed Hafeez", plan: "Enterprise", initials: "SH" };
// Backdrop colour of the Figma frame (not a design token).
const leftNavBackdrop = "#edeaff";

/** Same layout as Figma frame 1501:4459: Expanded at (60, 54), Collapsed at (356, 54). */
function SidebarGallery() {
  return (
    <div
      data-testid="sidebar-gallery"
      style={{ position: "relative", width: 495, height: 868, background: leftNavBackdrop }}
    >
      <div data-testid="sidebar-expanded" style={{ position: "absolute", left: 60, top: 54, height: 760 }}>
        <Sidebar sections={sidebarSections} user={sidebarUser} aria-label="Main (expanded)" />
      </div>
      <div data-testid="sidebar-collapsed" style={{ position: "absolute", left: 356, top: 54, height: 760 }}>
        <Sidebar sections={sidebarSections} user={sidebarUser} defaultCollapsed aria-label="Main (collapsed)" />
      </div>
    </div>
  );
}

/** Working example: click items to change the active page, use the double-arrow to collapse/expand. */
function SidebarDemo() {
  const [active, setActive] = useState("overview");
  return (
    <div
      data-testid="sidebar-demo"
      style={{ display: "flex", gap: 24, alignItems: "stretch", height: 760, padding: 24, background: leftNavBackdrop }}
    >
      <Sidebar
        sections={sidebarSections}
        user={sidebarUser}
        activeId={active}
        onNavigate={(id, event) => {
          event.preventDefault();
          setActive(id);
        }}
        aria-label="Main (demo)"
      />
      <p style={{ ...sectionTitle, alignSelf: "center", color: "var(--color-text-primary)" }}>
        Active page: <strong data-testid="sidebar-demo-active">{active}</strong>
      </p>
    </div>
  );
}

/** Places a variant at its x/y inside the Figma component-set frame (330:10272). */
function At({ x, y, id, children }: { x: number; y: number; id: string; children: ReactNode }) {
  const style: CSSProperties = { position: "absolute", left: x, top: y, width: 480 };
  return (
    <div data-testid={id} style={style}>
      {children}
    </div>
  );
}

/** Puts the wrapped dropzone into its drag-over state by dispatching a real dragenter. */
function DraggingOver({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current
      ?.querySelector("[data-state]")
      ?.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true }));
  }, []);
  return <div ref={ref}>{children}</div>;
}

function FileUploadGallery() {
  return (
    <div
      data-testid="fileupload-gallery"
      style={{ position: "relative", width: 1056, height: 710, background: "var(--color-bg-default)" }}
    >
      <At id="variant-idle" x={24} y={24}>
        <FileUpload />
      </At>
      <At id="variant-drag-over" x={552} y={24}>
        <DraggingOver>
          <FileUpload />
        </DraggingOver>
      </At>
      <At id="variant-uploading" x={24} y={224}>
        <FileUpload
          items={[{ id: "1", name: "project-brief.pdf", size: 1.2 * MB, status: "uploading", progress: 25 }]}
        />
      </At>
      <At id="variant-uploaded" x={552} y={224}>
        <FileUpload items={[{ id: "1", name: "project-brief.pdf", size: 1.2 * MB, status: "uploaded" }]} />
      </At>
      <At id="variant-error" x={24} y={504}>
        <FileUpload error="File exceeds 10 MB. Try a smaller file." />
      </At>
    </div>
  );
}

/** Working example: accepted files "upload" with simulated progress. */
function FileUploadDemo() {
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

  return (
    <div data-testid="fileupload-demo">
      <FileUpload multiple items={items} onFilesAccepted={start} onCancel={drop} onRemove={drop} />
    </div>
  );
}

export function App() {
  return (
    <main style={{ padding: 24, display: "grid", gap: 48, justifyItems: "start" }}>
      <section>
        <h2 style={sectionTitle}>Tab Bar · Icon Tabs</h2>
        <div data-testid="tabbar-frame" style={{ display: "inline-block" }}>
          <TabBar items={tabItems} defaultValue="overview" aria-label="Workspace sections" />
        </div>
      </section>
      <section>
        <h2 style={sectionTitle}>Sidebar · Glass — Expanded &amp; Collapsed</h2>
        <SidebarGallery />
      </section>
      <section>
        <h2 style={sectionTitle}>Sidebar · Glass — try it</h2>
        <SidebarDemo />
      </section>
      <section>
        <h2 style={sectionTitle}>File Upload · Dropzone — variants</h2>
        <FileUploadGallery />
      </section>
      <section>
        <h2 style={sectionTitle}>File Upload · Dropzone — try it</h2>
        <FileUploadDemo />
      </section>
    </main>
  );
}

const sectionTitle: CSSProperties = {
  margin: "0 0 16px",
  font: "600 14px/20px var(--font-family-primary), sans-serif",
  color: "var(--color-text-secondary)",
};
