import type { Preview } from "@storybook/react-vite";
// Same design tokens (and Plus Jakarta Sans) the app loads in src/main.tsx.
import "../src/tokens/index.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { expanded: true },
  },
};

export default preview;
