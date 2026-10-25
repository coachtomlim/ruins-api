# RUINS Daily Expedition 001C / 010B-2 — Bitwarden Free key custody and independent recovery

**Issued:** 2026-10-25 (SGT)  
**Authority:** Dungeon Bravo Dev4, under Owner's request for manual Bitwarden Free setup.  
**State:** `B_CUSTODY_POLICY_READY / OWNER_SETUP_PENDING / RECOVERY_TEST_PENDING / C3_LIVE_EXPORT_HOLD / 011A_HOLD`.  
**This is guidance, not evidence that a vault, key, backup, or recovery has been created.**

## Decision and scope

Use the existing C2.5R `age` recipient-based encryption model. **Bitwarden Free's personal Secure Note** is the primary encrypted online custody location for the **private `age` identity**. An **independent sealed paper copy of that private identity** is the offline recovery location, stored securely away from the primary devices/account and not placed in a Google Drive or photo/camera backup. The **public `age` recipient** is not secret and is the *only* key material eligible to enter a later approved cloud capture configuration. The two copies must derive from the **same one key pair**, not from separate key generations.

Do not use an `age -p` symmetric passphrase for C3: that would require exposing the secret to the capture runner and deviate from the successfully tested recipient workflow. Do not use web-based key generators, ChatGPT, Cloud Shell, Work scratch, Codex, GitHub, Google Drive or Hostinger to create/store the real **private** key. Do not send any real key to the assistant (including the public recipient at this stage). No ASUS C:/E:/R: work is required or authorized. If a trusted non-ASUS computer/USB-only environment is not available, **stop before generating** and request a separate device-specific plan.

## Manual procedure — Owner-only

### 1. Create and secure Bitwarden Free

