import os
import smtplib
from email.message import EmailMessage
from email.utils import parseaddr


class EmailConfigurationError(Exception):
    pass


def _sanitize_header_value(value):
    return str(value).replace("\r", "").replace("\n", " ").strip()


def send_email(recipient, subject, body):
    host = os.environ.get("SMTP_HOST", "").strip()
    if not host:
        raise EmailConfigurationError("SMTP_HOST is not configured")

    port = int(os.environ.get("SMTP_PORT", "587"))
    username = os.environ.get("SMTP_USERNAME", "")
    password = os.environ.get("SMTP_PASSWORD", "")
    sender = os.environ.get("SMTP_FROM", "").strip()
    if not sender:
        raise EmailConfigurationError("SMTP_FROM is not configured")

    recipient = _sanitize_header_value(recipient)
    if "@" not in parseaddr(recipient)[1]:
        raise ValueError("invalid recipient")
    subject = _sanitize_header_value(subject)

    use_ssl = os.environ.get("SMTP_USE_SSL", "false").lower() == "true"
    use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"

    message = EmailMessage()
    message["From"] = sender
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)

    if use_ssl:
        with smtplib.SMTP_SSL(host, port, timeout=10) as server:
            if username:
                server.login(username, password)
            server.send_message(message)
            return message.get("Message-ID")
    with smtplib.SMTP(host, port, timeout=10) as server:
        server.ehlo()
        if use_tls:
            server.starttls()
            server.ehlo()
        if username:
            server.login(username, password)
        server.send_message(message)
        return message.get("Message-ID")
