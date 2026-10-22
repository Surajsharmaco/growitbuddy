import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { createServiceInquiry } from "@workspace/api-client-react";
import { Form } from "@/components/ui/form";

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80, "Please keep your name under 80 characters."),
  email: z.string().trim().email("Please enter a valid email address.").max(254, "Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .max(30, "Please enter a valid phone number.")
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 8 && digits.length <= 15;
    }, "Please enter a valid phone number."),
  message: z.string().trim().min(1, "Please tell us a little about your goals.").max(5000, "Please keep your message under 5,000 characters."),
  website: z.string().optional(),
});

type InquiryValues = z.infer<typeof inquirySchema>;

function safePrivacyUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch {
    return "";
  }
}

export interface ServiceInquiryFormProps {
  disabled?: boolean;
  heading: string;
  subtitle: string;
  privacyMessage: string;
  privacyUrl: string;
}

export function ServiceInquiryForm({
  disabled = false,
  heading,
  subtitle,
  privacyMessage,
  privacyUrl,
}: ServiceInquiryFormProps) {
  const privacyDestination = safePrivacyUrl(privacyUrl);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const submitLock = useRef(false);
  const form = useForm<InquiryValues>({
    resolver: zodResolver(inquirySchema),
    mode: "onBlur",
    defaultValues: { name: "", email: "", phone: "", message: "", website: "" },
  });

  const onSubmit = async (values: InquiryValues) => {
    if (disabled || submitLock.current) return;
    // Quietly discard bot submissions without exposing the honeypot to visitors.
    if (values.website) return;

    submitLock.current = true;
    setSubmitting(true);
    setServerError("");

    try {
      const response = await createServiceInquiry({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        message: values.message.trim(),
        website: values.website ?? "",
        sourceUrl: (() => {
          const current = new URL(window.location.href);
          const allowedCampaignKeys = /^(utm_[a-z0-9_]{1,40}|gclid|fbclid|msclkid)$/i;
          for (const key of Array.from(current.searchParams.keys())) {
            if (!allowedCampaignKeys.test(key)) current.searchParams.delete(key);
          }
          current.hash = "";
          return current.toString().slice(0, 500);
        })(),
      });

      if (response.success !== true) {
        throw new Error(response.message || "We couldn't send your inquiry. Please try again.");
      }

      setSuccess(true);
      form.reset();
    } catch (error) {
      const errorData =
        error && typeof error === "object" && "data" in error && error.data && typeof error.data === "object"
          ? error.data
          : null;
      const apiMessage =
        errorData && "error" in errorData && typeof errorData.error === "string"
          ? errorData.error
          : null;
      setServerError(
        apiMessage || (error instanceof Error ? error.message : "Something went wrong. Please try again."),
      );
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const errors = form.formState.errors;

  return (
    <div className="service-inquiry-card" data-testid="card-service-inquiry">
      <header className="service-inquiry-heading">
        <h2>{heading}</h2>
        {subtitle && <p>{subtitle}</p>}
      </header>

      {success ? (
        <div className="service-inquiry-success" role="status" aria-live="polite" data-testid="status-inquiry-success">
          <span className="service-inquiry-success-mark" aria-hidden="true">✓</span>
          <p>Your inquiry has been received. We’ll be in touch soon.</p>
        </div>
      ) : (
        <Form {...form}>
        <form className="service-inquiry-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="service-inquiry-fields">
            <div className="service-inquiry-field">
              <label htmlFor="service-inquiry-name">Full Name <span aria-hidden="true">*</span></label>
              <input
                id="service-inquiry-name"
                type="text"
                required
                disabled={disabled}
                autoComplete="name"
                placeholder="Enter your full name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "service-inquiry-name-error" : undefined}
                data-testid="input-inquiry-name"
                {...form.register("name")}
              />
              {errors.name && <span className="service-inquiry-field-error" id="service-inquiry-name-error">{errors.name.message}</span>}
            </div>

            <div className="service-inquiry-field">
              <label htmlFor="service-inquiry-email">Work Email <span aria-hidden="true">*</span></label>
              <input
                id="service-inquiry-email"
                type="email"
                required
                disabled={disabled}
                autoComplete="email"
                inputMode="email"
                placeholder="you@company.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "service-inquiry-email-error" : undefined}
                data-testid="input-inquiry-email"
                {...form.register("email")}
              />
              {errors.email && <span className="service-inquiry-field-error" id="service-inquiry-email-error">{errors.email.message}</span>}
            </div>

            <div className="service-inquiry-field service-inquiry-field-full">
              <label htmlFor="service-inquiry-phone">Phone Number / WhatsApp <span aria-hidden="true">*</span></label>
              <input
                id="service-inquiry-phone"
                type="tel"
                required
                disabled={disabled}
                autoComplete="tel"
                inputMode="tel"
                placeholder="Enter your phone number"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "service-inquiry-phone-error" : undefined}
                data-testid="input-inquiry-phone"
                {...form.register("phone")}
              />
              {errors.phone && <span className="service-inquiry-field-error" id="service-inquiry-phone-error">{errors.phone.message}</span>}
            </div>

            <div className="service-inquiry-field service-inquiry-field-full">
              <label htmlFor="service-inquiry-message">Your Message <span aria-hidden="true">*</span></label>
              <textarea
                id="service-inquiry-message"
                required
                disabled={disabled}
                rows={3}
                placeholder="Tell us about your goals, challenges, or what you want to achieve..."
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "service-inquiry-message-error" : undefined}
                data-testid="input-inquiry-message"
                {...form.register("message")}
              />
              {errors.message && <span className="service-inquiry-field-error" id="service-inquiry-message-error">{errors.message.message}</span>}
            </div>
          </div>

          <div className="service-inquiry-honeypot" aria-hidden="true">
            <label htmlFor="service-inquiry-website">Website</label>
            <input id="service-inquiry-website" type="text" tabIndex={-1} autoComplete="off" {...form.register("website")} />
          </div>

          {serverError && (
            <p className="service-inquiry-error" role="alert" aria-live="assertive" data-testid="status-inquiry-error">
              {serverError}
            </p>
          )}

          <button className="service-inquiry-submit" type="submit" disabled={submitting || disabled} data-testid="button-send-inquiry">
            <span>{submitting ? "Sending..." : "Send Inquiry"}</span>
            {!submitting && <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />}
            {submitting && <span className="service-inquiry-loading-mark" aria-hidden="true" />}
          </button>

          <p className="service-inquiry-privacy" data-testid="text-inquiry-privacy">
            <LockKeyhole size={12} strokeWidth={1.8} aria-hidden="true" />
            <span>
              {privacyDestination
                ? <a href={privacyDestination}>{privacyMessage}</a>
                : privacyMessage}
            </span>
          </p>
        </form>
        </Form>
      )}
    </div>
  );
}

export default ServiceInquiryForm;
