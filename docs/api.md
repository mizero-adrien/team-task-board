# TeamBoard: API Contract

> **Status:** Draft v1, for team review
> **Companion documents:** `app_concept.md`, `schema.md`
> **Base path:** `/api`

---

## 1. Purpose

This is the agreement between the frontend and the backend. Each feature owner builds the routes they own, and the frontend builds against this file without waiting for them. If a route needs to change, change this file in a pull request first.

## 2. Conventions

| Topic | Rule |
|---|---|
| Format | JSON in, JSON out. Image uploads are not part of this API. |
| Authentication | `Authorization: Bearer <token>` on every route except the ones marked **Public** |
| IDs | 24-character strings, always named `id` (never `_id`). References use `<name>Id`, for example `boardId`. |
| Dates | Timestamps are ISO 8601 UTC (`2026-11-09T08:30:00.000Z`). Due dates are `YYYY-MM-DD` text. |
| "Today" | Calculated in the app time zone, `Africa/Kigali` |
| Empty values | Optional fields are `null` when empty, never missing, in responses |
| Unknown fields in a request | Ignored, never saved. Fields you must not set (such as `role` or `assigneeId` on AI cards) are simply not accepted. |
| Deleting | Returns `204 No Content` with no body |
| Request size | JSON bodies are limited to 1 MB |

### 2.1 Access levels used in the tables

| Level | Meaning |
|---|---|
| **Public** | No token needed |
| **User** | Signed in, and not blocked |
| **Member** | Signed in and a member of the workspace that owns the resource |
| **Owner** | Member whose role in that workspace is `owner` |
| **Admin** | User with the `admin` role |

### 2.2 Error format

Every error has the same shape, so the frontend handles them in one place:

```json
{
  "message": "Validation failed",
  "code": "VALIDATION_FAILED",
  "errors": [
    { "field": "title", "message": "Title must be at most 200 characters" }
  ]
}
```

| Field | Meaning |
|---|---|
| `message` | A sentence that is safe to show to the user |
| `code` | A stable machine-readable name. The frontend switches on this, never on the message text. |
| `errors` | Only for validation errors. `field` can be a nested path such as `cards.2.title`. |

### 2.3 Status codes

| Status | `code` | When |
|---|---|---|
| 200, 201, 204 | | Success (OK, created, no content) |
| 400 | `VALIDATION_FAILED`, `BAD_REQUEST` | Invalid body, query or id |
| 401 | `UNAUTHORIZED` | Missing, invalid or expired token, or the password changed since the token was issued |
| 403 | `FORBIDDEN` | Signed in, but the action needs a higher role (for example a member trying to delete a board) |
| 403 | `ACCOUNT_BLOCKED` | The account is blocked. The body also contains `reason`. |
| 404 | `NOT_FOUND` | The resource does not exist **or the user is not allowed to know it exists** |
| 409 | `CONFLICT`, and specific codes below | Duplicate, limit reached, or the state changed |
| 410 | `INVITE_INVALID` | Invite is unknown, expired, revoked or used up (one message for all four reasons) |
| 422 | `AI_INVALID_OUTPUT` | The AI answered, but its output could not be used |
| 429 | `RATE_LIMITED`, `AI_LIMIT_REACHED` | Too many requests, or the daily AI limit was used |
| 500 | `SERVER_ERROR` | Unexpected error. The message is generic. |
| 502 | `AI_UNAVAILABLE` | The AI provider failed or timed out |

**Why 404 and not 403 for other teams' data:** a 403 would confirm that the board exists. A non-member gets the same 404 as for an id that does not exist.

### 2.4 Rate limits

| Routes | Limit |
|---|---|
| Whole API | 300 requests per 15 minutes per IP |
| `POST /auth/login` | 10 **failed** attempts per 15 minutes per IP |
| `POST /auth/register` | 20 per hour per IP |
| `POST /auth/forgot-password` | 5 per hour per IP |
| `POST /auth/reset-password/:token` | 10 per 15 minutes per IP |
| `GET /invites/:token` and `POST /invites/:token/accept` | 30 per 15 minutes per IP |
| `POST /boards/:boardId/ai/breakdown` | 10 per user per day (see section 11) |

