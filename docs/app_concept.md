# TeamBoard: App Concept

> **Status:** Draft v1, for team review
> **Working name:** TeamBoard (temporary, the team will decide the final name later)
> **Team:** Ubald Impuhwe, Adrien Mizero, Rachel Mukawera, Fabrice Nsanzamahoro

---

## 1. One-sentence pitch

TeamBoard is a simple board where teams organize their work in lists and cards, and an AI helper turns a big goal into suggested cards that the team can pick from.

## 2. The problem

Teams, especially students on group projects, often start with a big goal like "Launch the school website" and do not know where to begin. Tasks end up in chat messages and notebooks, nobody is sure who is doing what, and deadlines get missed.

Two things go wrong:

1. **Work is not visible.** Nobody can see at a glance what is done, in progress or late.
2. **Starting is hard.** Turning a big goal into small, doable tasks takes time and experience.

## 3. The solution

TeamBoard solves both problems:

- **A shared board** shows every task as a card that moves from one list to the next (for example To do, Doing, Done).
- **An AI task breakdown** suggests a first set of cards for a goal. The team stays in control: nothing is added until someone picks it.

## 4. Who it is for

**Primary users:** student teams and small teams (3 to 10 people) who work together on a project over a few weeks.

**Also useful for:** school clubs, community groups and small project teams.

**Not for (yet):** large companies that need advanced reports, integrations or very detailed permissions.

## 5. Roles

| Role | What they can do |
|---|---|
| **Workspace owner** | Creates the workspace, invites and removes members, creates and deletes boards, and can do everything a member can do |
| **Member** | Works on the workspace's boards: creates and moves cards, comments, and uses the AI task breakdown |
| **Admin** | Platform-level role: sees all users and workspaces, blocks accounts (with a reason) and sees platform statistics |

Rules:

- The person who creates a workspace becomes its owner.
- People who accept an invite become members.
- Only workspace members can see its boards.
- Admin accounts are created by the team, never through sign-up.

## 6. Core concepts

```
Workspace  →  Board  →  List  →  Card  →  Comment
   │
   └── Members (owner + members)
```

| Concept | Meaning | Example |
|---|---|---|
| **Workspace** | A team's home. Holds members and boards. | "Group 8" |
| **Board** | One project inside a workspace | "Launch the school website" |
| **List** | A column on a board, usually a stage of work | To do, Doing, Done |
| **Card** | One task, with a title, description, due date and one assignee | "Design the homepage layout" |
| **Comment** | A message on a card | "Can we use the school colours?" |
| **Activity** | An automatic record of what happened on a board | "Rachel moved 'Design homepage' to Doing" |

## 7. Features

### 7.1 MVP (must have)

1. **Accounts:** sign up, log in, log out, and reset a forgotten password.
2. **Workspaces:** create a workspace, and invite teammates by email or invite link.
3. **Boards and lists:** create boards, and lists inside a board.
4. **Cards:** create, edit and delete cards with a title, description and due date.
5. **Assign and move:** assign a card to a member, and move cards between lists with buttons or a dropdown.
6. **Comments** on cards.
7. **Activity history** on each board: who did what, and when.
8. **My cards:** a page with the cards assigned to me, sorted by due date.
9. **Admin dashboard:** all users and workspaces, block an account with a reason, and simple numbers (users, workspaces, cards created this week).
10. **AI task breakdown** on every board (section 8).

### 7.2 Stretch goals (only after the MVP works)

- An AI daily summary of a board: what changed yesterday, what is overdue and what is due today
- Drag and drop for cards and lists
- Live updates, so changes appear for everyone without refreshing
- Labels, and filtering by label or member

### 7.3 Out of scope

- File attachments
- Calendar views
- Integrations with other tools
- The AI changing the board on its own, without the user's approval

## 8. The AI task breakdown

### 8.1 How it works for the user

1. On a board, the user clicks **Break down a goal**.
2. They type the goal (for example "Launch the school website") and, optionally, a deadline.
3. The AI suggests up to 10 cards in a **preview**.
4. The user ticks the cards they want, edits titles or dates if needed, and clicks **Add to board**.
5. The added cards appear on the board and are recorded in the activity history, like any other card.

### 8.2 What the server sends and receives

The server sends the AI the goal, today's date, the deadline and the names of the board's lists. It asks for **JSON only**:

```json
{
  "cards": [
    {
      "title": "Collect content for the homepage",
      "description": "Get the school's mission, contact details and 5 photos.",
      "list": "To do",
      "due_in_days": 3
    }
  ]
}
```

### 8.3 Rules the feature must follow

| Rule | Why |
|---|---|
| Nothing is added until the user picks it in the preview | The team stays in control |
| The AI never assigns cards to people | The team decides who does what |
| At most 10 cards per breakdown | Avoid long, useless lists |
| Every suggestion is checked by the server before it is shown | Never trust AI output blindly |
| Due dates cannot be in the past or after the deadline | Keep dates realistic |
| An unknown list name is replaced with the board's first list | Cards always land somewhere real |
| The API key stays on the server and never reaches the browser | Security |
| Each user has a daily limit of AI breakdowns (for example 10) | Control costs |
| If the AI fails, the user sees a short message and can keep adding cards by hand | The board never depends on the AI |

