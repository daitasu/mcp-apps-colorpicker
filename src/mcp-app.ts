import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables,
  type McpUiHostContext,
} from "@modelcontextprotocol/ext-apps";
import "./global.css";
import "./mcp-app.css";

// --- Color conversion utilities ---

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1: number, g1: number, b1: number;

  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const r1 = r / 255;
  const g1 = g / 255;
  const b1 = b / 255;
  const max = Math.max(r1, g1, b1);
  const min = Math.min(r1, g1, b1);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r1) h = 60 * (((g1 - b1) / d) % 6);
    else if (max === g1) h = 60 * ((b1 - r1) / d + 2);
    else h = 60 * ((r1 - g1) / d + 4);
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
  );
}

// --- State ---

let currentHue = 0;
let currentSat = 0;
let currentVal = 1;

// --- DOM Elements ---

const mainEl = document.querySelector(".main") as HTMLElement;
const satPanel = document.getElementById("saturation-panel")!;
const satCursor = document.getElementById("saturation-cursor")!;
const hueSlider = document.getElementById("hue-slider") as HTMLInputElement;
const previewSwatch = document.getElementById("preview-swatch")!;
const hexInput = document.getElementById("hex-input") as HTMLInputElement;
const rInput = document.getElementById("r-input") as HTMLInputElement;
const gInput = document.getElementById("g-input") as HTMLInputElement;
const bInput = document.getElementById("b-input") as HTMLInputElement;

// --- UI Update ---

function updateUI() {
  const [r, g, b] = hsvToRgb(currentHue, currentSat, currentVal);
  const hex = rgbToHex(r, g, b);

  // Update swatch
  previewSwatch.style.backgroundColor = hex;

  // Update saturation panel background hue
  satPanel.style.background = `linear-gradient(to right, #fff, hsl(${currentHue}, 100%, 50%))`;

  // Update cursor position
  const cursorX = currentSat * 100;
  const cursorY = (1 - currentVal) * 100;
  satCursor.style.left = `${cursorX}%`;
  satCursor.style.top = `${cursorY}%`;

  // Update inputs
  hexInput.value = hex;
  rInput.value = String(r);
  gInput.value = String(g);
  bInput.value = String(b);

  // Update hue slider
  hueSlider.value = String(Math.round(currentHue));
}

function setFromRgb(r: number, g: number, b: number) {
  [currentHue, currentSat, currentVal] = rgbToHsv(r, g, b);
  updateUI();
}

function setFromHex(hex: string) {
  const rgb = hexToRgb(hex);
  if (rgb) setFromRgb(...rgb);
}

// --- Saturation panel interaction ---

function handleSatPanelPointer(e: PointerEvent) {
  const rect = satPanel.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  currentSat = x;
  currentVal = 1 - y;
  updateUI();
  notifyModelContext();
}

satPanel.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  satPanel.setPointerCapture(e.pointerId);
  handleSatPanelPointer(e);
});

satPanel.addEventListener("pointermove", (e) => {
  if (satPanel.hasPointerCapture(e.pointerId)) {
    handleSatPanelPointer(e);
  }
});

// --- Hue slider ---

hueSlider.addEventListener("input", () => {
  currentHue = Number(hueSlider.value);
  updateUI();
  notifyModelContext();
});

// --- Hex input ---

hexInput.addEventListener("change", () => {
  let val = hexInput.value.trim();
  if (!val.startsWith("#")) val = "#" + val;
  setFromHex(val);
  notifyModelContext();
});

// --- RGB inputs ---

function handleRgbInput() {
  const r = Math.max(0, Math.min(255, Number(rInput.value) || 0));
  const g = Math.max(0, Math.min(255, Number(gInput.value) || 0));
  const b = Math.max(0, Math.min(255, Number(bInput.value) || 0));
  setFromRgb(r, g, b);
  notifyModelContext();
}

rInput.addEventListener("change", handleRgbInput);
gInput.addEventListener("change", handleRgbInput);
bInput.addEventListener("change", handleRgbInput);

// --- MCP App lifecycle ---

function handleHostContextChanged(ctx: McpUiHostContext) {
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
  if (ctx.safeAreaInsets) {
    const { top, right, bottom, left } = ctx.safeAreaInsets;
    mainEl.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;
  }
}

const app = new App({ name: "Color Picker", version: "1.0.0" });

// Keep the model informed of current selected color
function notifyModelContext() {
  const [r, g, b] = hsvToRgb(currentHue, currentSat, currentVal);
  const hex = rgbToHex(r, g, b);
  app.updateModelContext({
    content: [
      {
        type: "text",
        text: `User selected color: ${hex} (rgb: ${r}, ${g}, ${b})`,
      },
    ],
  });
}

// Register handlers BEFORE connecting
app.onteardown = async () => {
  return {};
};

app.ontoolinput = (params) => {
  const args = params.arguments as { color?: string } | undefined;
  if (args?.color) {
    setFromHex(args.color);
  }
};

app.ontoolresult = (result) => {
  const structured = result.structuredContent as { color?: string } | undefined;
  if (structured?.color) {
    setFromHex(structured.color);
  }
};

app.onerror = console.error;
app.onhostcontextchanged = handleHostContextChanged;

// Connect to host
app.connect().then(() => {
  const ctx = app.getHostContext();
  if (ctx) handleHostContextChanged(ctx);
});

// Set initial color
updateUI();
