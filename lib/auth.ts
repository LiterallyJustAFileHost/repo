import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { genericOAuth } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/auth-schema";
import { resend } from "@/lib/resend";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  emailVerification: {
    sendOnSignUp: true,

    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "LiterallyJustAFileHost <auth@mail.literallyjustafilehost.com>",
        to: user.email,
        subject: "Verify your email — LiterallyJustAFileHost",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Verify your email</h1>

            <p>Hey ${user.name || "there"},</p>

            <p>
              Thanks for signing up for LiterallyJustAFileHost!
              Click the button below to verify your email address.
            </p>

            <p style="margin: 32px 0;">
              <a
                href="${url}"
                style="
                  display: inline-block;
                  padding: 14px 24px;
                  background: #ffffff;
                  color: #000000;
                  text-decoration: none;
                  border-radius: 12px;
                  font-weight: bold;
                "
              >
                Verify email
              </a>
            </p>

            <p>
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },

    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "hackclub",
          discoveryUrl:
            "https://auth.hackclub.com/.well-known/openid-configuration",
          clientId: process.env.HACKCLUB_CLIENT_ID!,
          clientSecret: process.env.HACKCLUB_CLIENT_SECRET!,
          scopes: [
            "openid",
            "profile",
            "email",
            "name",
            "slack_id",
            "verification_status",
          ],
        },
      ],
    }),
  ],
});