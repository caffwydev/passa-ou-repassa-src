const express = require("express");
const path = require("path");
const http = require("http");
const fs = require("fs");

const { Server } = require("socket.io");
const { app, BrowserWindow } = require("electron");

const reader = require("./lib/reader");
const pair = require("./lib/pair");

const APP = express();
const server = http.createServer(APP);
const io = new Server(server);

let isOnline = false;

const uploadDir = path.join(__dirname, "upload");

async function initializeUploadDir() {
  try {
    await fs.mkdirSync(uploadDir, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}

APP.use(express.static(path.join(__dirname, "public")));

function initializeSocket() {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    console.log(`Status: ${isOnline}`);
    let StateInterval;
    StateInterval = setInterval(() => {
      socket.emit("info", { paired: isOnline });
    }, 1000);

    socket.on("list-questionaries", async (callback) => {
      callback(await reader());
    });

    socket.emit("info", { paired: false });
    socket.on("disconnected", () => {
      clearInterval(StateInterval);
    });
    socket.on("uploadFile", async (data, callback) => {
      try {
        const filename =
          [...Array(32)]
            .map(() => Math.floor(Math.random() * 16).toString(16))
            .join("") + ".qn";
        fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(data));
        console.log("File uploaded successfully");
        callback({ success: true });
      } catch (error) {
        console.error("Error saving file:", error);
        callback({ success: false });
      }
    });
  });
}
async function createWindow() {
  await app.whenReady();

  const mainWindow = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.setFullScreen(true));
  mainWindow.loadURL("http://127.0.0.1:8080");
}

async function startServer() {
  await initializeUploadDir();
  server.listen(8080, () => console.log("Server running on port 8080"));
  const pairingCore = pair();

  initializeSocket();

  pairingCore.on("button", (btn) => io.sockets.emit("button", btn));
  pairingCore.on("online", (status) => {
    isOnline = status;
    io.sockets.emit("info", { paired: status });
  });
  pairingCore.on("error", console.error);

  await createWindow();
}

startServer().catch((error) => {
  console.error("Initialization error:", error);
  process.exit(1);
});