### 2.5 Pagination

| Style | Used for | Request | Response |
|---|---|---|---|
| **Cursor** | Activity feed | `?limit=20&before=<cursor>` | `{ "items": [...], "nextCursor": "…" or null }` |
| **Page** | Admin tables | `?page=1&limit=20` | `{ "items": [...], "total": 134, "page": 1, "limit": 20 }` |

`limit` defaults to 20 and is capped at 100.

## 3. Route summary

| Area | Method and path | Access | Owner |
|---|---|---|---|
| **Auth** | `POST /auth/register` | Public | Ubald |
| | `POST /auth/login` | Public | Ubald |
| | `GET /auth/me` | User | Ubald |
| | `POST /auth/forgot-password` | Public | Ubald |
| | `POST /auth/reset-password/:token` | Public | Ubald |
| **Workspaces** | `POST /workspaces` | User | Ubald |
| | `GET /workspaces` | User | Ubald |
| | `GET /workspaces/:workspaceId` | Member | Ubald |
| | `PATCH /workspaces/:workspaceId` | Owner | Ubald |
| | `GET /workspaces/:workspaceId/members` | Member | Ubald |
| | `DELETE /workspaces/:workspaceId/members/:userId` | Owner | Ubald |
| **Invites** | `POST /workspaces/:workspaceId/invites` | Owner | Ubald |
| | `GET /workspaces/:workspaceId/invites` | Owner | Ubald |
| | `DELETE /workspaces/:workspaceId/invites/:inviteId` | Owner | Ubald |
| | `GET /invites/:token` | Public | Ubald |
| | `POST /invites/:token/accept` | User | Ubald |
| **Boards** | `POST /workspaces/:workspaceId/boards` | Member | Adrien |
| | `GET /workspaces/:workspaceId/boards` | Member | Adrien |
| | `GET /boards/:boardId` | Member | Adrien |
| | `PATCH /boards/:boardId` | Member | Adrien |
| | `DELETE /boards/:boardId` | **Owner** | Adrien |
| | `GET /boards/:boardId/activity` | Member | Adrien |
| **Lists** | `POST /boards/:boardId/lists` | Member | Adrien |
| | `PATCH /lists/:listId` | Member | Adrien |
| | `POST /lists/:listId/move` | Member | Adrien |
| | `DELETE /lists/:listId` | Member | Adrien |
| **Cards** | `POST /lists/:listId/cards` | Member | Rachel |
| | `GET /cards/mine` | User | Rachel |
| | `GET /cards/:cardId` | Member | Rachel |
| | `PATCH /cards/:cardId` | Member | Rachel |
| | `POST /cards/:cardId/move` | Member | Rachel |
| | `DELETE /cards/:cardId` | Member | Rachel |
| | `POST /boards/:boardId/cards/bulk` | Member | Rachel |
| **Comments** | `GET /cards/:cardId/comments` | Member | Rachel |
| | `POST /cards/:cardId/comments` | Member | Rachel |
| | `DELETE /comments/:commentId` | Author or Owner | Rachel |
| **AI** | `POST /boards/:boardId/ai/breakdown` | Member | Fabrice |
| | `GET /ai/usage` | User | Fabrice |
| **Admin** | `GET /admin/stats` | Admin | Ubald |
| | `GET /admin/users` | Admin | Ubald |
| | `POST /admin/users/:userId/block` | Admin | Ubald |
| | `POST /admin/users/:userId/unblock` | Admin | Ubald |
| | `GET /admin/workspaces` | Admin | Ubald |

**Route order warning (Express):** `GET /cards/mine` must be registered **before** `GET /cards/:cardId`, or "mine" is read as a card id.

## 4. Shared objects

These shapes appear in many responses.

**User**
```json
{ "id": "665f0f…01", "name": "Ubald Impuhwe", "email": "ubald@example.com", "role": "user" }
```

**Person** (a user shown inside another object)
```json
{ "id": "665f0f…04", "name": "Fabrice Nsanzamahoro" }
```

