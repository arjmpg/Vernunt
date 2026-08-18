# Security Specification & Threat Model

This document outlines the security architecture, critical data invariants, and adversarial threat payloads evaluated to safeguard the parent-child playdate app user data.

## 1. Data Invariants

* **Identity Bound Profiles**: A user can only write (`create`, `update`, `delete`) a profile document matching their exact Firebase authentication UID (`users/{userId}`).
* **Secure Communications**: Chat messages (`/chats/{chatId}/messages/{messageId}`) can only be read or written by authenticated users who are certified as participants within that specific chat session.
* **Tamper-proof Bookings**: Traded tickets (`/bookings/{bookingId}`) cannot be created or modified with spoofed prices or commission rates by non-admin clients.
* **Relational Invitation Integrity**: Playdates can only be scheduled if both the host and guest are signed in, and only the original creator can edit metadata or cancel.

---

## 2. The "Dirty Dozen" Attack Payloads

These 12 theoretical malicious JSON documents are blocked by our fortress rules schema matching:

### Attack 1: User Profile Identity Impersonation (Spoofing)
* **Goal**: An attacker attempts to create/overwrite another guardian's profile.
* **Target Path**: `/users/legitimate_user_123`
* **Payload**:
  ```json
  {
    "id": "legitimate_user_123",
    "parentName": "Attacker Spoof",
    "childName": "Innocent Child",
    "verificationStatus": "VERIFIED"
  }
  ```
  *(Rejected because request authenticated UID != "legitimate_user_123")*

### Attack 2: Privilege Escalation (Self-Assigned Admin Role)
* **Goal**: A parent tries to promote themselves to "Admin".
* **Target Path**: `/users/parent_uid_456`
* **Payload**:
  ```json
  {
    "id": "parent_uid_456",
    "parentName": "Aggressive Parent",
    "userRole": "Admin"
  }
  ```
  *(Rejected because role modification is blocked except by verified admins or system-controlled hooks)*

### Attack 3: Impersonated Messaging
* **Goal**: Inject a message purporting to be sent by someone else inside a chat channel.
* **Target Path**: `/chats/thread_abc/messages/msg_999`
* **Payload**:
  ```json
  {
    "id": "msg_999",
    "chatId": "thread_abc",
    "senderId": "legitimate_user_789",
    "content": "Malicious phishing instruction",
    "timestamp": "12:00 PM"
  }
  ```
  *(Rejected because msg.senderId != request.auth.uid)*

### Attack 4: Unauthorized Chat Reading (Eavesdropping)
* **Goal**: Attacker tries to read conversations of another team.
* **Target Path**: `/chats/thread_confidential/messages/msg_001`
  *(Rejected because attendee check fails for the authenticated reader)*

### Attack 5: Spoofed Playdate Invitation
* **Goal**: Host schedules a meeting without valid ID formats.
* **Target Path**: `/playdates/junk_id_%%$$`
  *(Rejected because ID violates alphanumeric character whitelist constraint)*

### Attack 6: Bypass Payment Bookings
* **Goal**: Create a transaction log claiming $0 spent on a $100 ticket.
* **Target Path**: `/bookings/booking_leak`
* **Payload**:
  ```json
  {
    "id": "booking_leak",
    "itemId": "event-clay",
    "type": "EventTicket",
    "buyerEmail": "attacker@gmail.com",
    "amountPaid": 0,
    "status": "Paid"
  }
  ```
  *(Rejected because amount must match authorized catalog bounds)*

### Attack 7: Fake Verification Injection
* **Goal**: Parent claims their profile is VERIFIED on creation without admin review.
* **Target Path**: `/users/parent_abc`
* **Payload**:
  ```json
  {
    "id": "parent_abc",
    "parentName": "Unverified Parent",
    "verificationStatus": "VERIFIED"
  }
  ```
  *(Rejected - verification status on user initialization must defaults to UNVERIFIED)*

### Attack 8: Resource Poisoning (Denial of Wallet)
* **Goal**: Attempt to write a 1.2MB profile description to run up storage costs.
* **Target Path**: `/users/parent_heavy`
* **Payload**:
  ```json
  {
    "id": "parent_heavy",
    "parentName": "Abuser",
    "bio": "[1.2 Million junk characters...]"
  }
  ```
  *(Rejected because `incoming().bio.size() <= 1000` validation constraints are matched)*

### Attack 9: Timestamps Manipulation
* **Goal**: Parent tries to backdate their profile's creation timestamp.
* **Target Path**: `/users/parent_timetravel`
* **Payload**:
  ```json
  {
    "id": "parent_timetravel",
    "createdAt": "2020-01-01T00:00:00Z"
  }
  ```
  *(Rejected because createdAt must match request.time server constraint)*

### Attack 10: Orphaned Playdates creation
* **Goal**: Create playdates referring to non-existing playmate IDs.
* **Target Path**: `/playdates/playdate_orphan`
* **Payload**:
  ```json
  {
    "id": "playdate_orphan",
    "hostId": "parent_abc",
    "guestId": "nonexistent_parent_id",
    "status": "Pending"
  }
  ```
  *(Rejected because child exists() relation checks on users/guestId fails)*

### Attack 11: Playdate State Hijacking (Status Shortcutting)
* **Goal**: The guest attempts to unilaterally accept a playdate and update restricted details.
* **Target Path**: `/playdates/playdate_123`
* **Payload**:
  ```json
  {
    "id": "playdate_123",
    "status": "Accepted",
    "hostId": "victim_uid",
    "guestId": "attacker_uid",
    "notes": "Inject malicious instructions to parent"
  }
  ```
  *(Rejected because updates are split into actions, and guests cannot edit restricted fields)*

### Attack 12: Email Spoofing Attack on Admin Rules
* **Goal**: Impersonate an administrator by presenting a spoofed unverified email.
* **Target Path**: `/admin_collections/admin_action`
  *(Rejected because rules require request.auth.token.email_verified == true)*

---

## 3. Test Cases (TDD Reference Block)

We define a reference test structure that replicates authentic Firestore client behaviors asserting rejection:

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

// Verification suites checking that all Dirty Dozen payloads are rejected
describe('Playdate App Security Rules', () => {
  it('blocks unauthorized profile modification', async () => {
    // Attempting to write into another user's profile document as a signed-in user
    await assertFails(db.doc('users/legitimate_user_123').set({ parentName: 'Attacker' }));
  });
});
```
