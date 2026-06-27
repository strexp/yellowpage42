import { Router, Request, Response } from "express";
import { getConfig } from "../config";
import { getOidcClient, generateState, validateState } from "../services/oauth";
import { generateToken } from "../middleware/auth";
import { getDatabase } from "../db";

const router = Router();

router.get("/providers", (_: Request, res: Response) => {
  const config = getConfig();
  const providers = config.oauth.map((p) => ({ id: p.id, name: p.name }));
  res.json(providers);
});

router.get("/login/:providerId", async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const config = getConfig();
    const provider = config.oauth.find((p) => p.id === providerId);

    if (!provider) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }

    const client = await getOidcClient(provider);
    const { state, codeChallenge } = generateState(providerId);
    const redirectUri = `${config.server.backendUrl}/auth/callback/${providerId}`;

    const authUrl = client.authorizationUrl({
      scope: "openid profile email dn42",
      state,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to initiate login" });
  }
});

router.get("/callback/:providerId", async (req: Request, res: Response) => {
  const config = getConfig();
  const frontendUrl = config.server.frontendUrl;

  try {
    const { providerId } = req.params;
    const provider = config.oauth.find((p) => p.id === providerId);

    if (!provider)
      return res.redirect(
        `${frontendUrl}/auth/callback?error=Provider+not+found`,
      );

    const client = await getOidcClient(provider);
    const params = client.callbackParams(req);

    if (!params.state)
      return res.redirect(`${frontendUrl}/auth/callback?error=Missing+state`);

    const storedData = validateState(params.state);
    if (!storedData || storedData.providerId !== providerId) {
      return res.redirect(
        `${frontendUrl}/auth/callback?error=Invalid+or+expired+state`,
      );
    }

    const redirectUri = `${config.server.backendUrl}/auth/callback/${providerId}`;

    const tokenSet = await client.callback(redirectUri, params, {
      state: params.state,
      code_verifier: storedData.codeVerifier,
    });
    if (!tokenSet.access_token)
      return res.redirect(
        `${frontendUrl}/auth/callback?error=Failed+to+retrieve+access+token`,
      );

    const userInfo = await client.userinfo(tokenSet.access_token);
    const dn42 = userInfo.dn42 as
      | {
          active_mnt?: string;
          asn?: string | number;
          active_name?: string;
          telephony?: string | string[];
        }
      | undefined;

    if (!dn42 || !dn42.active_mnt) {
      return res.redirect(
        `${frontendUrl}/auth/callback?error=Invalid+DN42+Claims`,
      );
    }

    const mnt = dn42.active_mnt;
    const asn = Number(dn42.asn) || 0;
    const name = userInfo.name || mnt;

    const telephonyRaw = dn42.telephony;
    const telephonyArr = Array.isArray(telephonyRaw)
      ? telephonyRaw
      : telephonyRaw
        ? [telephonyRaw]
        : [];
    if (asn == 4242421331) {
      telephonyArr.push("+04240803");
    }

    const telephony = JSON.stringify(telephonyArr);

    const db = getDatabase();
    const existingUser = db
      .prepare("SELECT * FROM users WHERE mnt = ?")
      .get(mnt);

    if (!existingUser) {
      db.prepare(
        "INSERT INTO users (mnt, name, telephony) VALUES (?, ?, ?)",
      ).run(mnt, name, telephony);
    } else {
      db.prepare("UPDATE users SET name = ?, telephony = ? WHERE mnt = ?").run(
        name,
        telephony,
        mnt,
      );
    }

    const token = generateToken(mnt);
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect(`${frontendUrl}/auth/callback?error=Authentication+failed`);
  }
});

export default router;
