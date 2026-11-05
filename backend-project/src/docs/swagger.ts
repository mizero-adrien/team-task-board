const objectId = {
  type: "string",
  pattern: "^[0-9a-fA-F]{24}$",
  example: "507f1f77bcf86cd799439011",
};

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
});

const unauthorized = errorResponse("Authentication is required or the token is invalid");
const forbidden = errorResponse("You do not have permission to do that");
const notFound = errorResponse("The requested resource was not found");
const validationFailed = errorResponse("The request failed validation");
const conflict = errorResponse("The request conflicts with existing data");

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "TeamBoard API",
    version: "1.0.0",
    description:
      "REST API for TeamBoard. Authenticate with `POST /auth/login`, then send the returned JWT as `Authorization: Bearer <token>`.",
  },
  servers: [
    {
      url: "/api",
      description: "Current host",
    },
  ],
  tags: [
    { name: "Health", description: "Service status" },
    { name: "Auth", description: "Registration, login and the current user" },
    { name: "Cards", description: "Cards, moves, bulk creation and personal work" },
    { name: "AI", description: "AI goal breakdown and daily usage" },
    { name: "Workspaces", description: "Workspace management" },
    { name: "Workspace Members", description: "Workspace membership management" },
    { name: "Invites", description: "Invite creation, preview and acceptance" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "The API is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Create an account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "The account was created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "400": validationFailed,
          "409": conflict,
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login succeeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": validationFailed,
          "401": errorResponse("The email or password is incorrect"),
          "403": forbidden,
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "The authenticated user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "401": unauthorized,
          "403": forbidden,
        },
      },
    },
    "/lists/{listId}/cards": {
      post: {
        tags: ["Cards"],
        summary: "Create a card in a list",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ListId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CardCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "The created card",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Card" },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "404": notFound,
          "409": errorResponse("The list already has 200 cards"),
        },
      },
    },
    "/cards/mine": {
      get: {
        tags: ["Cards"],
        summary: "List cards assigned to the current user",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "workspaceId",
            in: "query",
            required: false,
            schema: objectId,
            description: "Only return cards from this workspace",
          },
        ],
        responses: {
          "200": {
            description: "Assigned cards",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/MyCard" },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
        },
      },
    },
    "/cards/{cardId}": {
      get: {
        tags: ["Cards"],
        summary: "Get one card",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        responses: {
          "200": {
            description: "The card",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Card" },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "404": notFound,
        },
      },
      patch: {
        tags: ["Cards"],
        summary: "Update a card",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CardUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "The updated card",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Card" },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "404": notFound,
        },
      },
      delete: {
        tags: ["Cards"],
        summary: "Delete a card",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        responses: {
          "204": { description: "The card was deleted" },
          "400": validationFailed,
          "401": unauthorized,
          "404": notFound,
        },
      },
    },
    "/cards/{cardId}/move": {
      post: {
        tags: ["Cards"],
        summary: "Move a card to another list or position",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/CardId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CardMoveRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "The moved card",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Card" },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "404": notFound,
        },
      },
    },
    "/boards/{boardId}/cards/bulk": {
      post: {
        tags: ["Cards"],
        summary: "Create up to 10 cards in one batch",
        description:
          "Used after AI suggestions are accepted. A `batchId` can only be added once per board.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/BoardId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BulkCardsRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "The created cards",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["cards"],
                  properties: {
                    cards: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Card" },
                    },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "404": notFound,
          "409": errorResponse("These cards have already been added"),
        },
      },
    },
    "/ai/usage": {
      get: {
        tags: ["AI"],
        summary: "Get today's AI breakdown usage",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Today's usage and next reset time",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AiUsage" },
              },
            },
          },
          "401": unauthorized,
        },
      },
    },
    "/boards/{boardId}/ai/breakdown": {
      post: {
        tags: ["AI"],
        summary: "Break a goal into suggested cards",
        description:
          "Returns suggestions only. Nothing is written to the board; the client sends accepted suggestions to `POST /boards/{boardId}/cards/bulk`.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/BoardId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AiBreakdownRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Suggested cards and usage",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AiBreakdownResponse" },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "404": notFound,
          "429": errorResponse("The daily AI breakdown limit has been reached"),
          "502": errorResponse("The AI provider is unavailable or returned unusable output"),
        },
      },
    },
    "/workspaces": {
      get: {
        tags: ["Workspaces"],
        summary: "List workspaces you belong to",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/Limit" },
        ],
        responses: {
          "200": {
            description: "Paginated workspaces",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data", "pagination"],
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Workspace" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
        },
      },
      post: {
        tags: ["Workspaces"],
        summary: "Create a workspace",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WorkspaceCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "The created workspace",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: { $ref: "#/components/schemas/Workspace" },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
        },
      },
    },
    "/workspaces/{workspaceId}": {
      get: {
        tags: ["Workspaces"],
        summary: "Get a workspace",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/WorkspaceId" }],
        responses: {
          "200": {
            description: "The workspace",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: { $ref: "#/components/schemas/Workspace" },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "404": notFound,
        },
      },
      patch: {
        tags: ["Workspaces"],
        summary: "Update a workspace",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/WorkspaceId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WorkspaceUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "The updated workspace",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: { $ref: "#/components/schemas/Workspace" },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "403": forbidden,
          "404": notFound,
        },
      },
      delete: {
        tags: ["Workspaces"],
        summary: "Delete a workspace",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/WorkspaceId" }],
        responses: {
          "204": { description: "The workspace was deleted" },
          "400": validationFailed,
          "401": unauthorized,
          "403": forbidden,
          "404": notFound,
        },
      },
    },
    "/workspaces/{workspaceId}/members": {
      get: {
        tags: ["Workspace Members"],
        summary: "List workspace members",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/WorkspaceId" }],
        responses: {
          "200": {
            description: "Members and their user records",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/WorkspaceMemberWithUser",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "404": notFound,
        },
      },
      post: {
        tags: ["Workspace Members"],
        summary: "Add a member by user id or email",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/WorkspaceId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MemberAddRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "The new membership",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: {
                      $ref: "#/components/schemas/WorkspaceMember",
                    },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "403": forbidden,
          "404": notFound,
          "409": conflict,
        },
      },
    },
    "/workspaces/{workspaceId}/members/{userId}": {
      patch: {
        tags: ["Workspace Members"],
        summary: "Change a member's role",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/WorkspaceId" },
          { $ref: "#/components/parameters/UserId" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MemberRoleUpdateRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "The updated membership",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: {
                      $ref: "#/components/schemas/WorkspaceMember",
                    },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "403": forbidden,
          "404": notFound,
        },
      },
      delete: {
        tags: ["Workspace Members"],
        summary: "Remove a member",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/WorkspaceId" },
          { $ref: "#/components/parameters/UserId" },
        ],
        responses: {
          "204": { description: "The member was removed" },
          "400": validationFailed,
          "401": unauthorized,
          "403": forbidden,
          "404": notFound,
        },
      },
    },
    "/workspaces/{workspaceId}/invites": {
      get: {
        tags: ["Invites"],
        summary: "List workspace invites",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/WorkspaceId" }],
        responses: {
          "200": {
            description: "Workspace invites",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Invite" },
                    },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "404": notFound,
        },
      },
      post: {
        tags: ["Invites"],
        summary: "Create an invite link",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/WorkspaceId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InviteCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "The invite and its one-time plain token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: {
                      $ref: "#/components/schemas/InviteWithToken",
                    },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "403": forbidden,
          "404": notFound,
        },
      },
    },
    "/workspaces/{workspaceId}/invites/{inviteId}": {
      delete: {
        tags: ["Invites"],
        summary: "Revoke an invite",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/WorkspaceId" },
          { $ref: "#/components/parameters/InviteId" },
        ],
        responses: {
          "200": {
            description: "The revoked invite",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: { $ref: "#/components/schemas/Invite" },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "403": forbidden,
          "404": notFound,
        },
      },
    },
    "/invites/preview": {
      post: {
        tags: ["Invites"],
        summary: "Preview an invite without signing in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InviteTokenRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Public invite details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: {
                      $ref: "#/components/schemas/InvitePreview",
                    },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "404": notFound,
          "410": errorResponse("The invite is expired, revoked or used up"),
        },
      },
    },
    "/invites/accept": {
      post: {
        tags: ["Invites"],
        summary: "Accept an invite",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InviteTokenRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "The accepted invite and new membership",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: {
                      type: "object",
                      required: ["invite", "membership"],
                      properties: {
                        invite: { $ref: "#/components/schemas/Invite" },
                        membership: {
                          $ref: "#/components/schemas/WorkspaceMember",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": validationFailed,
          "401": unauthorized,
          "404": notFound,
          "409": conflict,
          "410": errorResponse("The invite is expired, revoked or used up"),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    parameters: {
      WorkspaceId: {
        name: "workspaceId",
        in: "path",
        required: true,
        schema: objectId,
      },
      BoardId: {
        name: "boardId",
        in: "path",
        required: true,
        schema: objectId,
      },
      ListId: {
        name: "listId",
        in: "path",
        required: true,
        schema: objectId,
      },
      CardId: {
        name: "cardId",
        in: "path",
        required: true,
        schema: objectId,
      },
      UserId: {
        name: "userId",
        in: "path",
        required: true,
        schema: objectId,
      },
      InviteId: {
        name: "inviteId",
        in: "path",
        required: true,
        schema: objectId,
      },
      Page: {
        name: "page",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
      },
      Limit: {
        name: "limit",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 20,
        },
      },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["message", "code"],
        properties: {
          message: { type: "string", example: "Card not found" },
          code: { type: "string", example: "NOT_FOUND" },
          details: {
            type: "object",
            nullable: true,
            additionalProperties: true,
          },
        },
      },
      RegisterRequest: {
        type: "object",
        additionalProperties: false,
        required: ["name", "email", "password"],
        properties: {
          name: {
            type: "string",
            minLength: 2,
            maxLength: 50,
            example: "Ada Lovelace",
          },
          email: {
            type: "string",
            format: "email",
            example: "ada@example.com",
          },
          password: {
            type: "string",
            minLength: 8,
            maxLength: 72,
            format: "password",
            description: "At least 8 characters with at least one letter and one number",
            example: "Password1",
          },
        },
      },
      LoginRequest: {
        type: "object",
        additionalProperties: false,
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "ada@example.com",
          },
          password: {
            type: "string",
            minLength: 1,
            maxLength: 72,
            format: "password",
            example: "Password1",
          },
        },
      },
      AuthResponse: {
        type: "object",
        required: ["token", "user"],
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      User: {
        type: "object",
        required: ["id", "name", "email", "role", "blocked"],
        properties: {
          id: objectId,
          name: { type: "string", example: "Ada Lovelace" },
          email: { type: "string", format: "email", example: "ada@example.com" },
          role: { type: "string", enum: ["user", "admin"], example: "user" },
          blocked: { type: "boolean", example: false },
          blockReason: { type: "string", nullable: true, example: null },
          lastLoginAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: "2026-11-04T09:00:00.000Z",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Person: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: objectId,
          name: { type: "string", example: "Ada Lovelace" },
        },
      },
      CardCreateRequest: {
        type: "object",
        additionalProperties: false,
        required: ["title"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", maxLength: 5000 },
          dueDate: {
            type: "string",
            format: "date",
            nullable: true,
            example: "2026-12-15",
          },
          assigneeId: {
            ...objectId,
            nullable: true,
            example: null,
          },
        },
      },
      CardUpdateRequest: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", maxLength: 5000 },
          dueDate: {
            type: "string",
            format: "date",
            nullable: true,
            example: "2026-12-15",
          },
          assigneeId: {
            ...objectId,
            nullable: true,
            example: null,
          },
        },
      },
      CardMoveRequest: {
        type: "object",
        additionalProperties: false,
        required: ["listId"],
        properties: {
          listId: objectId,
          afterCardId: {
            ...objectId,
            nullable: true,
            description: "Place the card after this card, or at the top when omitted",
          },
        },
      },
      Card: {
        type: "object",
        required: [
          "id",
          "boardId",
          "listId",
          "workspaceId",
          "title",
          "description",
          "isOverdue",
          "position",
          "createdBy",
          "createdVia",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: objectId,
          boardId: objectId,
          listId: objectId,
          workspaceId: objectId,
          title: { type: "string", example: "Draft the launch checklist" },
          description: { type: "string", example: "List every item needed before launch." },
          dueDate: {
            type: "string",
            format: "date",
            nullable: true,
            example: "2026-12-15",
          },
          isOverdue: { type: "boolean", example: false },
          assignee: {
            allOf: [{ $ref: "#/components/schemas/Person" }],
            nullable: true,
          },
          position: { type: "number", example: 0 },
          createdBy: { $ref: "#/components/schemas/Person" },
          createdVia: { type: "string", enum: ["manual", "ai"], example: "manual" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MyCard: {
        type: "object",
        required: [
          "id",
          "title",
          "isOverdue",
          "listName",
          "boardId",
          "boardName",
          "workspaceId",
          "workspaceName",
        ],
        properties: {
          id: objectId,
          title: { type: "string", example: "Draft the launch checklist" },
          dueDate: {
            type: "string",
            format: "date",
            nullable: true,
            example: "2026-12-15",
          },
          isOverdue: { type: "boolean", example: false },
          listName: { type: "string", example: "To Do" },
          boardId: objectId,
          boardName: { type: "string", example: "Launch board" },
          workspaceId: objectId,
          workspaceName: { type: "string", example: "Marketing" },
        },
      },
      BulkCardsRequest: {
        type: "object",
        additionalProperties: false,
        required: ["batchId", "cards"],
        properties: {
          batchId: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            example: "b_9f2c1a7d4e",
          },
          cards: {
            type: "array",
            minItems: 1,
            maxItems: 10,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "listId"],
              properties: {
                title: { type: "string", minLength: 1, maxLength: 200 },
                description: { type: "string", maxLength: 5000 },
                listId: objectId,
                dueDate: {
                  type: "string",
                  format: "date",
                  nullable: true,
                  example: "2026-12-15",
                },
              },
            },
          },
        },
      },
      AiBreakdownRequest: {
        type: "object",
        additionalProperties: false,
        required: ["goal"],
        properties: {
          goal: {
            type: "string",
            minLength: 3,
            maxLength: 500,
            example: "Launch the school website",
          },
          deadline: {
            type: "string",
            format: "date",
            nullable: true,
            description: "Cannot be in the past",
            example: "2026-12-15",
          },
        },
      },
      AiSuggestion: {
        type: "object",
        required: [
          "tempId",
          "title",
          "description",
          "listId",
          "listName",
          "dueDate",
        ],
        properties: {
          tempId: { type: "string", example: "t1" },
          title: { type: "string", example: "Draft the launch checklist" },
          description: { type: "string", example: "List every item needed before launch." },
          listId: objectId,
          listName: { type: "string", example: "To Do" },
          dueDate: {
            type: "string",
            format: "date",
            nullable: true,
            example: "2026-12-15",
          },
        },
      },
      AiUsage: {
        type: "object",
        required: ["used", "limit", "remaining", "resetsAt"],
        properties: {
          used: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          remaining: { type: "integer", example: 9 },
          resetsAt: {
            type: "string",
            format: "date-time",
            example: "2026-11-05T00:00:00.000Z",
          },
        },
      },
      AiBreakdownResponse: {
        type: "object",
        required: ["batchId", "suggestions", "notes", "usage"],
        properties: {
          batchId: { type: "string", example: "b_9f2c1a7d4e" },
          suggestions: {
            type: "array",
            items: { $ref: "#/components/schemas/AiSuggestion" },
          },
          notes: {
            type: "array",
            items: { type: "string" },
            example: ["Some dates were moved to fit before the deadline."],
          },
          usage: { $ref: "#/components/schemas/AiUsage" },
        },
      },
      Workspace: {
        type: "object",
        required: ["id", "name", "ownerId", "createdAt", "updatedAt"],
        properties: {
          id: objectId,
          name: { type: "string", example: "Marketing" },
          description: { type: "string", nullable: true, example: "Campaign planning" },
          ownerId: objectId,
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      WorkspaceCreateRequest: {
        type: "object",
        additionalProperties: false,
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 60, example: "Marketing" },
          description: {
            type: "string",
            maxLength: 300,
            nullable: true,
            example: "Campaign planning",
          },
        },
      },
      WorkspaceUpdateRequest: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 2, maxLength: 60, example: "Marketing" },
          description: {
            type: "string",
            maxLength: 300,
            nullable: true,
            example: "Campaign planning",
          },
        },
      },
      Pagination: {
        type: "object",
        required: ["page", "limit", "total", "totalPages"],
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 3 },
          totalPages: { type: "integer", example: 1 },
        },
      },
      WorkspaceMember: {
        type: "object",
        required: ["id", "workspaceId", "userId", "role", "joinedAt"],
        properties: {
          id: objectId,
          workspaceId: objectId,
          userId: objectId,
          role: { type: "string", enum: ["owner", "member"], example: "member" },
          joinedAt: { type: "string", format: "date-time" },
        },
      },
      WorkspaceMemberWithUser: {
        allOf: [
          { $ref: "#/components/schemas/WorkspaceMember" },
          {
            type: "object",
            properties: {
              user: {
                allOf: [{ $ref: "#/components/schemas/User" }],
                nullable: true,
              },
            },
          },
        ],
      },
      MemberAddRequest: {
        type: "object",
        additionalProperties: false,
        properties: {
          userId: objectId,
          email: {
            type: "string",
            format: "email",
            example: "new.member@example.com",
          },
          role: {
            type: "string",
            enum: ["owner", "member"],
            default: "member",
          },
        },
        description: "Provide exactly one of `userId` or `email`.",
      },
      MemberRoleUpdateRequest: {
        type: "object",
        additionalProperties: false,
        required: ["role"],
        properties: {
          role: { type: "string", enum: ["owner", "member"] },
        },
      },
      Invite: {
        type: "object",
        required: [
          "id",
          "workspaceId",
          "maxUses",
          "usesCount",
          "expiresAt",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: objectId,
          workspaceId: objectId,
          email: {
            type: "string",
            format: "email",
            nullable: true,
            example: null,
          },
          maxUses: { type: "integer", example: 1 },
          usesCount: { type: "integer", example: 0 },
          expiresAt: { type: "string", format: "date-time" },
          revokedAt: { type: "string", format: "date-time", nullable: true },
          invitedBy: { ...objectId, nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      InviteWithToken: {
        allOf: [
          { $ref: "#/components/schemas/Invite" },
          {
            type: "object",
            required: ["token"],
            properties: {
              token: {
                type: "string",
                description: "Plain invite token. It is only returned once.",
                example: "2b4c6d8e0f1a3c5e7f9a...",
              },
            },
          },
        ],
      },
      InviteCreateRequest: {
        type: "object",
        additionalProperties: false,
        properties: {
          email: {
            type: "string",
            format: "email",
            nullable: true,
            example: null,
          },
          maxUses: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 1,
          },
          expiresInHours: {
            type: "integer",
            minimum: 1,
            maximum: 720,
            default: 72,
          },
        },
      },
      InviteTokenRequest: {
        type: "object",
        additionalProperties: false,
        required: ["token"],
        properties: {
          token: {
            type: "string",
            minLength: 16,
            example: "2b4c6d8e0f1a3c5e7f9a...",
          },
        },
      },
      InvitePreview: {
        type: "object",
        required: ["workspaceName", "maxUses", "usesCount", "expiresAt"],
        properties: {
          workspaceName: { type: "string", example: "Marketing" },
          email: { type: "string", format: "email", nullable: true, example: null },
          maxUses: { type: "integer", example: 1 },
          usesCount: { type: "integer", example: 0 },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
