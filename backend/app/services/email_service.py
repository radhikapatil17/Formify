import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

def send_form_email_invitation(
    recipient_email: str,
    subject: Optional[str],
    form_title: str,
    public_url: str,
    custom_message: Optional[str] = None,
    sender_name: Optional[str] = None
) -> Dict[str, Any]:
    # Force reload .env dynamically to pick up user edits immediately
    load_dotenv(override=True)

    smtp_server = (os.getenv("SMTP_SERVER") or "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT") or "587")
    smtp_username = (os.getenv("SMTP_USERNAME") or "").strip()
    raw_password = (os.getenv("SMTP_PASSWORD") or "").strip()
    # Strip spaces from Google App Password (e.g. "jrvx bwdo pjub dbmv" -> "jrvxbwdopjubdbmv")
    smtp_password = raw_password.replace(" ", "").replace('"', '').replace("'", "")
    from_email = (os.getenv("SMTP_FROM_EMAIL") or smtp_username or "noreply@formify.com").strip()
    from_name = (os.getenv("SMTP_FROM_NAME") or "Formify").strip()

    # Verify SMTP credentials exist
    if not smtp_username or not smtp_password:
        raise ValueError(
            "Live email delivery requires SMTP_USERNAME and SMTP_PASSWORD in your .env file. "
            "Please configure your Gmail App Password or SMTP credentials in .env."
        )

    full_from = f"{from_name} <{from_email}>"
    final_subject = subject.strip() if subject and subject.strip() else f"Invitation to fill out: {form_title}"
    message_body = custom_message.strip() if custom_message and custom_message.strip() else ""

    # HTML Email Template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }}
        .container {{ max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05); }}
        .header {{ background-color: #4f46e5; padding: 28px 32px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }}
        .body {{ padding: 32px; line-height: 1.6; font-size: 15px; color: #334155; }}
        .message-box {{ background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px 20px; border-radius: 8px; margin: 20px 0; font-style: italic; color: #1e293b; }}
        .cta-button {{ display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; margin: 20px 0; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); }}
        .footer {{ background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }}
        .link-text {{ word-break: break-all; color: #4f46e5; font-size: 13px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Formify</h1>
        </div>
        <div class="body">
          <p>Hello,</p>
          <p><strong>{sender_name or 'Someone'}</strong> has invited you to complete the form: <strong>"{form_title}"</strong>.</p>
          {f'<div class="message-box">{message_body}</div>' if message_body else ''}
          <p>Please click the button below to open and submit your response:</p>
          <p style="text-align: center;">
            <a href="{public_url}" target="_blank" class="cta-button">Fill Out Form</a>
          </p>
          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            If the button above does not work, copy and paste this direct link into your browser:<br>
            <a href="{public_url}" target="_blank" class="link-text">{public_url}</a>
          </p>
        </div>
        <div class="footer">
          <p>Sent securely via Formify Smart Form Builder.</p>
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""
Hello,

{sender_name or 'Someone'} has invited you to complete the form: "{form_title}".

{f'Message: {message_body}' if message_body else ''}

Open and complete the form using this link:
{public_url}

Sent securely via Formify.
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = final_subject
        msg["From"] = full_from
        msg["To"] = recipient_email

        msg.attach(MIMEText(plain_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(from_email, [recipient_email], msg.as_string())

        logger.info(f"Email sent successfully to {recipient_email} via SMTP ({smtp_server})")
        return {
            "success": True,
            "message": f"Email invitation delivered successfully to {recipient_email}!",
            "recipient": recipient_email
        }
    except Exception as e:
        logger.error(f"Failed to send email via SMTP ({smtp_server}): {str(e)}")
        raise RuntimeError(f"SMTP delivery failed: {str(e)}")

def send_collaboration_email_invitation(
    recipient_email: str,
    form_title: str,
    role: str,
    sender_name: str,
    dashboard_url: str
) -> Dict[str, Any]:
    # Force reload .env dynamically to pick up user edits immediately
    load_dotenv(override=True)

    smtp_server = (os.getenv("SMTP_SERVER") or "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT") or "587")
    smtp_username = (os.getenv("SMTP_USERNAME") or "").strip()
    raw_password = (os.getenv("SMTP_PASSWORD") or "").strip()
    # Strip spaces from Google App Password
    smtp_password = raw_password.replace(" ", "").replace('"', '').replace("'", "")
    from_email = (os.getenv("SMTP_FROM_EMAIL") or smtp_username or "noreply@formify.com").strip()
    from_name = (os.getenv("SMTP_FROM_NAME") or "Formify").strip()

    # Verify SMTP credentials exist
    if not smtp_username or not smtp_password:
        logger.warning(
            "SMTP credentials not configured. Collaboration email invitation to %s was not sent via SMTP.",
            recipient_email
        )
        return {
            "success": False,
            "message": "SMTP credentials not configured. Invitation registered in database but email not sent.",
            "recipient": recipient_email
        }

    full_from = f"{from_name} <{from_email}>"
    final_subject = f"Collaboration Invitation: {form_title}"

    # HTML Email Template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }}
        .container {{ max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05); }}
        .header {{ background-color: #4f46e5; padding: 28px 32px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }}
        .body {{ padding: 32px; line-height: 1.6; font-size: 15px; color: #334155; }}
        .cta-button {{ display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; margin: 20px 0; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); }}
        .footer {{ background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Formify Collaboration</h1>
        </div>
        <div class="body">
          <p>Hello,</p>
          <p><strong>{sender_name}</strong> has invited you to collaborate on the form: <strong>"{form_title}"</strong> as a/an <strong>{role.upper()}</strong>.</p>
          <p>Please click the button below to log in to your Formify dashboard and respond to the invitation:</p>
          <p style="text-align: center;">
            <a href="{dashboard_url}" target="_blank" class="cta-button">Go to Dashboard</a>
          </p>
        </div>
        <div class="footer">
          <p>Sent securely via Formify Smart Form Builder.</p>
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""
Hello,

{sender_name} has invited you to collaborate on the form: "{form_title}" as a/an {role.upper()}.

Go to your Formify dashboard to accept or decline the invitation:
{dashboard_url}

Sent securely via Formify.
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = final_subject
        msg["From"] = full_from
        msg["To"] = recipient_email

        msg.attach(MIMEText(plain_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(from_email, [recipient_email], msg.as_string())

        logger.info(f"Collaboration email sent successfully to {recipient_email} via SMTP ({smtp_server})")
        return {
            "success": True,
            "message": f"Collaboration email invitation delivered successfully to {recipient_email}!",
            "recipient": recipient_email
        }
    except Exception as e:
        logger.error(f"Failed to send collaboration email via SMTP ({smtp_server}): {str(e)}")
        return {
            "success": False,
            "message": f"SMTP delivery failed: {str(e)}",
            "recipient": recipient_email
        }

def send_password_reset_email(
    recipient_email: str,
    reset_link: str,
    name: str
) -> Dict[str, Any]:
    # Force reload .env dynamically to pick up user edits immediately
    load_dotenv(override=True)

    smtp_server = (os.getenv("SMTP_SERVER") or "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT") or "587")
    smtp_username = (os.getenv("SMTP_USERNAME") or "").strip()
    raw_password = (os.getenv("SMTP_PASSWORD") or "").strip()
    # Strip spaces from Google App Password
    smtp_password = raw_password.replace(" ", "").replace('"', '').replace("'", "")
    from_email = (os.getenv("SMTP_FROM_EMAIL") or smtp_username or "noreply@formify.com").strip()
    from_name = (os.getenv("SMTP_FROM_NAME") or "Formify").strip()

    # Verify SMTP credentials exist
    if not smtp_username or not smtp_password:
        logger.warning(
            "SMTP credentials not configured. Password reset email to %s was not sent via SMTP.",
            recipient_email
        )
        return {
            "success": False,
            "message": "SMTP credentials not configured. Reset link generated but email not sent.",
            "reset_link": reset_link
        }

    full_from = f"{from_name} <{from_email}>"
    final_subject = "Formify: Reset Your Password"

    # HTML Email Template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }}
        .container {{ max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05); }}
        .header {{ background-color: #4f46e5; padding: 28px 32px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }}
        .body {{ padding: 32px; line-height: 1.6; font-size: 15px; color: #334155; }}
        .cta-button {{ display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; margin: 20px 0; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); }}
        .footer {{ background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }}
        .link-text {{ word-break: break-all; color: #4f46e5; font-size: 13px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Formify Password Recovery</h1>
        </div>
        <div class="body">
          <p>Hello {name or 'there'},</p>
          <p>We received a request to reset the password for your Formify account. If you did not make this request, you can safely ignore this email.</p>
          <p>Otherwise, please click the button below to reset your password. This link will expire shortly:</p>
          <p style="text-align: center;">
            <a href="{reset_link}" target="_blank" class="cta-button">Reset Password</a>
          </p>
          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            If the button above does not work, copy and paste this direct link into your browser:<br>
            <a href="{reset_link}" target="_blank" class="link-text">{reset_link}</a>
          </p>
        </div>
        <div class="footer">
          <p>Sent securely via Formify Smart Form Builder.</p>
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""
Hello {name or 'there'},

We received a request to reset your Formify password.

Click the link below to reset your password:
{reset_link}

If you did not request this, please ignore this email.

Sent securely via Formify.
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = final_subject
        msg["From"] = full_from
        msg["To"] = recipient_email

        msg.attach(MIMEText(plain_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(from_email, [recipient_email], msg.as_string())

        logger.info(f"Password reset email sent successfully to {recipient_email} via SMTP ({smtp_server})")
        return {
            "success": True,
            "message": f"Password reset email delivered successfully to {recipient_email}!",
            "recipient": recipient_email
        }
    except Exception as e:
        logger.error(f"Failed to send password reset email via SMTP ({smtp_server}): {str(e)}")
        return {
            "success": False,
            "message": f"SMTP delivery failed: {str(e)}",
            "recipient": recipient_email
        }

def send_otp_email(
    recipient_email: str,
    otp_code: str,
    form_title: str,
    expiry_minutes: int = 10
) -> Dict[str, Any]:
    # Force reload .env dynamically to pick up user edits immediately
    load_dotenv(override=True)

    smtp_server = (os.getenv("SMTP_SERVER") or "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT") or "587")
    smtp_username = (os.getenv("SMTP_USERNAME") or "").strip()
    raw_password = (os.getenv("SMTP_PASSWORD") or "").strip()
    smtp_password = raw_password.replace(" ", "").replace('"', '').replace("'", "")
    from_email = (os.getenv("SMTP_FROM_EMAIL") or smtp_username or "noreply@formify.com").strip()
    from_name = (os.getenv("SMTP_FROM_NAME") or "Formify Security").strip()

    if not smtp_username or not smtp_password:
        logger.warning(
            "SMTP credentials not configured. Email OTP to %s was not sent via SMTP.",
            recipient_email
        )
        return {
            "success": False,
            "message": "SMTP credentials not configured. Check server log for OTP.",
            "recipient": recipient_email
        }

    full_from = f"{from_name} <{from_email}>"
    final_subject = f"Your Verification Code: {otp_code} - Formify"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }}
        .container {{ max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05); }}
        .header {{ background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 32px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }}
        .body {{ padding: 32px; line-height: 1.6; font-size: 15px; color: #334155; text-align: center; }}
        .otp-box {{ background-color: #f1f5f9; border: 2px dashed #6366f1; padding: 18px 24px; border-radius: 12px; margin: 24px 0; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: monospace; display: inline-block; }}
        .footer {{ background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Formify Security</h1>
        </div>
        <div class="body">
          <p style="font-size: 16px; font-weight: 700; margin: 0;">Verification Code for "{form_title}"</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Use the code below to verify your email address before submitting the form:</p>
          <div>
            <div class="otp-box">{otp_code}</div>
          </div>
          <p style="font-size: 13px; color: #94a3b8;">This verification code is valid for <strong>{expiry_minutes} minutes</strong>. Do not share this code with anyone.</p>
        </div>
        <div class="footer">
          <p>Sent securely via Formify Smart Form Builder.</p>
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""
Verification Code: {otp_code}

Your verification code for "{form_title}" is: {otp_code}

This code is valid for {expiry_minutes} minutes. Do not share this code.

Sent securely via Formify.
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = final_subject
        msg["From"] = full_from
        msg["To"] = recipient_email

        msg.attach(MIMEText(plain_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(from_email, [recipient_email], msg.as_string())

        logger.info(f"OTP Email sent successfully to {recipient_email} via SMTP ({smtp_server})")
        return {
            "success": True,
            "message": f"OTP email delivered successfully to {recipient_email}!",
            "recipient": recipient_email
        }
    except Exception as e:
        logger.error(f"Failed to send OTP email via SMTP ({smtp_server}): {str(e)}")
        return {
            "success": False,
            "message": f"SMTP delivery failed: {str(e)}",
            "recipient": recipient_email
        }