**Workspace**
```json
{
  "id": "665f1a…01",
  "name": "Group 8",
  "description": "School website project",
  "role": "owner",
  "memberCount": 4,
  "boardCount": 2,
  "createdAt": "2026-11-02T09:00:00.000Z"
}
```
`role` is the **current user's** role in that workspace.

**List**
```json
{ "id": "665f1b…10", "boardId": "665f1b…02", "name": "To do", "position": 1024, "isDone": false }
```

**Card**
```json
{
  "id": "665f1c…05",
  "boardId": "665f1b…02",
  "listId": "665f1b…10",
  "workspaceId": "665f1a…01",
  "title": "Collect content for the homepage",
  "description": "Get the school's mission, contact details and 5 photos.",
  "dueDate": "2026-11-12",
  "isOverdue": false,
  "assignee": { "id": "665f0f…02", "name": "Adrien Mizero" },
  "position": 1024,
  "createdBy": { "id": "665f0f…04", "name": "Fabrice Nsanzamahoro" },
  "createdVia": "ai",
  "createdAt": "2026-11-09T08:30:00.000Z",
  "updatedAt": "2026-11-09T08:30:00.000Z"
}
```
`assignee` and `dueDate` are `null` when empty. `isOverdue` is calculated by the server: the due date is before today **and** the card's list is not marked `isDone`.

**Comment**
```json
{
  "id": "665f1d…06",
  "cardId": "665f1c…05",
  "author": { "id": "665f0f…03", "name": "Rachel Mukawera" },
  "text": "Can we use the school colours?",
  "canDelete": true,
  "createdAt": "2026-11-09T10:15:00.000Z"
}
```
`canDelete` tells the frontend whether to show the delete button for the current user (they wrote it, or they are the workspace owner).

**Activity**
```json
{
  "id": "665f1e…07",
  "type": "card.moved",
  "actor": { "id": "665f0f…03", "name": "Rachel Mukawera" },
  "cardId": "665f1c…05",
  "meta": { "cardTitle": "Design homepage", "fromList": "To do", "toList": "Doing" },
  "message": "Rachel Mukawera moved Design homepage from To do to Doing",
  "createdAt": "2026-11-10T07:45:00.000Z"
}
```
`message` is written by the server from the sentences in `schema.md` section 5.9, so every screen shows the history in the same words.

## 5. Auth (owner: Ubald)

### `POST /auth/register` (Public)

| Field | Rules |
|---|---|
| `name` | 2 to 50 characters |
| `email` | valid email, stored in lowercase |
| `password` | 8 to 72 characters, at least one letter and one number |

```json
{ "name": "Rachel Mukawera", "email": "rachel@example.com", "password": "Board2026" }
```

**201**
```json
{ "id": "665f0f…03", "name": "Rachel Mukawera", "email": "rachel@example.com", "role": "user" }
```

**Errors:** 400 `VALIDATION_FAILED`, 409 `EMAIL_TAKEN` ("An account with this email already exists"), 429.
There is no token in the response. The client signs in right after. A `role` in the request is ignored.

### `POST /auth/login` (Public)

```json
{ "email": "rachel@example.com", "password": "Board2026" }
```

**200**
```json
{ "token": "eyJhbGciOi…", "user": { "id": "665f0f…03", "name": "Rachel Mukawera", "email": "rachel@example.com", "role": "user" } }
```

**Errors**

| Status | `code` | Meaning |
|---|---|---|
| 401 | `INVALID_CREDENTIALS` | Wrong email or password (the same message for both) |
| 403 | `ACCOUNT_BLOCKED` | Correct credentials, but the account is blocked |
| 429 | `RATE_LIMITED` | Too many failed attempts |

**Blocked response**
```json
{
  "message": "Your account has been blocked",
  "code": "ACCOUNT_BLOCKED",
  "reason": "Repeated spam in comments",
  "blockedAt": "2026-11-12T11:00:00.000Z"
}
```
The token is valid for 7 days. The server checks the database on **every** request, so blocking, a password change or a role change take effect at once.

