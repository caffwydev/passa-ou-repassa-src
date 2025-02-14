const EventEmitter = require('events');
const arduinoScanner = require("./scanner");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pair() {
  const emitter = new EventEmitter();
  
  (async () => {
    while (true) {
      try {
        const arduinos = await arduinoScanner.scanPOR();
        
        if (arduinos.length === 0) {
          emitter.emit("error", "No arduino found!")
          await wait(1000);
          continue;
        }

        for (const arduino of arduinos) {
          let serialPort;
          try {
            serialPort = new SerialPort({
              path: arduino.path,
              baudRate: 115200,
            });
            
            const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));
            let timeoutId;
            let checkInterval;

            await Promise.race([
              new Promise((resolve, reject) => {
                serialPort.once('open', () => {
                  timeoutId = setInterval(() => {
                    try {
                      serialPort.write("PI\n");
                    } catch (err) {
                      serialPort.close();
                      reject(err);
                    }
                  }, 1000);

                  parser.on('data', (data) => {
                    if (data.trim() === "PO") resolve();
                  });
                });

                serialPort.once('error', reject);
              }),
              wait(10000).then(() => {
                throw new Error('Pairing timeout');
              })
            ]);

            emitter.emit('online', true);
            
            let lastPong = Date.now();
            checkInterval = setInterval(() => {
              if (Date.now() - lastPong > 10000) {
                serialPort.close();
              }
            }, 1000);

            parser.on('data', (data) => {
              const trimmed = data.trim();
              if (trimmed === "PO") {
                lastPong = Date.now();
              } else {
                emitter.emit('button', trimmed);
              }
            });

            await new Promise((resolve) => {
              serialPort.once('close', (x) => {
                clearInterval(timeoutId);
                clearInterval(checkInterval);
                emitter.emit('online', false);
                emitter.emit('error', `Connection closed: ${x}`);
                resolve();
              });
            });

            break;
          } catch (error) {
            if (serialPort?.isOpen) serialPort.close();
            emitter.emit('error', `Connection failed: ${error.message}`);
          }
        }
      } catch (error) {
        emitter.emit('error', `Scanning error: ${error.message}`);
        await wait(1000);
      }
    }
  })();

  return emitter;
}

module.exports = pair;