import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import axios, { type AxiosInstance } from "axios";
import type { Repository } from "typeorm";
import { EmailEntity } from "../domain/model/email.entity";
import {
  BreveEmailTemplateSchema,
  type BrevoEmailTemplate,
} from "../interfaces/http/schemas/breve.schema";

@Injectable()
export class EmailService {
  axiosInstance!: AxiosInstance;

  constructor(
    @Inject(ConfigService)
    private configService: ConfigService,
    @InjectRepository(EmailEntity)
    private readonly emailRepository: Repository<EmailEntity>,
  ) {
    this.init();
  }

  private init() {
    this.axiosInstance = axios.create();
    const emailServiceEnabled = this.configService.get<boolean>(
      "EMAIL_SERVICE_ENABLED",
    );
    if (!emailServiceEnabled) {
      console.warn("Email service is disabled in the configuration.");
      return;
    }
    // Initialize email service here, e.g., set up SMTP client
    this.axiosInstance = axios.create({
      baseURL: this.configService.get<string>("EMAIL_SERVICE_URL"),
      headers: {
        "Content-Type": "application/json",
        "api-key": this.configService.get<string>("EMAIL_API_KEY"),
      },
    });

    console.log("Email service initialized.");
  }

  async getAllTemplates(): Promise<BrevoEmailTemplate[]> {
    // Logic to fetch all email templates
    console.log("Fetching all email templates...");

    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append("limit", "1000");
    urlSearchParams.append("offset", "0");
    urlSearchParams.append("templateStatus", "true");
    const response = await this.axiosInstance.get(
      `/v3/smtp/templates?${urlSearchParams.toString()}`,
    );
    if (response.status === 200) {
      console.log("Email templates fetched successfully.");
      return response.data.templates.map((template: unknown) =>
        BreveEmailTemplateSchema.parse(template),
      );
    }
    console.error("Failed to fetch email templates:", response.statusText);
    throw new Error("Failed to fetch email templates");
  }

  async getTemplateBySlug(templateSlug: string) {
    // Logic to fetch a specific email template by slug
    const template = await this.emailRepository.findOne({
      where: { slug: templateSlug },
    });

    if (template) {
      console.log(`Template found: ${template.slug}`);
      return template;
    }
    console.error(`Template not found: ${templateSlug}`);
    throw new Error(`Template not found: ${templateSlug}`);
  }

  async sendEmailWithTemplate(
    emailEntity: EmailEntity,
    to: string,
    subject: string,
    variables: Record<string, unknown>,
  ): Promise<void> {
    // Logic to send an email using a specific template
    console.log(`Sending email to ${to} with template ${emailEntity.slug}`);

    const response = await this.axiosInstance.post("/v3/smtp/email", {
      sender: emailEntity.sender,
      to: [{ email: to }],
      subject: subject,
      templateId: Number(emailEntity.external_id),
      params: variables,
    });

    if ([202, 201].includes(response.status)) {
      console.log("Email sent successfully.");
    } else {
      console.error("Failed to send email:", response.data);
      throw new Error("Failed to send email");
    }
  }

  async syncTemplates(): Promise<{ message: string }> {
    // Logic to sync email templates with the database
    console.log("Syncing email templates...");

    const templates = await this.getAllTemplates();
    for (const template of templates) {
      const existingTemplate = await this.emailRepository.findOne({
        where: { slug: template.slug },
      });

      if (existingTemplate) {
        // Update existing template
        Object.assign(existingTemplate, template);
        await this.emailRepository.save(existingTemplate);
        console.log(`Updated template: ${template.slug}`);
      } else {
        // Create new template
        const newTemplate = this.emailRepository.create(template);
        await this.emailRepository.save(newTemplate);
        console.log(`Created new template: ${template.slug}`);
      }
    }

    return {
      message: "Syncronize templates finalize successfully",
    };
  }

  async getTemplateById(templateId: string): Promise<BrevoEmailTemplate> {
    // Logic to fetch a specific email template by ID
    console.log(`Fetching email template with ID: ${templateId}`);

    const response = await this.axiosInstance.get(
      `/v3/smtp/templates/${templateId}`,
    );
    if (response.status === 200) {
      console.log("Email template fetched successfully.");
      return BreveEmailTemplateSchema.parse(response.data);
    }
    console.error("Failed to fetch email template:", response.statusText);
    throw new Error("Failed to fetch email template");
  }

  sendEmail(to: string, subject: string, body: string): void {
    // Logic to send email
    console.log(`Sending email to ${to} with subject "${subject}"`);
  }
}
