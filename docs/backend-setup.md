# Backend setup: authentication foundation

The app uses the existing team Firebase project. `.env.local` is ignored by Git. Never place service-account credentials in an Expo app.

## Live project

1. Fill the six configuration values listed in `.env.example` using the team's Firebase web app settings.
2. Confirm Email/Password is enabled in Firebase Authentication and Firestore exists. Confirm the deployed rules match this repository before testing writes.
3. Run `npx expo start -c` after changing environment values.

No rules or functions are deployed automatically by the app. Future photo uploads and trusted backend functions need Storage/Functions configuration in the same project.

## Local testing

Use Node 22.13 or newer compatible Node and Java 21 or newer for the Firebase CLI/emulators. Run:

```sh
npm run test:firebase
npm run emulators
```

Tests use `demo-famtrack` and local Auth/Firestore emulators. They do not write to the live project. The emulator UI is at http://localhost:4000. Local accounts/data are temporary.

To point Expo at the running emulators, add these values to `.env.local`, then restart Expo:

```dotenv
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1
```

For the Android emulator use `10.0.2.2`. For a physical phone use the computer's LAN IP on the same trusted network. Emulator mode forces the database project to `demo-famtrack` and is disabled in production builds. Set the flag back to `false` and restart to return to the real project.

## Authentication acceptance checks

- Register with a new test email: profile, family, and admin member exist together.
- Log out, then log in with that account. Incorrect credentials show an error.
- Reload/restart while signed in: the correct user's session is restored.
- Log out: protected screens become inaccessible, including through direct URLs/back navigation.
- Sign into another account: previous account's session data is cleared.
- Invite a second test email, register it, and verify it joins the existing family rather than creating another family.
- Password reset errors are shown without revealing whether an email is registered. In emulator mode the reset link is available from the emulator output rather than delivered by email.

## My Account deployment

Name/phone/photo edits now use Firestore and Storage. Name edits update the active family member in the same batch. Phone is optional; it is a contact field, not phone authentication.

For this university prototype, email changes do not send verification messages. My Account accepts only `@gmail.com` addresses and requires the current password when the email changes. Save reauthenticates with Firebase, then calls `changeAccountEmail`; the server requires a recent password sign-in, updates the caller's Auth email and Firestore profile, and rejects duplicate/non-Gmail addresses. The address remains unverified. The password is never sent to the custom function or stored in Firestore. `syncAccountEmail` repairs profile email from Auth on login if needed, ignoring client-provided email values.

Install server dependencies with `npm install --prefix functions`. Enable Storage and Cloud Functions in the team's project, then deploy using an explicit project ID:

```sh
npx --yes firebase-tools@15.33.0 deploy --project YOUR_TEAM_PROJECT_ID --only firestore:rules,storage,functions:syncAccountEmail,functions:changeAccountEmail
```

This command changes shared cloud configuration. Review the checked-in rules with your teammates before deployment; preserve any newer rules from their modules. Storage rules allow owner uploads of JPEG/PNG/WebP up to 5 MB and owner/family reads. Confirm the Storage/Functions billing prerequisites in the Firebase console. No cloud deployment has been performed by these code changes.

Local tests now start Auth, Firestore, Storage, and Functions. The server runtime is Node 22; use Node 22 for the Functions emulator too. Photo tests cover ownership, type, and size; profile tests reject forged family IDs/email/roles. Email tests cover wrong passwords, duplicate/non-Gmail addresses, anonymous requests, old/new login credentials, and profile synchronization.

## Income and history

Income uses Firestore directly and does not need Storage or Cloud Functions. The live photo/email deployments are deferred because the team project has no Blaze billing/Storage setup.

`incomes/{id}` stores familyId, createdBy (Firebase UID), memberId, title, amountCents (integer), source, date (chosen day at midnight UTC), monthKey, Received/Expected status, familyBudget, version, and server creation/update timestamps. Income amounts retain two decimal places. The UI maps dates back to calendar-day strings, independent of the device timezone.

Family members may read income in their own family; only the creator may change or delete it, including when another viewer is admin. Creation requires active membership. My income selects the current user's entries; Family income selects other members. Source filters and month selection apply to the displayed totals. Income stays visible to the family even when the Family contribution switch is off; that switch does not automatically raise the budget limit. Monthly repetition is deferred.

No income is seeded into the app. New families see an empty state until someone adds real income. Listeners reset on family/account/month changes. Writes are awaited before success messages; editing/deletion uses a version check to protect against changes from another device. Edit links load the specific record, including records in an older month.

Deploy only the Firestore rules for this feature, preserving the currently deployed teammate rules first. Test with two users in one family and a third in another: add/edit/delete, reopen/reload, change months, decimal totals, creator-only actions, and live updates. Income notification persistence will be connected in the Notifications stage.

Current account deletion and notification backend work is still pending. Invitations currently match unverified email addresses; email ownership verification remains a known limitation of the existing registration design.
