import type {
  YalidineListResponse,
  YalidineWilaya,
  YalidineCommune,
  YalidineFeeResponse,
} from "./types";

const BASE_URL = process.env.YALIDINE_API_BASE_URL!;
const API_ID = process.env.YALIDINE_API_ID!;
const API_TOKEN = process.env.YALIDINE_API_TOKEN!;

const TIMEOUT_MS = 8000;
const MAX_RETRIES = 3;

class YalidineClient {
  private async request<T>(path: string): Promise<T> {
    let attempt = 0;

    while (true) {
      attempt++;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const res = await fetch(`${BASE_URL}${path}`, {
          headers: {
            "X-API-ID": API_ID,
            "X-API-TOKEN": API_TOKEN,
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        this.logQuota(res.headers);

        if (res.status === 429) {
          if (attempt > MAX_RETRIES) {
            throw new Error(
              `Yalidine rate-limited after ${MAX_RETRIES} retries`,
            );
          }
          const retryAfter = Number(res.headers.get("Retry-After")) || 2;
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          continue;
        }

        if (!res.ok) {
          throw new Error(
            `Yalidine API error ${res.status}: ${await res.text()}`,
          );
        }

        return (await res.json()) as T;
      } catch (err) {
        clearTimeout(timeout);
        if (attempt > MAX_RETRIES) throw err;
        if ((err as Error).name === "AbortError") {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        throw err;
      }
    }
  }

  private logQuota(headers: Headers) {
    const quota = {
      second: headers.get("second-quota-left"),
      minute: headers.get("minute-quota-left"),
      hour: headers.get("hour-quota-left"),
      day: headers.get("day-quota-left"),
    };
    if (quota.second !== null) {
      console.log("[yalidine] quota", quota);
    }
  }

  async getWilayas() {
    return this.request<YalidineListResponse<YalidineWilaya>>("/wilayas/");
  }

  async getCommunesByWilaya(wilayaId: number) {
    return this.request<YalidineListResponse<YalidineCommune>>(
      `/communes/?wilaya_id=${wilayaId}`,
    );
  }

  async getFees(fromWilayaId: number, toWilayaId: number) {
    return this.request<YalidineFeeResponse>(
      `/fees/?from_wilaya_id=${fromWilayaId}&to_wilaya_id=${toWilayaId}`,
    );
  }
}

export const yalidineClient = new YalidineClient();