### `GET /auth/me` (User)

**200:** a **User** object. The frontend calls this on startup to confirm the saved session.

### `POST /auth/forgot-password` (Public)

```json
{ "email": "rachel@example.com" }
```
**200** `{ "message": "If an account with that email exists, a password reset link has been sent." }`, **always**, whether or not the account exists. The emailed link points at `/reset-password/<token>` on the frontend.

### `POST /auth/reset-password/:token` (Public)

```json
{ "password": "NewBoard2026" }
```
**200** `{ "message": "Password has been reset successfully" }`
**Errors:** 400 `VALIDATION_FAILED`, 400 `RESET_TOKEN_INVALID` ("Invalid or expired reset token"). The token works once and expires after 15 minutes.

## 6. Workspaces and members (owner: Ubald)

### `POST /workspaces` (User)

| Field | Rules |
|---|---|
| `name` | 2 to 60 characters |
| `description` | optional, up to 300 characters |

**201:** a **Workspace** with `role: "owner"`, `memberCount: 1`, `boardCount: 0`.
The caller becomes the owner, and `workspace.created` is recorded.

### `GET /workspaces` (User)

**200:** an array of **Workspace** objects the user belongs to, newest first. An empty array is normal for a new user.

### `GET /workspaces/:workspaceId` (Member)

**200:** a **Workspace**. **Errors:** 404 for non-members.

### `PATCH /workspaces/:workspaceId` (Owner)

Body: `name` and/or `description`. **200:** the updated **Workspace**. **Errors:** 403 for members.

### `GET /workspaces/:workspaceId/members` (Member)

**200**
```json
[
  { "userId": "665f0f…01", "name": "Ubald Impuhwe", "role": "owner", "email": "ubald@example.com", "joinedAt": "2026-11-02T09:00:00.000Z" },
  { "userId": "665f0f…02", "name": "Adrien Mizero", "role": "member", "email": null, "joinedAt": "2026-11-03T08:20:00.000Z" }
]
```
`email` is shown **only to the owner**, and is `null` for everyone else.

### `DELETE /workspaces/:workspaceId/members/:userId` (Owner)

**204.** The member's cards in this workspace are unassigned, and `member.removed` is recorded.
**Errors:** 400 `CANNOT_REMOVE_OWNER`, 403 for members, 404 if that user is not a member.

## 7. Invites (owner: Ubald)

### `POST /workspaces/:workspaceId/invites` (Owner)

| Field | Rules |
|---|---|
| `email` | optional. If given, only an account with that email can accept, and the server sends the invite by email (Brevo). |
| `maxUses` | optional, 1 to 50. Default: 1 with an email, 10 without. |
| `expiresInDays` | optional, 1 to 30. Default: 7. |

```json
{ "email": "teammate@example.com", "expiresInDays": 7 }
```

**201**
```json
{
  "id": "665f2a…08",
  "email": "teammate@example.com",
  "expiresAt": "2026-11-16T08:00:00.000Z",
  "maxUses": 1,
  "usesCount": 0,
  "link": "https://teamboard.example.com/invite/9f2c…"
}
```
**`link` is shown only in this response.** The server stores only a hash of the token, so it cannot show the link again. **Errors:** 409 `MEMBER_LIMIT` when the workspace is full (50).

### `GET /workspaces/:workspaceId/invites` (Owner)

**200:** an array of invites **without** `link`, each with a `status`: `active`, `used_up`, `expired` or `revoked`.

### `DELETE /workspaces/:workspaceId/invites/:inviteId` (Owner)

**204.** Sets `revokedAt`.

### `GET /invites/:token` (Public)

Shows what the invite is for, so the accept page can say "Join Group 8?".

**200**
```json
{ "workspaceName": "Group 8", "invitedBy": "Ubald Impuhwe", "requiresEmail": true, "expiresAt": "2026-11-16T08:00:00.000Z" }
```
**410** `INVITE_INVALID` for unknown, expired, revoked and used-up invites alike. The same message in every case means nobody can probe which tokens exist.

### `POST /invites/:token/accept` (User)

