import { CREDIT_AMOUNTS } from '@palmsight/shared';

export interface VerifyEmailTemplateParams {
  recipient: string;
  displayName: string;
  verificationUrl: string;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderVerifyEmailHtml(params: VerifyEmailTemplateParams): string {
  const { verificationUrl } = params;
  const safeDisplayName = escapeHtml(params.displayName);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Xác thực email PalmSight</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #f1eeee; font-family: 'JetBrains Mono', 'Courier New', monospace; color: #424245;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #fdfcfc; border: 1px solid rgba(15,0,0,0.12); border-radius: 8px; overflow: hidden; padding: 40px;" cellpadding="0" cellspacing="0" border="0">
          <!-- ASCII Wordmark -->
          <tr>
            <td>
              <pre style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 11px; line-height: 1.15; color: #201d1d; margin: 0; padding: 0; user-select: all; overflow-x: auto;">███ ███ █   █ █ ███ ███ ███ █ █ ███
█ █ █ █ █   ███ █     █   █   █ █   █
███ ███ █   ███ ███   █   █ █ ███   █
█   █ █ █   █ █   █   █   █ █ █ █   █
█   █ █ ███ █ █ ███ ███ ███ █ █   █</pre>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td height="32" style="height: 32px; font-size: 0px; line-height: 0px;">&nbsp;</td></tr>

          <!-- Heading -->
          <tr>
            <td>
              <h1 style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 24px; line-height: 36px; font-weight: bold; color: #050404; margin: 0;">
                Xác thực email của bạn
              </h1>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td height="16" style="height: 16px; font-size: 0px; line-height: 0px;">&nbsp;</td></tr>

          <!-- Greeting -->
          <tr>
            <td style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 16px; line-height: 24px; color: #424245;">
              Chào ${safeDisplayName},
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td height="12" style="height: 12px; font-size: 0px; line-height: 0px;">&nbsp;</td></tr>

          <!-- Body -->
          <tr>
            <td style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 16px; line-height: 24px; color: #424245;">
              Bấm nút bên dưới để xác thực email và hoàn tất đăng ký PalmSight. Bạn sẽ nhận ${CREDIT_AMOUNTS.SIGNUP_BONUS} credits sau khi xác thực.
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td height="24" style="height: 24px; font-size: 0px; line-height: 0px;">&nbsp;</td></tr>

          <!-- Action Button -->
          <tr>
            <td>
              <a href="${verificationUrl}" style="display: inline-block; background-color: #201d1d; color: #fdfcfc; font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 16px; font-weight: 500; text-decoration: none; padding: 10px 24px; border-radius: 4px; text-align: center;">
                Xác thực email
              </a>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td height="24" style="height: 24px; font-size: 0px; line-height: 0px;">&nbsp;</td></tr>

          <!-- Expiration Notice -->
          <tr>
            <td style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 14px; line-height: 21px; color: #646262;">
              Link có hiệu lực trong 24 giờ.
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td height="16" style="height: 16px; font-size: 0px; line-height: 0px;">&nbsp;</td></tr>

          <!-- Fallback URL notice -->
          <tr>
            <td style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 14px; line-height: 21px; color: #646262;">
              Nếu nút không hoạt động, dán link này vào trình duyệt:
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td height="8" style="height: 8px; font-size: 0px; line-height: 0px;">&nbsp;</td></tr>

          <!-- Code box with URL -->
          <tr>
            <td>
              <div style="background-color: #f1eeee; border: 1px solid rgba(15,0,0,0.12); border-radius: 4px; padding: 12px 14px; font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 12px; line-height: 18px; color: #201d1d; word-break: break-all;">
                ${verificationUrl}
              </div>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td height="24" style="height: 24px; font-size: 0px; line-height: 0px;">&nbsp;</td></tr>

          <!-- Divider -->
          <tr>
            <td style="border-top: 1px solid rgba(15,0,0,0.12); font-size: 0px; line-height: 0px;">&nbsp;</td>
          </tr>

          <!-- Spacer -->
          <tr><td height="24" style="height: 24px; font-size: 0px; line-height: 0px;">&nbsp;</td></tr>

          <!-- Disclaimer -->
          <tr>
            <td style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 14px; line-height: 21px; color: #646262;">
              Nếu bạn không đăng ký PalmSight, hãy bỏ qua email này.
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td height="8" style="height: 8px; font-size: 0px; line-height: 0px;">&nbsp;</td></tr>

          <!-- Footer -->
          <tr>
            <td style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 14px; line-height: 21px; color: #646262;">
              ©2026 PalmSight
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
