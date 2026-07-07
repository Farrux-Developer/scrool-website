"use client";

import { useState, type FormEvent } from "react";
import MagneticButton from "./MagneticButton";

type Status = "idle" | "sending" | "sent";

/**
 * «Радиорубка»: канал связи с мануфактурой.
 * Бэкенда нет — отправка формирует письмо и открывает почтовый клиент
 * посетителя; состояние «передача» отыгрывается как сеанс связи.
 */
export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (status !== "idle") return;

    const subject = `NADIR — запрос экземпляра (${name.trim() || "без имени"})`;
    const body = [
      `Имя: ${name.trim()}`,
      `Связь: ${contact.trim()}`,
      "",
      message.trim(),
      "",
      "— передано с глубины 7 500 м",
    ].join("\n");
    const href = `mailto:dive@nadir.watch?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setStatus("sending");
    // короткий «сеанс связи» перед открытием почтового клиента
    setTimeout(() => {
      window.location.href = href;
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 6000);
    }, 900);
  };

  return (
    <form className="contact-form" onSubmit={onSubmit} data-reveal>
      <div className="contact-row">
        <label className="contact-field">
          <span className="contact-label">Позывной / имя</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
            autoComplete="name"
            required
            data-sfx
          />
        </label>
        <label className="contact-field">
          <span className="contact-label">Канал ответа</span>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Почта или телефон"
            autoComplete="email"
            required
            data-sfx
          />
        </label>
      </div>
      <label className="contact-field">
        <span className="contact-label">Сообщение</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Какой экземпляр вас интересует и почему именно глубина"
          rows={4}
          required
          data-sfx
        />
      </label>
      <div className="contact-actions">
        <MagneticButton className="cta">
          {status === "idle" && "Выйти на связь"}
          {status === "sending" && "Передача…"}
          {status === "sent" && "Канал открыт"}
        </MagneticButton>
        <p className={`contact-status ${status !== "idle" ? "on" : ""}`} aria-live="polite">
          {status === "sending" && "── ▄▄ ── сигнал уходит сквозь толщу"}
          {status === "sent" && "Письмо собрано в вашем почтовом клиенте. Мы отвечаем в течение одного приливного цикла."}
        </p>
      </div>
    </form>
  );
}