**200**
```json
{ "workspaceId": "665f1a…01", "alreadyMember": false }
```
**Errors:** 403 `INVITE_EMAIL_MISMATCH` (this invite is for a different email address), 409 `MEMBER_LIMIT`, 410 `INVITE_INVALID`.
Someone who is already a member gets **200** with `alreadyMember: true`, and the use is not counted. A new member triggers `member.joined`.

## 8. Boards (owner: Adrien)

### `POST /workspaces/:workspaceId/boards` (Member)

| Field | Rules |
|---|---|
| `name` | 1 to 80 characters |
| `description` | optional, up to 500 characters |

**201**
```json
{
  "id": "665f1b…02",
  "workspaceId": "665f1a…01",
  "name": "Launch the school website",
  "description": null,
  "createdAt": "2026-11-05T09:00:00.000Z"
}
```
The board starts with three lists: **To do**, **Doing** and **Done** (`isDone: true`). **Errors:** 409 `BOARD_LIMIT` (50 per workspace).

### `GET /workspaces/:workspaceId/boards` (Member)

**200:** an array of boards, newest first, each with `listCount` and `cardCount`.

### `GET /boards/:boardId` (Member): the whole board in one request

**200**
```json
{
  "board": { "id": "665f1b…02", "workspaceId": "665f1a…01", "name": "Launch the school website", "description": null },
  "role": "member",
  "members": [
    { "id": "665f0f…01", "name": "Ubald Impuhwe" },
    { "id": "665f0f…02", "name": "Adrien Mizero" }
  ],
  "lists": [
    { "id": "665f1b…10", "boardId": "665f1b…02", "name": "To do", "position": 1024, "isDone": false }
  ],
  "cards": [
    { "id": "665f1c…05", "listId": "665f1b…10", "title": "Collect content", "dueDate": "2026-11-12", "isOverdue": false, "assignee": null, "position": 1024 }
  ]
}
```
- `lists` are sorted by `position`, and `cards` by list, then `position`. The cards here are full **Card** objects (shortened in the example).
- `members` fills the assignee picker, so the card popup needs no extra request.
- `role` is the current user's role in the workspace, so the screen knows whether to show the delete button.

### `PATCH /boards/:boardId` (Member)

Body: `name` and/or `description`. **200:** the updated board. Records `board.renamed` when the name changes.

### `DELETE /boards/:boardId` (Owner only)

**204.** Deletes the board's comments, cards and lists in that order, then the board (`schema.md` section 10.2). **Errors:** 403 `FORBIDDEN` for members.

### `GET /boards/:boardId/activity` (Member)

Query: `limit` (default 20) and `before` (the `nextCursor` of the previous page).

**200**
```json
{
  "items": [ { "id": "665f1e…07", "type": "card.moved", "message": "Rachel Mukawera moved Design homepage from To do to Doing", "actor": { "id": "665f0f…03", "name": "Rachel Mukawera" }, "cardId": "665f1c…05", "meta": {}, "createdAt": "2026-11-10T07:45:00.000Z" } ],
  "nextCursor": "665f1e…06"
}
```
Newest first. `nextCursor` is `null` on the last page.

## 9. Lists (owner: Adrien)

### `POST /boards/:boardId/lists` (Member)

| Field | Rules |
|---|---|
| `name` | 1 to 50 characters, unique on the board (case-insensitive) |
| `afterListId` | optional. Place after this list. Empty means at the end. |

**201:** a **List**. **Errors:** 409 `LIST_NAME_TAKEN`, 409 `LIST_LIMIT` (20 per board).

### `PATCH /lists/:listId` (Member)

Body: `name` and/or `isDone` (a boolean). **200:** the updated **List**. **Errors:** 409 `LIST_NAME_TAKEN`.

### `POST /lists/:listId/move` (Member)

```json
{ "afterListId": "665f1b…10" }
```
`afterListId: null` moves the list to the front. **200:** the updated **List** (its new `position`). The client keeps its own order for display, and the server returns the saved position.

### `DELETE /lists/:listId` (Member)

Query: `moveCardsTo=<listId>` (optional, a list on the same board).