### 8.4 Testing the AI

We will test with at least **8 goals**, including small ones, very large ones, vague ones ("make things better") and one in another language, and note where the suggestions were unhelpful. The notes are saved in `docs/ai-tests.md`.

## 9. Main screens

| Screen | What it shows |
|---|---|
| **Sign up and log in** | Forms with clear error messages |
| **Workspaces** | The user's workspaces, and a button to create one |
| **Workspace page** | Boards, members, and the invite link (owner only) |
| **Board page** | Lists as columns with cards, an activity panel and the **Break down a goal** button |
| **Card popup** | Title, description, due date, assignee, move control and comments |
| **AI preview** | Suggested cards with tick boxes and editable titles and dates |
| **My cards** | Cards assigned to me, sorted by due date |
| **Invite page** | Where someone joins a workspace from a link |
| **Admin dashboard** | Platform numbers, users, workspaces, and a block-account dialog |

Every screen that loads data needs three states: **loading**, **error with a retry**, and **empty**.

## 10. Technical approach

We use the same stack as our e-commerce project, so we build on patterns we already know.

| Part | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS, React Router |
| Data fetching | Axios, TanStack Query |
| Forms and messages | React Hook Form, react-hot-toast |
| Backend | Express, TypeScript, Zod validation |
| Database | MongoDB with Mongoose |
| Authentication | JWT and bcrypt |
| Email (invites, password reset) | Brevo |
| AI | One LLM provider, called only from the server |
| Hosting | MongoDB Atlas, Render, Vercel or Netlify |

**Important design decisions:**

- **Permissions are checked on the server**, in shared middleware, on every route that takes a board, list or card id. The screens only hide buttons for convenience.
- **The AI endpoint never writes to the board.** It only returns suggestions. The user's choices go through the normal "create cards" route, which also records the activity.
- **Activity is recorded by one shared helper**, so every feature writes history in the same way.
- **Lists and cards have a `position` field from the start**, so drag and drop can be added later without changing the database.

## 11. How we will know it works (demo goals)

1. A new user can sign up, create a workspace, invite a teammate and see them join.
2. Two people can work on the same board and each sees the other's changes after a refresh.
3. A non-member cannot open or change another team's board, even by guessing a URL.
4. A goal broken down by the AI appears on the board as real cards, and shows in the activity history.
5. The AI feature fails gracefully: with the key removed, the board still works.
6. An admin can block an account, and that person sees the reason when they try to sign in.
7. All four members present their own part in the demo.

## 12. Risks and how we handle them

| Risk | What we do |
|---|---|
| Features depend on each other (cards need lists, lists need boards) | Merge the project skeleton and shared models on day 1 to 2, before feature work |
| A route forgets its permission check | One shared membership middleware that everyone uses |
| AI output is wrong, empty or in the wrong format | Strict validation, a retry once, and a clear error message |
| AI costs grow | A daily limit per user and a cap on the goal's length |
| Merge conflicts | Folders by feature, small pull requests, and merging `main` into our branch every morning |
| Falling behind in week 3 | Cut in this order: email invites (keep the invite link), extra activity types, admin extras. Never cut permissions, the AI preview rules or the activity history. |

## 13. Timeline

| Week | Goal |
|---|---|
| **1: Plan and set up** | Wireframes, database design, API contract, project skeleton. Login, workspaces and boards work. The AI owner has a working prompt in a test script. |
| **2: Build** | Each person builds their feature on their own branch. By Friday, an AI breakdown lands on a board as real cards that appear in the activity history. |
| **3: Finish** | Bug fixing, the admin dashboard, AI test goals, a full test with all four of us, deployment, README and demo rehearsal |

## 14. Team ownership

| Person | Feature area |
|---|---|
| Ubald Impuhwe | Auth, workspaces and admin |
| Adrien Mizero | Boards, lists and activity |
| Rachel Mukawera | Cards and comments |
| Fabrice Nsanzamahoro | AI task breakdown |

Shared by everyone: the database design, deployment and the README.

## 15. Open questions

1. **Final name:** TeamBoard is temporary. The team will choose the final name later.
2. **Invites:** link only first, with email as a bonus?
3. **Deleting a list that still has cards:** move the cards to another list, or block the delete?
4. **Which AI provider** (Claude, OpenAI or Gemini), and who creates and stores the key?
5. **Should admins be able to read a board's contents,** or only see that it exists?

## 16. Glossary

- **MVP:** the smallest version that works end to end.
- **Workspace:** a team's home, holding members and boards.
- **Activity:** the automatic history of what happened on a board.
- **Breakdown:** the AI turning one big goal into several suggested cards.
- **Preview:** the screen where the user chooses which suggested cards to add.