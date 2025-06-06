import { app, Tray, Menu, nativeImage } from "electron";
import * as path from "path";
import fetch from "node-fetch";
(globalThis as any).fetch = fetch;

let tray: Tray | null = null;

const GITHUB_OWNER = "rassi0429";
const GITHUB_REPO = "";
const GITHUB_TOKEN = "ghp_xxx"; // 個人アクセストークン

async function fetchLatestWorkflowStatus(): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?per_page=1`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  if (!res.ok) return "取得失敗";
  const data = await res.json() as { workflow_runs: any[] };
  if (!data.workflow_runs || data.workflow_runs.length === 0) return "No runs";
  const run = data.workflow_runs[0];
  return `${run.name}: ${run.status} (${run.conclusion || "進行中"})`;
}

async function createTray() {
  // デフォルトアイコン（Electronのデフォルトアイコンを利用、後で差し替え可）
  const iconPath = path.join(__dirname, "icon.png");
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon.isEmpty() ? iconPath : icon);

  let status = "取得中...";
  try {
    status = await fetchLatestWorkflowStatus();
  } catch (e) {
    status = "取得失敗";
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: "最新状況を再取得", click: async () => {
      tray?.setToolTip("再取得中...");
      const s = await fetchLatestWorkflowStatus();
      tray?.setToolTip(s);
    }},
    { label: "終了", click: () => app.quit() }
  ]);
  tray.setToolTip(status);
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(createTray);

app.on("window-all-closed", (e: Electron.Event) => {
  // ウィンドウは使わないので何もしない
  e.preventDefault();
});
