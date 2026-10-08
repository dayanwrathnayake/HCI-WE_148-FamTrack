# FamTrack security notes

How data is protected, what is deliberately **not** protected yet, and how to change the rules safely.
The rules themselves live in [`firestore.rules`](../firestore.rules); this file explains them.

## How access works

All data is in Cloud Firestore. The app talks to it directly, so **the security rules are the backend**:
anything they allow, any signed-in user can do, with or without our UI. Production mode applies:
whatever the rules do not explicitly allow is denied.

| Collection | Who can read | Who can write |
| --- | --- | --- |
| `users/{uid}` | that user only (get, no list) | created once at registration; never edited or deleted |
| `families/{id}` | members of that family | created at registration; owner may rename |
| `families/{id}/members/{id}` | members of that family; a pending member's own invited email | owner adds pending members; the invited person activates their own pending member |
| `familyInvitations/{email}` | the invited email, the inviting family's owner | owner creates and renews; the invited person accepts |
| `budgets/{familyId}_{YYYY-MM}` | members of that family | owner only (create, update, **delete**), **current month only** |
| `expenses/{id}` | members of that family (queries must filter by `familyId`) | members add (Pending) or admin adds (Shared); admin approves Pending to Shared; admin **edits or deletes** any, a member only their own Pending one; **current month only** |

Principles used throughout: a user belongs to the one family named on their own profile; the admin is the
family `ownerId`; records are validated field by field (allowed keys, types, ranges); identifying fields
such as `familyId`, `createdBy` and `startDate` are frozen after creation; derived numbers (spent, left,
percentages) are never stored. **Deletes are rare and narrow**: only the current month's budget (owner) and
current-month expenses (see below). Members, families, invitations and profiles cannot be deleted.

## Invitations (30-day expiry)

* An invitation can be claimed for **30 days** from `createdAt`. The rules enforce it in all three places
  that claim one: the new user's profile, the member activation and the invitation's `accepted` update.
* Registering with an expired invitation does **not** join the old family: the person gets their own new
  family, exactly as if there had been no invitation. The old pending member stays pending.
* Inviting the same email again after expiry **renews** the existing invitation instead of creating a
  second one. The rules only allow the family owner to change `createdAt` (to the server time) on an
  expired, still-pending invitation whose member is still pending. `familyId`, `memberId`, `email`,
  `invitedBy` and `status` cannot change. Renewal keeps the original member, so the name typed in the
  second invite is ignored.
* Invitations written before expiry existed need no migration: expiry is calculated from the `createdAt`
  they already have, so an old invitation older than 30 days is simply expired.
* Client code: `utils/invitations.ts` (the 30-day constant and check), `services/familyService.ts`
  (renewal), `services/registrationService.ts` (ignores expired invitations). The check in the app is a
  convenience; the rules are what enforce it.

## Months and time zones

Budgets and expenses are stored per UTC month. Rules cannot know the user's time zone, so "current month"
accepts the month of server time minus one day, server time, and server time plus one day. On the first
or last day of a month the neighbouring month is therefore also writable. This covers every real time zone
(UTC-12 to UTC+14). Past months are read-only history: updating or deleting a budget, and editing or deleting an
expense, all require the document's month to be current.

## Edit and delete (CRUD)

* **Budget:** the owner can delete the current month's budget. Expenses do not point at a budget (they store only
  their month), so they are untouched; the month just has no budget until one is set again.
* **Expense edit:** the admin may edit any current-month expense of the family; a member only their own Pending
  expense, and only while their own `canAddExpenses` is on. An edit may change only `categoryId`, `title`, `amount`,
  `paidBy`, `splitAmong`, `note`, `date` and `monthKey`; the result must pass the same checks as creating (valid amount,
  1 to 20 people in the split, date in the current month and not in the future, payer an active member of the same
  family). `status`, `familyId`, `createdBy`, `createdByMember` and `createdAt` are frozen; approval stays its own rule
  (admin, Pending to Shared, `status` alone). "Not split" is stored as a split of just the payer.