- A **list without cards** is deleted: **204**.
- A **list with cards** and no `moveCardsTo` is **refused**: **409** `LIST_NOT_EMPTY`.
- A list with cards **and** `moveCardsTo`: the cards move to the end of that list, then the list is deleted: **204**.

## 10. Cards and comments (owner: Rachel)

### `POST /lists/:listId/cards` (Member)

| Field | Rules |
|---|---|
| `title` | 1 to 200 characters |
| `description` | optional, up to 5000 characters |
| `dueDate` | optional, `YYYY-MM-DD`, a real date |
| `assigneeId` | optional, must be a **member of this workspace** |

**201:** a **Card** at the end of the list. **Errors:** 400 `VALIDATION_FAILED`, 400 `ASSIGNEE_NOT_MEMBER`, 409 `CARD_LIMIT` (200 per list).
A past `dueDate` is allowed for manual cards, because people sometimes record overdue work. (The AI route is stricter.)

### `GET /cards/mine` (User): "My cards"

Query: `workspaceId` (optional, to limit to one workspace).

**200**
```json
[
  {
    "id": "665f1c…05",
    "title": "Collect content for the homepage",
    "dueDate": "2026-11-12",
    "isOverdue": false,
    "listName": "To do",
    "boardId": "665f1b…02",
    "boardName": "Launch the school website",
    "workspaceId": "665f1a…01",
    "workspaceName": "Group 8"
  }
]
```
Only cards **assigned to the current user**, sorted by `dueDate` ascending, with **cards without a date last**. Cards in workspaces the user has left are not included.

### `GET /cards/:cardId` (Member)

**200:** a **Card**, plus `boardName` and `listName`.

### `PATCH /cards/:cardId` (Member)

Send only the fields that change.

| Field | Rules |
|---|---|
| `title` | 1 to 200 characters |
| `description` | up to 5000 characters, `""` clears it |
| `dueDate` | `YYYY-MM-DD`, or `null` to clear |
| `assigneeId` | a member's id, or `null` to unassign |

**200:** the updated **Card**. One request can change several fields. The server records `card.updated` for title, description or date changes, and `card.assigned` or `card.unassigned` for assignee changes.

### `POST /cards/:cardId/move` (Member)

```json
{ "listId": "665f1b…11", "afterCardId": null }
```

| Field | Rules |
|---|---|
| `listId` | a list on **the same board** |
| `afterCardId` | place after this card in the target list. `null` puts it first. Omit it to put it **at the end**. |

**200:** the updated **Card**. Records `card.moved` when the list changes. **Errors:** 400 `LIST_NOT_ON_BOARD`.

### `DELETE /cards/:cardId` (Member)

**204.** Deletes the card's comments and the card, and records `card.deleted`.

### `POST /boards/:boardId/cards/bulk` (Member): add the cards the user picked from the AI preview

```json
{
  "batchId": "b_8f2c1d",
  "cards": [
    { "title": "Collect content for the homepage", "description": "Get the mission, contacts and 5 photos.", "listId": "665f1b…10", "dueDate": "2026-11-12" }
  ]
}
```

| Field | Rules |
|---|---|
| `batchId` | the `batchId` from the AI breakdown response |
| `cards` | 1 to **10** items |
| `cards[].title` | 1 to 200 characters |
| `cards[].description` | optional, up to 5000 characters |
| `cards[].listId` | a list **on this board** |
| `cards[].dueDate` | optional, `YYYY-MM-DD` |
| (no assignee) | **There is no assignee field. If one is sent, it is ignored.** |

**201**
```json
{ "cards": [ /* Card objects with createdVia: "ai" */ ] }
```
- All cards are saved with `createdVia: "ai"` and the same `aiBatchId`, and each one records a normal `card.created` activity.
- Sending the same `batchId` **twice** returns 409 `BATCH_ALREADY_ADDED`, so a double click cannot add the cards twice.
- It is all or nothing: if one card is invalid, **none** are created, and the error names the offending item (`cards.2.title`).

### `GET /cards/:cardId/comments` (Member)

