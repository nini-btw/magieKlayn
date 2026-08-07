"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";

type ContactFormValues = {
  name: string;
  email: string;
  message: string;
};

type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

export default function ContactPage() {
  const t = useTranslations();

  const contactSchema = z.object({
    name: z.string().trim().min(2, t("contact.errors.nameRequired")),
    email: z.string().trim().email(t("contact.errors.emailInvalid")),
    message: z.string().trim().min(10, t("contact.errors.messageRequired")),
  });

  const [form, setForm] = useState<ContactFormValues>({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactFormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = contactSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: ContactFormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ContactFormValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      setSubmitted(false);
      return;
    }

    // TODO: wire up to your real contact/support endpoint.
    setErrors({});
    setSubmitted(true);
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">{t("contact.eyebrow")}</p>
        <h1 className="section-title">{t("contact.title")}</h1>
        <p className="section-description">{t("contact.subtitle")}</p>
      </section>

      <div className="content-page">
        <div className="contact-layout">
          <div>
            <h2 className="content-section-title">{t("contact.infoTitle")}</h2>
            <div className="contact-info-list">
              <div>
                <p className="contact-info-item-label">
                  {t("contact.emailLabel")}
                </p>
                <p className="contact-info-item-value">
                  <a href="mailto:hello@magieklayn.com">hello@magieklayn.com</a>
                </p>
              </div>
              <div>
                <p className="contact-info-item-label">
                  {t("contact.phoneLabel")}
                </p>
                <p className="contact-info-item-value">
                  <a href="tel:+213541887610">05 41 88 76 10</a>
                </p>
              </div>
              <div>
                <p className="contact-info-item-label">
                  {t("contact.hoursLabel")}
                </p>
                <p className="contact-info-item-value">
                  {t("contact.hoursValue")}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="content-section-title">{t("contact.formTitle")}</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="contact-name">
                  {t("contact.nameLabel")}
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder={t("contact.namePlaceholder")}
                  value={form.name}
                  onChange={handleChange}
                  aria-invalid={!!errors.name}
                  aria-describedby={
                    errors.name ? "contact-name-error" : undefined
                  }
                />
                {errors.name && (
                  <p
                    className="form-error"
                    id="contact-name-error"
                    role="alert"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-email">
                  {t("contact.emailFieldLabel")}
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder={t("contact.emailPlaceholder")}
                  value={form.email}
                  onChange={handleChange}
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? "contact-email-error" : undefined
                  }
                />
                {errors.email && (
                  <p
                    className="form-error"
                    id="contact-email-error"
                    role="alert"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-message">
                  {t("contact.messageLabel")}
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  className="form-textarea"
                  placeholder={t("contact.messagePlaceholder")}
                  value={form.message}
                  onChange={handleChange}
                  aria-invalid={!!errors.message}
                  aria-describedby={
                    errors.message ? "contact-message-error" : undefined
                  }
                />
                {errors.message && (
                  <p
                    className="form-error"
                    id="contact-message-error"
                    role="alert"
                  >
                    {errors.message}
                  </p>
                )}
              </div>

              <div className="form-submit-row">
                <button type="submit" className="btn btn-primary">
                  {t("contact.submit")}
                </button>
              </div>

              {submitted && (
                <p className="form-success" role="status">
                  {t("contact.success")}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      <section className="page-cta">
        <p className="eyebrow">{t("contact.ctaEyebrow")}</p>
        <h2
          className="section-title"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            marginBottom: "var(--space-sm)",
          }}
        >
          {t("contact.ctaTitle")}
        </h2>
        <a href="mailto:hello@magieklayn.com" className="btn btn-primary">
          {t("contact.ctaButton")}
        </a>
      </section>
    </>
  );
}
