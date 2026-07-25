"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type FaqItem = { q: string; a: string };
type FaqGroup = { label: string; sublabel: string; items: FaqItem[] };

const GROUP_KEYS = ["top", "heart", "base"] as const;

export default function FaqPage() {
  const t = useTranslations();
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">{t("faq.eyebrow")}</p>
        <h1 className="section-title">{t("faq.title")}</h1>
        <p className="section-description">{t("faq.subtitle")}</p>
      </section>

      <div className="content-page">
        <div className="faq-groups">
          {GROUP_KEYS.map((key) => {
            const group = t.raw(`faq.groups.${key}`) as FaqGroup;
            return (
              <div className="faq-group" key={key}>
                <div className="faq-group-head">
                  <span className="faq-group-sublabel">{group.sublabel}</span>
                  <h2 className="faq-group-label">{group.label}</h2>
                </div>

                <div className="faq-list">
                  {group.items.map((item, i) => {
                    const id = `${key}-${i}`;
                    const isOpen = openId === id;
                    return (
                      <div className="faq-item" key={id}>
                        <button
                          type="button"
                          className="faq-question"
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${id}`}
                          onClick={() => toggle(id)}
                        >
                          <span>{item.q}</span>
                          <span className="faq-icon" aria-hidden="true">
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>
                        <div
                          id={`faq-answer-${id}`}
                          className="faq-answer"
                          style={{
                            gridTemplateRows: isOpen ? "1fr" : "0fr",
                          }}
                        >
                          <p className="faq-answer-inner">{item.a}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="page-cta">
        <p className="eyebrow">{t("faq.contactCta")}</p>
        <Link href="/contact" className="btn btn-primary">
          {t("faq.contactButton")}
        </Link>
      </section>
    </>
  );
}
