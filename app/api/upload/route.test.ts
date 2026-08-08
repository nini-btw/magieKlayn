import { NextRequest } from "next/server";

jest.mock("@/infrastructure/auth/supabase-auth", () => ({
  getAdminSession: jest.fn(),
}));
jest.mock("@/infrastructure/storage/supabase-storage", () => ({
  storageService: { upload: jest.fn() },
}));

import { POST, sniffImageType } from "./route";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";
import { storageService } from "@/infrastructure/storage/supabase-storage";

const mockedGetAdminSession = getAdminSession as jest.Mock;
const mockedStorageService = storageService as jest.Mocked<typeof storageService>;

const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const GIF_BYTES = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0]);
const WEBP_BYTES = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from("WEBP"),
]);
const GARBAGE_BYTES = Buffer.from("not an image, just plain text bytes!!");

describe("sniffImageType", () => {
  it.each([
    ["JPEG", JPEG_BYTES, "image/jpeg"],
    ["PNG", PNG_BYTES, "image/png"],
    ["GIF", GIF_BYTES, "image/gif"],
    ["WebP", WEBP_BYTES, "image/webp"],
  ])("recognizes %s magic bytes", (_label, bytes, expected) => {
    expect(sniffImageType(bytes as Buffer)).toBe(expected);
  });

  it("returns null for unrecognized bytes", () => {
    expect(sniffImageType(GARBAGE_BYTES)).toBeNull();
  });

  it("returns null for a buffer shorter than the shortest signature check", () => {
    expect(sniffImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});

function makeUploadRequest(file: File | null) {
  const formData = new FormData();
  if (file) formData.set("file", file);
  return new NextRequest("http://localhost/api/upload", { method: "POST", body: formData });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/upload", () => {
  it("returns 401 when not an admin", async () => {
    mockedGetAdminSession.mockResolvedValue(null);
    const file = new File([JPEG_BYTES], "photo.jpg", { type: "image/jpeg" });
    const res = await POST(makeUploadRequest(file));
    expect(res.status).toBe(401);
  });

  it("returns 400 when no file is provided", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    const res = await POST(makeUploadRequest(null));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a declared MIME type outside the allow-list", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    const file = new File([JPEG_BYTES], "file.pdf", { type: "application/pdf" });
    const res = await POST(makeUploadRequest(file));
    expect(res.status).toBe(400);
  });

  it("SECURITY: rejects a file whose declared type is allowed but content bytes don't match (spoofed Content-Type)", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    // Declares image/jpeg but the actual bytes are plain text.
    const file = new File([GARBAGE_BYTES], "fake.jpg", { type: "image/jpeg" });
    const res = await POST(makeUploadRequest(file));
    expect(res.status).toBe(400);
    expect(mockedStorageService.upload).not.toHaveBeenCalled();
  });

  it("uploads using the sniffed type, not the client-declared type", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    mockedStorageService.upload.mockResolvedValue("https://storage.example.com/photo.jpg");
    // Content is actually PNG bytes despite the declared type being jpeg —
    // since PNG is also in the allow-list, this should succeed but upload
    // with the sniffed "image/png", not the declared "image/jpeg".
    const file = new File([PNG_BYTES], "photo.jpg", { type: "image/jpeg" });
    const res = await POST(makeUploadRequest(file));
    expect(res.status).toBe(200);
    expect(mockedStorageService.upload).toHaveBeenCalledWith(
      expect.any(Buffer),
      "photo.jpg",
      "image/png",
    );
  });

  it("returns 400 for a file exceeding the 5MB cap", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);
    JPEG_BYTES.copy(oversized);
    const file = new File([oversized], "big.jpg", { type: "image/jpeg" });
    const res = await POST(makeUploadRequest(file));
    expect(res.status).toBe(400);
  });
});
