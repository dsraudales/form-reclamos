import net from "net";
import { env } from "@/lib/env";

export async function scanBufferWithClamAv(buffer: Buffer) {
  if (!env.clamav.enabled) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host: env.clamav.host, port: env.clamav.port });
    const chunks: Buffer[] = [];

    socket.setTimeout(15000);
    socket.on("connect", () => {
      socket.write("zINSTREAM\0");
      const size = Buffer.alloc(4);
      size.writeUInt32BE(buffer.length);
      socket.write(size);
      socket.write(buffer);
      socket.write(Buffer.alloc(4));
    });
    socket.on("data", (chunk) => chunks.push(chunk));
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("scan_timeout"));
    });
    socket.on("error", reject);
    socket.on("end", () => {
      const result = Buffer.concat(chunks).toString("utf8");
      if (result.includes("OK")) {
        resolve();
        return;
      }
      reject(new Error("malware_detected"));
    });
  });
}
