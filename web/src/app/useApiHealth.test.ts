import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GIVE_UP_AFTER_MS, RETRY_DELAY_MS, useApiHealth } from "./useApiHealth";

const healthy = () => Response.json({ status: "ok", version: "1.2.3" });
const unavailable = () => new Response("Starting", { status: 503 });

describe("useApiHealth", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports the API version once /health answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(healthy())),
    );

    const { result } = renderHook(() => useApiHealth());

    expect(result.current).toEqual({ state: "checking" });
    await waitFor(() => {
      expect(result.current).toEqual({ state: "online", version: "1.2.3" });
    });
    expect(fetch).toHaveBeenCalledWith("http://api.test/health", expect.anything());
  });

  it("shows the API as waking and retries until it answers", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(unavailable())
      .mockResolvedValueOnce(healthy());
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useApiHealth());

    await waitFor(() => {
      expect(result.current).toEqual({ state: "waking" });
    });
    await act(() => vi.advanceTimersByTimeAsync(RETRY_DELAY_MS));
    expect(result.current).toEqual({ state: "online", version: "1.2.3" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up and reports the API offline after the deadline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );

    const { result } = renderHook(() => useApiHealth());

    await act(() => vi.advanceTimersByTimeAsync(GIVE_UP_AFTER_MS + RETRY_DELAY_MS));
    expect(result.current).toEqual({ state: "offline" });
  });

  it("stops polling when unmounted", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(unavailable()));
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() => useApiHealth());
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 3));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
