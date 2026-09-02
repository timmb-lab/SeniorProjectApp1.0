// Compatibility entry for older cached workspace pages.
const workspaceParts = [
  "workspace/loader.js?v=20260902-project-shell-release15",
  "workspace/shared.js?v=20260902-project-shell-release15",
  "workspace/core.js?v=20260902-project-shell-release15",
  "workspace/bootstrap.js?v=20260902-project-shell-release15",
];
for (const part of workspaceParts) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL(part, import.meta.url).href;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${part}`));
    document.head.append(script);
  });
}