**200:** an array of **Comment** objects, oldest first.

### `POST /cards/:cardId/comments` (Member)

```json
{ "text": "Can we use the school colours?" }
```
`text` is 1 to 2000 characters. **201:** the **Comment**. Records `comment.added`. **Errors:** 409 `COMMENT_LIMIT` (200 per card).

### `DELETE /comments/:commentId` (Author or Owner)

**204.** Records `comment.deleted`. **Errors:** 403 for other members.

## 11. AI task breakdown (owner: Fabrice)

### `POST /boards/:boardId/ai/breakdown` (Member)

**This route never writes to the board.** It only returns suggestions.

| Field | Rules |
|---|---|
| `goal` | 3 to 500 characters |
| `deadline` | optional, `YYYY-MM-DD`, today or later |

```json
{ "goal": "Launch the school website", "deadline": "2026-11-30" }
```

**200**
```json
{
  "batchId": "b_8f2c1d",
  "suggestions": [
    {
      "tempId": "s1",
      "title": "Collect content for the homepage",
      "description": "Get the school's mission, contact details and 5 photos.",
      "listId": "665f1b…10",
      "listName": "To do",
      "dueDate": "2026-11-12"
    }
  ],
  "notes": ["1 due date was moved earlier to fit your deadline"],
  "usage": { "used": 3, "limit": 10, "remaining": 7 }
}
```

**What the server guarantees about `suggestions`**

| Guarantee | How |
|---|---|
| At most 10 | Extra cards are dropped, and a note says so |
| `listId` is a real list on this board | An unknown list name is replaced with the board's **first** list |
| `dueDate` is never in the past | Moved to today |
| `dueDate` is never after the `deadline` | Moved to the deadline |
| No assignee | The field does not exist |
| Safe text | Titles and descriptions are trimmed and length-checked |

`notes` is a list of short plain sentences the preview can show ("2 due dates were moved earlier"). It is empty when nothing was changed.

**Errors**

| Status | `code` | Meaning | What the user sees |
|---|---|---|---|
| 400 | `VALIDATION_FAILED` | Goal too short or too long, or a bad date | Message under the field |
| 404 | `NOT_FOUND` | Not a member of this board's workspace | |
| 429 | `AI_LIMIT_REACHED` | The daily limit is used up. The body includes `usage`. | "You've used all 10 breakdowns today. Add cards by hand, or try again tomorrow." |
| 502 | `AI_UNAVAILABLE` | The provider failed or timed out. The daily count is **not** used. | "The AI helper isn't available right now. You can still add cards by hand." |
| 422 | `AI_INVALID_OUTPUT` | The model's answer could not be used, even after one retry. The daily count is **not** used. | "The AI gave an answer we couldn't use. Try rewording your goal." |

### `GET /ai/usage` (User)

**200**
```json
{ "used": 3, "limit": 10, "remaining": 7, "resetsAt": "2026-11-10T00:00:00.000Z" }
```
`resetsAt` is the start of the next day in the app time zone. The frontend can show "7 left today" before the user types anything.

### How the AI flow fits together

```
1. POST /boards/:boardId/ai/breakdown      → suggestions + batchId   (nothing saved)
2. The user ticks, edits titles and dates in the preview
3. POST /boards/:boardId/cards/bulk        → real cards + activity entries
```

## 12. Admin (owner: Ubald)

All admin routes need the `admin` role. A normal user gets 403.

### `GET /admin/stats`

**200**
```json
{
  "users": 42,
  "blockedUsers": 1,
  "workspaces": 9,
  "cardsThisWeek": 128,
  "aiBreakdownsToday": 14,
  "cardsByDay": [
    { "date": "2026-11-04", "count": 12 },
    { "date": "2026-11-05", "count": 30 }
  ]
}
```
`cardsThisWeek` counts cards created in the **last 7 days**. `cardsByDay` has seven entries, including days with a count of 0.

### `GET /admin/users`

Query: `search` (name or email), `blocked` (`true` or `false`), `page`, `limit`.

