import { promises as fs } from "node:fs";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleAuth } from "google-auth-library";

interface SheetValues {
  range: string;
  values: (string | number | null)[][];
}

@Injectable()
export class SheetsClient {
  private readonly logger = new Logger(SheetsClient.name);

  constructor(private readonly configService: ConfigService) {}

  async batchUpdate(values: SheetValues[]): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug("Sheets export disabled.");
      return;
    }

    const spreadsheetId = this.configService.get<string>("SHEETS_SPREADSHEET_ID") ?? "";
    if (!spreadsheetId) {
      this.logger.warn("SHEETS_SPREADSHEET_ID no configurado.");
      return;
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: values,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Sheets batchUpdate failed: ${response.status} ${text}`);
    }
  }

  private isEnabled(): boolean {
    const flag = this.configService.get<string>("ENABLE_SHEETS");
    return flag === "true";
  }

  private async getAccessToken(): Promise<string | null> {
    const raw = this.configService.get<string>("GOOGLE_SERVICE_ACCOUNT_JSON") ?? "";
    if (!raw) {
      this.logger.warn("GOOGLE_SERVICE_ACCOUNT_JSON no configurado.");
      return null;
    }

    let credentials: Record<string, unknown>;
    if (raw.trim().startsWith("{")) {
      credentials = JSON.parse(raw);
    } else {
      const file = await fs.readFile(raw, "utf8");
      credentials = JSON.parse(file);
    }

    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token?.token ?? null;
  }
}
