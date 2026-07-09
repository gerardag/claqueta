import { inflateRawSync } from "node:zlib";

interface CentralEntry {
  fileName: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

function readCentralDirectory(buffer: Buffer): CentralEntry[] {
  let eocdOffset = buffer.length - 22;
  while (eocdOffset >= 0) {
    if (buffer.readUInt32LE(eocdOffset) === 0x06054b50) break;
    eocdOffset--;
  }
  if (eocdOffset < 0) return [];

  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  const cdEntries = buffer.readUInt16LE(eocdOffset + 10);
  const entries: CentralEntry[] = [];
  let offset = cdOffset;

  for (let i = 0; i < cdEntries; i++) {
    if (offset + 46 > buffer.length) break;
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLen).toString("utf-8");

    entries.push({ fileName, compressionMethod, compressedSize, uncompressedSize, localHeaderOffset });
    offset += 46 + fileNameLen + extraLen + commentLen;
  }

  return entries;
}

export async function unzipCsvFiles(
  buffer: Buffer,
): Promise<{ name: string; content: string }[]> {
  const entries = readCentralDirectory(buffer);
  const files: { name: string; content: string }[] = [];

  for (const entry of entries) {
    const lower = entry.fileName.toLowerCase();
    if (!lower.endsWith(".csv") || entry.fileName.includes("__MACOSX")) continue;

    const localOffset = entry.localHeaderOffset;
    if (localOffset + 30 > buffer.length) continue;
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) continue;

    const localFileNameLen = buffer.readUInt16LE(localOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localFileNameLen + localExtraLen;
    const rawData = buffer.subarray(dataStart, dataStart + entry.compressedSize);
    const baseName = entry.fileName.split("/").pop() ?? entry.fileName;

    if (entry.compressionMethod === 0) {
      files.push({ name: baseName, content: rawData.toString("utf-8") });
    } else if (entry.compressionMethod === 8) {
      const decompressed = inflateRawSync(rawData);
      files.push({ name: baseName, content: decompressed.toString("utf-8") });
    }
  }

  return files;
}
