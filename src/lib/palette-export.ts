import type { Color } from "./types";

export function exportAsCSS(colors: Color[], paintingTitle: string): string {
  const lines = colors.map(
    (c, i) =>
      `  --color-${i + 1}: ${c.hex.toUpperCase()}; /* ${c.name} (${c.role}) */`
  );
  return `/* ${paintingTitle} — ChromaMasters Palette */\n:root {\n${lines.join("\n")}\n}`;
}

export function exportAsTailwind(
  colors: Color[],
  paintingTitle: string
): string {
  const entries = colors
    .map(
      (c, i) =>
        `        '${c.role}-${i + 1}': '${c.hex.toUpperCase()}', // ${c.name}`
    )
    .join("\n");
  return `// ${paintingTitle} — ChromaMasters Palette\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n${entries}\n        },\n      },\n    },\n  },\n};`;
}

export function exportAsPNG(
  colors: Color[],
  paintingTitle: string
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const w = 800;
    const h = 200;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    const swatchWidth = w / colors.length;

    colors.forEach((color, i) => {
      ctx.fillStyle = color.hex;
      ctx.fillRect(i * swatchWidth, 0, swatchWidth, h - 40);

      // Label
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(i * swatchWidth, h - 40, swatchWidth, 40);
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        color.hex.toUpperCase(),
        i * swatchWidth + swatchWidth / 2,
        h - 20
      );
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillStyle = "#666666";
      ctx.fillText(
        color.name,
        i * swatchWidth + swatchWidth / 2,
        h - 6
      );
    });

    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

export function exportAsASE(
  colors: Color[],
  paintingTitle: string
): ArrayBuffer {
  // ASE (Adobe Swatch Exchange) binary format
  const encoder = new TextEncoder();

  // Calculate size
  const titleBytes = encoder.encode(paintingTitle);
  const colorEntries: { name: Uint8Array; r: number; g: number; b: number }[] =
    [];

  for (const color of colors) {
    const nameStr = `${color.name} (${color.hex.toUpperCase()})`;
    colorEntries.push({
      name: encoder.encode(nameStr),
      r: parseInt(color.hex.slice(1, 3), 16) / 255,
      g: parseInt(color.hex.slice(3, 5), 16) / 255,
      b: parseInt(color.hex.slice(5, 7), 16) / 255,
    });
  }

  // ASE format:
  // Header: "ASEF" (4 bytes) + version (4 bytes) + block count (4 bytes)
  // Each color block: type (2) + block length (4) + name length (2) + name (UTF-16BE) + null (2) + color model (4) + values (12 for RGB) + color type (2)
  const blockCount = colors.length;

  // Calculate total size
  let totalSize = 12; // header
  for (const entry of colorEntries) {
    const nameLen = entry.name.length + 1; // +1 for null terminator
    const blockLen = 2 + nameLen * 2 + 4 + 12 + 2; // name length field + name (UTF-16) + color model + RGB floats + type
    totalSize += 2 + 4 + blockLen; // block type + block length + content
  }

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // "ASEF" signature
  view.setUint8(offset++, 0x41); // A
  view.setUint8(offset++, 0x53); // S
  view.setUint8(offset++, 0x45); // E
  view.setUint8(offset++, 0x46); // F

  // Version 1.0
  view.setUint16(offset, 1);
  offset += 2;
  view.setUint16(offset, 0);
  offset += 2;

  // Block count
  view.setUint32(offset, blockCount);
  offset += 4;

  // Color entries
  for (const entry of colorEntries) {
    // Block type: 0x0001 = Color Entry
    view.setUint16(offset, 0x0001);
    offset += 2;

    const nameLen = entry.name.length + 1;
    const blockLen = 2 + nameLen * 2 + 4 + 12 + 2;

    // Block length
    view.setUint32(offset, blockLen);
    offset += 4;

    // Name length (in UTF-16 characters, including null)
    view.setUint16(offset, nameLen);
    offset += 2;

    // Name in UTF-16BE
    for (let i = 0; i < entry.name.length; i++) {
      view.setUint16(offset, entry.name[i]);
      offset += 2;
    }
    // Null terminator
    view.setUint16(offset, 0);
    offset += 2;

    // Color model: "RGB "
    view.setUint8(offset++, 0x52); // R
    view.setUint8(offset++, 0x47); // G
    view.setUint8(offset++, 0x42); // B
    view.setUint8(offset++, 0x20); // space

    // RGB values as floats
    view.setFloat32(offset, entry.r);
    offset += 4;
    view.setFloat32(offset, entry.g);
    offset += 4;
    view.setFloat32(offset, entry.b);
    offset += 4;

    // Color type: 0 = Global
    view.setUint16(offset, 0);
    offset += 2;
  }

  return buffer;
}

export function downloadBlob(blob: Blob | ArrayBuffer, filename: string) {
  const url = URL.createObjectURL(
    blob instanceof Blob ? blob : new Blob([blob])
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  downloadBlob(blob, filename);
}

/**
 * Export a side-by-side PNG showing the user's image alongside the extracted palette.
 * Used for the Extract feature — useful for social sharing.
 */
export function exportSideBySidePNG(
  imageCanvas: HTMLCanvasElement,
  colors: Color[],
  title: string
): Promise<Blob> {
  return new Promise((resolve) => {
    const paletteStripWidth = 200;
    const w = imageCanvas.width + paletteStripWidth;
    const h = Math.max(imageCanvas.height, 400);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Dark background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    // Draw the user's image on the left, centered vertically
    const imgY = Math.round((h - imageCanvas.height) / 2);
    ctx.drawImage(imageCanvas, 0, imgY);

    // Draw palette strip on the right
    const stripX = imageCanvas.width;
    const swatchH = (h - 40) / colors.length;

    colors.forEach((color, i) => {
      ctx.fillStyle = color.hex;
      ctx.fillRect(stripX, i * swatchH, paletteStripWidth, swatchH);

      // Hex label inside each swatch
      const lum = parseInt(color.hex.slice(1, 3), 16) * 0.299 +
        parseInt(color.hex.slice(3, 5), 16) * 0.587 +
        parseInt(color.hex.slice(5, 7), 16) * 0.114;
      ctx.fillStyle = lum > 128 ? "#1a1a1a" : "#f5f5f5";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        color.hex.toUpperCase(),
        stripX + paletteStripWidth / 2,
        i * swatchH + swatchH / 2 + 4
      );
    });

    // Footer with title
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, h - 40, w, 40);
    ctx.fillStyle = "#999";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `${title} — ChromaMasters Palette`,
      w / 2,
      h - 16
    );

    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}