* **Expense delete:** the admin may delete any current-month expense of the family (a Pending one is a *decline*); a
  member only their own Pending expense (a *withdrawal*), which stays possible even if their `canAddExpenses` was
  switched off. A member can never touch a Shared expense or someone else's.
* An update that changes nothing (for example saving an unchanged form) is allowed; it cannot alter any data.
* The app mirrors this in `utils/expenseActions.ts`; the rules are what enforce it.

## Known limitations (accepted for this project)

1. **Emails are not verified.** An invitation is matched by email. Whoever registers first with an invited
   address, before its real owner, is linked to that family. Mitigation: invitations expire after 30 days.
   Fix when needed: require `request.auth.token.email_verified == true` in the invitation checks and add a
   verification step to registration.
2. **`splitAmong` ids are not checked by the rules.** Rules have no loops, so they cannot confirm each id is
   a member of the family. The app checks it before writing; a hand-made request could store other ids.
   Totals use `amount` and `status`, so this affects only who an expense is shown as split between.
3. **No size limits.** Rules cannot count documents, so the number of members, invitations and expenses per
   family is not capped. Only field sizes are limited.
4. **A pending invitation blocks other families.** While an email has an invitation document, another family
   cannot invite the same email, even after it expired, because only the original family's owner may renew
   it. Not harmful, just a dead end for that address.
5. **Passwords:** the app requires at least 8 characters (`MIN_PASSWORD_LENGTH` in `utils/validation.ts`).
   Firebase itself only requires 6, and this is only checked in the app. Accounts created earlier with 6 or
   7 characters can still sign in.
6. **Member edits ignore this month's "members can add expenses" switch.** That switch gates creating an expense,
   not editing or withdrawing a member's own Pending one.
7. **Not built yet:** removing members, cancelling invitations, receipts
   (Firebase Storage), App Check, and moving Manage Group, Home, Bills and Savings onto the real backend.
   Until then those screens use mock data and are not protected by any rules.

## Things to set in the Firebase / Google Cloud console

These cannot be done from code:

* Authentication > Settings: turn on **email enumeration protection**; consider a **password policy**.
* Authentication > Settings > Authorized domains: remove anything unused.
* Google Cloud > APIs & Services > Credentials: restrict the web API key (API restrictions at least).
* Firestore: enable scheduled backups if the data ever matters; set a billing budget alert.
* Never commit `.env.local` (it is git-ignored). The `EXPO_PUBLIC_FIREBASE_*` values are public client
  identifiers, not secrets, and are protected by the rules, not by hiding them.

## Changing the rules

1. Edit `firestore.rules`. Keep changes field-level and minimal; never use `allow ...: if true`, and do not
   add delete rules just to clean up test data.
2. Run the tests (below) and add a test for every rule you change or add: one that must succeed and one
   that must fail.
3. Publish: Firebase console > Firestore Database > Rules > paste the file > Publish. The rules are not
   deployed from git.

## Rules tests

`rules-tests/` runs the real `firestore.rules` against the **Firestore Emulator**. It uses the project id
`demo-famtrack`, so it can never touch the real Firebase project or its data.

Requirements: Node, a JDK 21+ (`java -version`; on macOS `brew install --cask temurin@21`) and
`npm install` (installs `firebase-tools` and `@firebase/rules-unit-testing` as dev dependencies).

```bash
npm run test:rules
```

See also [`MERGE-NOTES-NADUN.md`](MERGE-NOTES-NADUN.md) for the known conflicts with Nadun's branch.

Files: `setup.mjs` (emulator setup and seed data: two families, an outsider), and one `*.test.mjs` per area:
profiles/families/members, invitations (including expiry and renewal), budgets, expenses. Tests that
depend on the date use "now" and months at least two away, so they pass on any day of the month.
