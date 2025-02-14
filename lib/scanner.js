const { SerialPort } = require("serialport");
const fs = require("fs/promises");

let arduinoList = ["2341", "1a86", "2a03"];

const canAccess = async (path) => {
  if (process.platform === "win32") return true;
  try {
    await fs.access(path, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  scanPOR: async () => {
    const ports = await SerialPort.list();
    const accessible = await Promise.all(
      ports.map(async (port) => ({
        ...port,
        accessible: await canAccess(port.path),
      }))
    );

    return accessible.filter(
      (port) =>
        port.accessible &&
        port.manufacturer &&
        (port.manufacturer.includes("Arduino") ||
          arduinoList.includes(port.vendorId?.toLowerCase()))
    );
  },
};
