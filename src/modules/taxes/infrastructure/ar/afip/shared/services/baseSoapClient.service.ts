import { writeFile } from "node:fs/promises";
import { Agent as HttpsAgent } from "node:https";
import * as path from "node:path";
// src/shared/services/base-soap-client.service.ts
import { Injectable, Logger } from "@nestjs/common";
import soapRequest from "easy-soap-request";
import { XMLParser } from "fast-xml-parser";
import * as soap from "soap";

const httpsAgent = new HttpsAgent({ keepAlive: true });

type SoapRequestOptions = Parameters<typeof soapRequest>[0] & {
	extraHeaders?: Record<string, string>;
	wsdl_options?: Record<string, unknown>;
};

@Injectable()
export class BaseSoapClient {
	private readonly logger = new Logger(BaseSoapClient.name);
	private clientCache = new Map<string, Promise<soap.Client>>();

	private getClient(wsdl: string, endpoint: string) {
		const key = `${wsdl}|${endpoint}`;
		if (!this.clientCache.has(key)) {
			const clientP = soap
				.createClientAsync(wsdl, {
					endpoint,
					wsdl_options: { agent: httpsAgent },
				})
				.then((client) => {
					// @ts-expect-error acceso interno de node-soap
					client.httpClient.options = { agent: httpsAgent };
					return client;
				});
			this.clientCache.set(key, clientP);
		}
		const client = this.clientCache.get(key);
		if (!client) {
			throw new Error("SOAP client not initialized");
		}
		return client;
	}

	async call<T>(
		wsdlPath: string,
		endpoint: string,
		method: string,
		payload: unknown,
		debugName: string,
	): Promise<T> {
		const isXml = typeof payload === "string";
		const debugPrefix = path.resolve(__dirname, debugName);

		if (isXml) {
			const soapAction =
				method === "loginCms" ? '""' : `http://ar.gov.afip.dif.FEV1/${method}`;

			try {
				const { response } = await soapRequest({
					url: endpoint,
					headers: {
						"Content-Type": "text/xml; charset=utf-8",
						SOAPAction: `${soapAction}`,
					},
					xml: payload as string,
					timeout: 10000,
					extraHeaders: { Connection: "keep-alive" },
					wsdl_options: { agent: httpsAgent },
				} as SoapRequestOptions);

				await writeFile(`${debugPrefix}-response.xml`, response.body, "utf-8");

				if (response.statusCode !== 200) {
					throw new Error(`SOAP Error: HTTP ${response.statusCode}`);
				}

				const parser = new XMLParser({ ignoreAttributes: false });
				const parsed = parser.parse(response.body);
				const fault = parsed["soap:Envelope"]?.["soap:Body"]?.["soap:Fault"];

				if (fault) {
					const code = fault.faultcode || "Unknown";
					const msg = fault.faultstring || "No description";
					throw new Error(`SOAP Fault: ${code} - ${msg}`);
				}

				return response.body as unknown as T;
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				const stack = err instanceof Error ? (err.stack ?? message) : message;
				this.logger.error(`SOAP XML call failed [${method}] → ${message}`);
				await writeFile(`${debugPrefix}-error.log`, stack, "utf-8");
				throw err;
			}
		}

		try {
			const client = await this.getClient(wsdlPath, endpoint);
			const [response] = await client[`${method}Async`](payload);

			await writeFile(
				`${debugPrefix}-request.xml`,
				client.lastRequest ?? "",
				"utf-8",
			);
			await writeFile(
				`${debugPrefix}-response.xml`,
				client.lastResponse ?? "",
				"utf-8",
			);

			return response as T;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			const stack = err instanceof Error ? (err.stack ?? message) : message;
			this.logger.error(`SOAP JS call failed [${method}] → ${message}`);
			await writeFile(`${debugPrefix}-error.log`, stack, "utf-8");
			throw err;
		}
	}
}
