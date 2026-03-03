import os
import asyncio
import logging
import resend
import secrets

resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

def generate_verification_token():
    """Generate a secure verification token"""
    return secrets.token_urlsafe(32)

async def send_email(to: str, subject: str, html: str):
    try:
        params = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
        result = await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Email sent to {to}: {subject}")
        return result
    except Exception as e:
        logging.error(f"Email failed to {to}: {e}")
        return None

def email_verification(name: str, verification_link: str) -> str:
    return f"""
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#F5F5F0;padding:40px;">
      <div style="background:#1A2F3A;padding:30px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="color:white;font-family:'Georgia',serif;margin:0;font-size:28px;">DOMMMA</h1>
        <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Verify Your Email</p>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 16px 16px;">
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Welcome, {name}!</h2>
        <p style="color:#555;line-height:1.6;">Thank you for registering with DOMMMA. Please verify your email address to complete your registration.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="{verification_link}" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Verify Email</a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
        <p style="color:#888;font-size:11px;text-align:center;margin-top:20px;">Or copy this link: {verification_link}</p>
      </div>
    </div>"""

def email_welcome(name: str, role: str) -> str:
    return f"""
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#F5F5F0;padding:40px;">
      <div style="background:#1A2F3A;padding:30px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="color:white;font-family:'Georgia',serif;margin:0;font-size:28px;">DOMMMA</h1>
        <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Welcome to Your New Home</p>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 16px 16px;">
        <h2 style="color:#1A2F3A;margin:0 0 16px;">Welcome, {name}!</h2>
        <p style="color:#555;line-height:1.6;">You've joined DOMMMA as a <strong>{role}</strong>. We're excited to have you!</p>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="color:#1A2F3A;font-weight:bold;margin:0 0 8px;">Meet Nova, Your AI Assistant</p>
          <p style="color:#555;font-size:14px;margin:0;">Nova can help you find the perfect home, analyze lease documents, calculate commute times, and even match you with contractors. Try the search bar on our homepage!</p>
        </div>
        <p style="color:#555;line-height:1.6;">Get started by exploring properties, connecting with {('landlords' if role=='renter' else 'tenants' if role=='landlord' else 'clients')}, or browsing our contractor marketplace.</p>
      </div>
    </div>"""

def email_booking_confirmed(customer_name: str, contractor_name: str, title: str, date: str) -> str:
    return f"""
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#F5F5F0;padding:40px;">
      <div style="background:#1A2F3A;padding:30px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="color:white;font-family:'Georgia',serif;margin:0;font-size:28px;">DOMMMA</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 16px 16px;">
        <h2 style="color:#1A2F3A;">Booking Confirmed!</h2>
        <p style="color:#555;line-height:1.6;">Hi {customer_name}, your booking has been confirmed.</p>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Service:</strong> {title}</p>
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Contractor:</strong> {contractor_name}</p>
          <p style="margin:4px 0;color:#1A2F3A;"><strong>Date:</strong> {date or 'To be confirmed'}</p>
        </div>
      </div>
    </div>"""

def email_application_update(name: str, listing_title: str, status: str) -> str:
    status_msg = "approved! Congratulations!" if status == "approved" else f"updated to: {status}"
    return f"""
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#F5F5F0;padding:40px;">
      <div style="background:#1A2F3A;padding:30px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="color:white;font-family:'Georgia',serif;margin:0;font-size:28px;">DOMMMA</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 16px 16px;">
        <h2 style="color:#1A2F3A;">Application Update</h2>
        <p style="color:#555;">Hi {name}, your application for <strong>{listing_title}</strong> has been {status_msg}</p>
      </div>
    </div>"""

def email_offer_received(seller_name: str, listing_title: str, offer_amount: int, financing: str, closing_date: str = "") -> str:
    return f"""
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#F5F5F0;padding:40px;">
      <div style="background:#1A2F3A;padding:30px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="color:white;font-family:'Georgia',serif;margin:0;">DOMMMA</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 16px 16px;">
        <h2 style="color:#1A2F3A;">New Offer on {listing_title}</h2>
        <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:4px 0;color:#1A2F3A;font-size:24px;font-weight:bold;">${offer_amount:,}</p>
          <p style="margin:4px 0;color:#555;">Financing: {financing}</p>
          {f'<p style="margin:4px 0;color:#555;">Closing: {closing_date}</p>' if closing_date else ''}
        </div>
        <p style="color:#555;">Log in to review and respond to this offer.</p>
      </div>
    </div>"""