**200**
```json
{
  "items": [
    {
      "id": "665f0f…05",
      "name": "Sam Test",
      "email": "sam@example.com",
      "role": "user",
      "blocked": true,
      "blockReason": "Repeated spam in comments",
      "createdAt": "2026-10-20T09:00:00.000Z",
      "lastLoginAt": "2026-11-11T14:00:00.000Z",
      "workspaceCount": 2
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### `POST /admin/users/:userId/block`

```json
{ "reason": "Repeated spam in comments" }
```
`reason` is 3 to 300 characters. **200:** the user object. **Errors:** 400 `CANNOT_BLOCK_ADMIN` (admins, including yourself, cannot be blocked), 404.
The account is locked out immediately, and the person sees the reason on their next sign-in. Nothing they created is deleted.

### `POST /admin/users/:userId/unblock`

**200:** the user object, with the block fields cleared.

### `GET /admin/workspaces`

Query: `search` (name), `page`, `limit`.

**200**
```json
{
  "items": [
    { "id": "665f1a…01", "name": "Group 8", "ownerName": "Ubald Impuhwe", "memberCount": 4, "boardCount": 2, "createdAt": "2026-11-02T09:00:00.000Z" }
  ],
  "total": 9,
  "page": 1,
  "limit": 20
}
```
Admins see **counts and details only**. There is no admin route that reads a board's cards or comments.

## 13. Which routes each screen uses

| Screen | Routes |
|---|---|
| Sign up and log in | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Forgot and reset password | `POST /auth/forgot-password`, `POST /auth/reset-password/:token` |
| Workspaces list | `GET /workspaces`, `POST /workspaces` |
| Workspace page | `GET /workspaces/:id`, `GET /workspaces/:id/boards`, `GET /workspaces/:id/members`, `POST /workspaces/:id/boards` |
| Invite dialog | `POST` and `GET /workspaces/:id/invites`, `DELETE /workspaces/:id/invites/:inviteId` |
| Accept invite page | `GET /invites/:token`, `POST /invites/:token/accept` |
| Board page | `GET /boards/:id`, `GET /boards/:id/activity` |
| Board actions | `PATCH` and `DELETE /boards/:id`, lists routes |
| Card popup | `GET /cards/:id`, `PATCH /cards/:id`, `POST /cards/:id/move`, comments routes |
| AI modal and preview | `GET /ai/usage`, `POST /boards/:id/ai/breakdown`, `POST /boards/:id/cards/bulk` |
| My cards | `GET /cards/mine` |
| Admin dashboard | `GET /admin/stats`, `GET /admin/users`, `GET /admin/workspaces`, block and unblock |

### Query keys and what to refresh (frontend notes)

| After this change | Refresh these cached queries |
|---|---|
| Create, edit, move or delete a card | the board, the board's activity, "my cards" |
| Bulk-add AI cards | the board, the board's activity, "my cards", AI usage |
| Add a comment | the card's comments, the board's activity |
| Create, rename or delete a list | the board, the board's activity |
| Accept an invite | the workspaces list |
| Block a user | the admin users list, the admin stats |

## 14. Decisions to confirm as a team

| # | Question | Default in this document |
|---|---|---|
| 1 | 403 or 404 for non-members? | 404, so ids cannot be probed |
| 2 | Can members rename boards? | Yes. Only deleting is owner-only. |
| 3 | Does an AI failure count against the daily limit? | No |
| 4 | Do manual cards accept past due dates? | Yes. Only the AI route forbids them. |
| 5 | Does the owner see members' emails? | Yes, and other members don't |
| 6 | One request for the whole board, or separate requests for lists and cards? | One request (`GET /boards/:boardId`) |
| 7 | Cursor or page pagination for activity? | Cursor |

## 15. Review checklist before merging this document

- [ ] Every owner has read the routes they build
- [ ] Field names match `schema.md` and the shared TypeScript types
- [ ] The frontend owner agrees the shapes are what the screens need
- [ ] Error codes cover every case the screens must handle
- [ ] The decisions in section 14 are answered or accepted
- [ ] Rachel and Fabrice agreed on the bulk-create body (section 10), because the AI preview depends on it