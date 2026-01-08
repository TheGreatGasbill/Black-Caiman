export type Finding = {
  findingId: string;
  checkId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  resourceType: string;
  resourceId: string;
  region: string;
  status: string;
  recommendation: string;
  terraformHint: string;
  firstSeenAt: string;
  lastSeenAt: string;
};

const API_BASE = import.meta.env.VITE_API_BASE as string;
const API_TOKEN = import.meta.env.VITE_API_TOKEN as string | undefined;

export async function fetchFindings(): Promise<Finding[]> {
  const headers: Record<string, string> = {};
  if (API_TOKEN) headers["x-api-key"] = API_TOKEN; 

  const res = await fetch(`${API_BASE}/findings`, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}
