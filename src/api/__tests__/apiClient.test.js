import { apiRequest } from "../apiClient";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("apiRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("returns parsed json payload on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        text: async () => JSON.stringify({ ok: true }),
      })
    );

    const result = await apiRequest("/api/test", {
      method: "POST",
      body: { ping: true },
      baseUrl: "/api",
    });

    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("does not retry through browser origin when direct backend is unavailable", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequest("/api/test", {
        method: "POST",
        body: { ping: true },
        baseUrl: "http://localhost:8080",
      })
    ).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "Unable to connect right now. Please try again in a moment.",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/test",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws normalized error for non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: { get: () => "application/json" },
        clone() {
          return this;
        },
        json: async () => ({ message: "bad request", code: "BAD_INPUT" }),
        text: async () => "",
      })
    );

    await expect(apiRequest("/api/test", { method: "POST", body: { ping: true } })).rejects.toMatchObject({
      message: "bad request",
      code: "BAD_INPUT",
      status: 400,
    });
  });

  it("uses plain text message for non-json error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: { get: () => "text/plain" },
        text: async () => "Incorrect password. Please try again.",
      })
    );

    await expect(apiRequest("/api/test", { method: "POST", body: { ping: true } })).rejects.toMatchObject({
      message: "Incorrect password. Please try again.",
      status: 401,
    });
  });

  it("clears stale auth on 401 for authenticated calls", async () => {
    window.localStorage.setItem("iqms-current-user", JSON.stringify({ token: "stale-token" }));

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: { get: () => "text/plain" },
        clone() {
          return this;
        },
        text: async () => "Session no longer valid. Please sign in again.",
      })
    );

    await expect(apiRequest("/api/sheets", { method: "GET", token: "stale-token" })).rejects.toMatchObject({
      status: 401,
      message: "Session no longer valid. Please sign in again.",
    });

    expect(window.localStorage.getItem("iqms-current-user")).toBeNull();
  });
});