1. On your own trusted device, navigate directly to **https://bitwarden.com/** and choose **Create Free Account** (not Premium/Family). Set a long, unique master *passphrase*; never reuse a Gmail/Google/Apple/Chrome password. **Do not share it with ChatGPT or enter it into a chat, ticket, repo, or project file.**
2. Privately create a physical **Bitwarden emergency sheet** recording the account email, the master passphrase and where the offline recovery materials are held. Keep it locked away and do not photograph, scan, email or sync it. Bitwarden cannot reset a forgotten master password for a normal personal Free account.
3. In the Bitwarden web vault choose **Settings → Security → Two-step login** and enable an **authenticator app** on your phone (third-party authenticator, e.g. standalone Bitwarden Authenticator; *not* the Bitwarden vault's Premium integrated TOTP). After activation, immediately select **View recovery code** and record that code on the offline emergency sheet. The recovery code bypasses lost 2FA, **not** a forgotten master password; update it if used. Use a trusted second login to verify the new 2FA method while an already-authenticated vault session remains open.
4. Set **Settings → Security → vault timeout** to a short timeout with action **Lock** or **Log out** as appropriate; choose **Log out** on shared or untrusted machines. Avoid leaving an unlocked vault or clipboard content unattended. Do not enable unneeded sharing or browser-autofill for the recovery note.

**Free-plan limitations:** File attachments and the owner-granted Emergency Access feature require Premium; neither is used. Use a text Secure Note, not a file attachment. Do not export the vault as plaintext CSV/JSON for this setup.

### 2. Generate one `age` recipient pair entirely under Owner control

1. Choose a **trusted non-ASUS device** and a controlled key-generation environment with no sync, cloud backup or agent access. Preferred: independently trusted Linux/macOS system using its temporary memory filesystem, or a trusted, USB-booted environment with internal drives not mounted. If using Windows on another PC, use **only a removable, separately protected destination** and recognize that Windows/browser clipboard, swap, crash dumps and print queues may leave temporary traces. Do not claim absolute zero local residue.
2. Obtain the **official `age` CLI** from the project release site/source, verify its provenance and version, and select an X25519 identity format compatible with the accepted `age 1.1.1` proof. Do **not** run an unaudited online age-key generator or paste the secret into any terminal controlled by an AI agent.
3. The Owner runs the following generic command on that private trusted device, replacing `<PRIVATE_REMOVABLE_OR_VOLATILE_PATH>` with the **Owner's secure device path** (never a shared synced folder or ASUS C:):

   ```text
   age-keygen -o <PRIVATE_REMOVABLE_OR_VOLATILE_PATH>/ruins-010b2-identity.txt
   age-keygen -y <PRIVATE_REMOVABLE_OR_VOLATILE_PATH>/ruins-010b2-identity.txt
   ```

   The first command writes the **private identity** to the owner-specified file; the second prints only the **public recipient**. Do not print, screenshot or paste the private identity to ChatGPT or a remote shell. Ensure other users/processes cannot read that temporary private file.
4. Record the public recipient in a **separate nonsecret owner-held record** named `RUINS 010B2 public age recipient`. It should remain byte-for-byte unchanged across the test and later C3 approval. A public-key fingerprint/checksum may be saved as sanitized evidence **after** recovery succeeds. Only the public recipient, never the private identity, may eventually be passed to the cloud capture tool under separate C3 authorization.

### 3. Create the primary Bitwarden Secure Note

1. Open your own authenticated Bitwarden vault. Select **New item → Secure note** (item wording can vary by client). Name it `RUINS 010B2 — age recovery identity — PRIVATE`.
2. Using your *own* trusted key-generation device and UI, enter the **full, exact private identity** from the key-generation file into the note's private text area (including the entire `AGE-SECRET-KEY-1…` identity line). Keep the public recipient and human-readable purpose/version in separate nonsecret fields if desired. Do not attach a file or include database credentials.
3. **Save**, lock the vault, unlock it again, and confirm that the Secure Note remains accessible and complete. Do not let browser extensions or clipboard managers record the private identity; clear clipboard history and close local key viewers. Avoid plaintext vault exports.
4. This note is the primary custody copy. A secondary copy **in another Bitwarden item, another synced folder, G:, or the same Google account is NOT independent offline recovery**.

### 4. Create an independent offline recovery copy

1. While still at the trusted device, manually transcribe the **one private `age` identity line exactly**, preserving characters and order, on archival-quality paper; alternatively print only through a directly connected trusted printer if you can control spool-file exposure. Do not take a picture, share a QR code, email or scan it.
2. Include only its purpose (`RUINS 010B2 age identity`), date, public-recipient fingerprint/label and simple retrieval instructions. Do **not** label the envelope with the full secret or store the only password manager emergency sheet in a place inaccessible to the Owner.
3. Seal and store the paper under physical access control at a **different failure domain** from the primary computers and Bitwarden sessions (e.g., a separate secured physical location or trusted custodian). Make sure its custodian can actually return it under an Owner-authorized emergency process. Document location privately, not in Github or ChatGPT.
4. Do not retire the original generation file or go to C3 until the recovery test below passes. After verification, securely retire any unneeded working copies as best the chosen device permits; don't claim forensic erasure of OS caches or print spools. A locked-away independent offline USB can supplement paper, but is not required and must not be confused with a synced drive.

### 5. Recovery test — no user data and no sharing of secret

This tests **both** the Bitwarden copy and the independently stored paper copy. Use only a harmless text such as `RUINS 010B2 owner recovery drill` on the trusted device. Do not use an actual Supabase backup, Auth data, credentials or a real staging connection.

1. Create the harmless text file locally on the approved isolated device. Encrypt it with the saved **public recipient** using official `age`, creating `ruins-recovery-drill.txt.age`:

   ```text
   age -r <YOUR_PUBLIC_RECIPIENT> -o <PRIVATE_TEST_PATH>/ruins-recovery-drill.txt.age <PRIVATE_TEST_PATH>/ruins-recovery-drill.txt
   ```

2. **Primary test:** Using the recovered Bitwarden Secure Note (not a temporary generation file), privately reconstruct a temporary identity file on the approved non-synced device and decrypt with:

   ```text
   age -d -i <TEMP_IDENTITY_FROM_BITWARDEN> -o <PRIVATE_TEST_PATH>/primary-restored.txt <PRIVATE_TEST_PATH>/ruins-recovery-drill.txt.age
   ```

   Compare the recovered text **byte-for-byte** with the original harmless text. Verify the temporary private file was **actually reconstructed from the vault note**.
3. **Independent offline test:** Lock/log out of Bitwarden and **do not reuse the primary identity file**. Retrieve the sealed paper copy from its offline location, privately re-enter it into a **different** temporary identity file, and decrypt the **same** encrypted challenge. Compare the recovered bytes independently. After test, reseal and return the paper copy; do not leave the paper copy on a desk.
4. Check that both reconstructed identities yield the **same public recipient** with `age-keygen -y`. Record only a *nonsecret* success receipt with: `BITWARDEN_PRIMARY_RECOVERY_PASS`, `INDEPENDENT_OFFLINE_RECOVERY_PASS`, public-recipient fingerprint, date, tested `age` version, and **custody labels but no private key or master password**. If either fails or there is any transcription uncertainty: mark **FAIL**, retain C3 HOLD, and repair/retest privately.
5. Clean up test plaintext and **temporary** identity files on the approved device, then close/lock the vault. Do **not** destroy the two independently tested custody copies. No amount of encrypted-backup hash validation substitutes for this recovery drill.

### 6. Operational continuity and rotation

- Protect both the Bitwarden master password (and 2FA recovery code) and the `age` private identity. Bitwarden account recovery is **different** from recovering the encrypted database archive. A Bitwarden 2FA recovery code does not decrypt an age archive; a lost master password may make the vault inaccessible even with the 2FA code.
- Keep old age identities for as long as any archive encrypted to them is retained. Rotating the recipient does **not** automatically re-encrypt existing archives.
- Rehearse offline recovery after key rotation and periodically (suggested every six months), logging nonsecret proof only. Check physical copy readability and access if the custodian/location changes.
- Because Free does not include owner-granted Emergency Access, plan personal access continuity around the separately stored offline identity and emergency sheet—not an assumption of Bitwarden's paid Emergency Access.

## Hard decision gate

| Gate | Current result | Who performs |
|---|---|---|
| Bitwarden Free account, 2FA and emergency sheet | **PENDING** | Owner manually |
| Real age identity generated outside Work, cloud runner and ASUS C: | **PENDING** | Owner manually, on trusted environment |
| Bitwarden Secure Note saved and independently reopened | **PENDING** | Owner manually |
| Offline paper identity separately stored | **PENDING** | Owner manually |
| Bitwarden and offline copies each decrypt test challenge | **PENDING** | Owner manually |
| Sanitized proof receipt and candidate public recipient pinned | **PENDING** | Dev4 verifies only nonsecret assertions/evidence |
| C3 live Supabase export | **HOLD / NOT AUTHORIZED** | Needs new explicit Owner approval |
| 011A private-schema migration | **HOLD / NOT AUTHORIZED** | Needs separate approval and backup readiness |

**Stop conditions:** no trusted key-generation environment; Bitwarden account/2FA recovery not verified; insecure secret-sharing/pasting; unprotected offline copy; inability to reconstruct key from sealed copy; any failed decrypt; unresolved key provenance, wrong recipient or version. No paid subscription is needed. No credential input to agents. The Owner has not approved the real database connection, Auth-data transfer to Google Cloud Shell, backup or migration.

## Authoritative external documentation checked

- Bitwarden account setup and secure notes: https://bitwarden.com/help/courses/password-manager-personal/ and https://bitwarden.com/help/managing-items/ .
- Bitwarden Free account features and paid exceptions: https://bitwarden.com/pricing/ .
- Bitwarden free 2FA: https://bitwarden.com/en-gb/help/setup-two-step-login/ .
- Bitwarden recovery code: https://bitwarden.com/nl-nl/help/two-step-recovery-code/ .
- Bitwarden timeout: https://bitwarden.com/help/vault-timeout/ .
- Bitwarden cautions about unencrypted exports: https://bitwarden.com/help/export-your-data/ .
- age key pair and CLI documentation: https://github.com/FiloSottile/age/blob/main/doc/age-keygen.1.ronn and https://github.com/FiloSottile/age/blob/main/README.md .

**What is next:** Dev4 publishes this plan only, then Owner executes it privately on appropriate device(s). On a completed private drill, Owner reports **status words only** (not keys) and Dev4 records a sanitized custody PASS or a reason for HOLD. C3 and 011A are held throughout.
