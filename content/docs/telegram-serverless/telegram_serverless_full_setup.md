---
title: "Telegram Serverless — Full Setup Guide"
---

# Telegram Serverless — Full Setup Guide

This guide focuses **only on Telegram Serverless**.

It covers:

- Creating a Telegram bot
- Enabling Telegram Serverless
- Creating the project
- CLI authentication
- Project structure
- Handlers
- Bot API
- Inline callbacks
- Built-in SQLite database
- Testing
- Deployment
- Webhook management
- Recommended project structure
- Full architecture diagrams

---

# 1. Telegram Serverless Architecture

```text
                    TELEGRAM
                       │
                       │ User sends message
                       ▼
              ┌─────────────────┐
              │ Telegram Bot    │
              └────────┬────────┘
                       │
                       │ Update
                       ▼
          ┌──────────────────────────┐
          │ Telegram Serverless      │
          │                          │
          │ V8 JavaScript Runtime    │
          │                          │
          │ ┌──────────────────────┐ │
          │ │ handlers/message.js  │ │
          │ └──────────┬───────────┘ │
          │            │             │
          │     ┌──────┴──────┐      │
          │     ▼             ▼      │
          │  Bot API       Database  │
          │  api.*           db.*    │
          │                    │      │
          │                 SQLite   │
          └──────────────────────────┘
                       │
                       ▼
                  Telegram User
```

Telegram runs your JavaScript on demand inside isolated V8 environments.

It provides:

- Bot API access
- Persistent SQLite-backed storage
- Serverless handlers
- Logging
- CLI tools
- Webhook management
- Serverless testing

---

# 2. Requirements

You need:

```text
Telegram account
Node.js 18+
npm
Telegram Bot
Telegram Serverless enabled
```

Check Node.js:

```powershell
node --version
```

Check npm:

```powershell
npm --version
```

---

# 3. Create the Telegram Bot

Open:

```text
@BotFather
```

Send:

```text
/newbot
```

Example:

```text
Bot name:
Serverless Test Bot

Username:
my_serverless_test_bot
```

BotFather creates your bot.

Flow:

```text
Telegram Account
       │
       ▼
   @BotFather
       │
       ▼
Telegram Bot
```

---

# 4. Enable Telegram Serverless

Inside BotFather:

```text
@BotFather
   ↓
My Bots
   ↓
Your Bot
   ↓
Serverless
   ↓
Enable
```

Serverless must be enabled before using the CLI and deploying handlers.

---

# 5. Get the Serverless CLI Token

Go to:

```text
@BotFather
   ↓
Your Bot
   ↓
Serverless
   ↓
CLI Access
   ↓
Access Token
```

The token looks similar to:

```text
app123456789:xxxxxxxxxxxxxxxxxxxx
```

Important:

```text
Bot API token
≠
Telegram Serverless CLI token
```

The CLI token is used by:

```powershell
npx tgcloud login
```

---

# 6. Create the Telegram Serverless Project

Example on Windows:

```powershell
cd C:\xampp\htdocs
```

Create the project:

```powershell
npm create @tgcloud/bot telegram_serverless_test
```

Enter the project:

```powershell
cd telegram_serverless_test
```

Typical structure:

```text
telegram_serverless_test/
│
├── tgcloud/
│   │
│   ├── handlers/
│   │   └── message.js
│   │
│   ├── lib/
│   │
│   ├── endpoints/
│   │
│   └── schema.js
│
├── docs/
│   └── tgcloud-sdk.md
│
├── AGENTS.md
├── tgcloud.jsonc
├── package.json
└── .tgcloud/
```

The most important directory is:

```text
tgcloud/
```

---

# 7. Understand the Project Structure

```text
tgcloud/
│
├── handlers/
├── endpoints/
├── lib/
└── schema.js
```

## handlers/

Receives Telegram updates.

Example:

```text
handlers/message.js
```

handles:

```text
message
```

Example:

```text
handlers/callback_query.js
```

handles:

```text
callback_query
```

Telegram routes update types automatically.

---

## lib/

Reusable logic.

Example:

```text
lib/
├── users.js
├── helpers.js
└── formatter.js
```

---

## schema.js

Defines the built-in Telegram Serverless SQLite database.

---

## endpoints/

Used for Telegram Mini App Serverless endpoints.

For a normal chat bot, you do not need them immediately.

---

# 8. Login to Telegram Serverless

Run:

```powershell
npx tgcloud login
```

Paste your Serverless CLI token.

Conceptually:

```text
Your PC
  │
  │ authenticated
  ▼
Telegram Serverless Project
```

Credentials are stored locally under:

```text
.tgcloud/
```

---

# 9. Check Project Status

Run:

```powershell
npx tgcloud status
```

See detailed differences:

```powershell
npx tgcloud diff
```

Flow:

```text
Local project
    │
    ▼
Compare
    │
    ▼
Telegram deployed version
```

---

# 10. Create the First Message Handler

Open:

```text
tgcloud/handlers/message.js
```

Example:

```javascript
import { api } from 'sdk';

export default async function (message) {

    await api.sendMessage({
        chat_id: message.chat.id,
        text: 'Hello from Telegram Serverless!'
    });

}
```

That is enough for a basic bot response.

You do not need:

```text
Express
Nginx
Apache
PM2
Docker
Webhook server
Manual HTTP endpoint
```

Telegram Serverless handles the infrastructure.

---

# 11. How a Telegram Message Reaches the Handler

User sends:

```text
Hello
```

Telegram receives an update similar to:

```json
{
    "update_id": 123456,
    "message": {
        "message_id": 10,
        "from": {
            "id": 100001,
            "first_name": "John"
        },
        "chat": {
            "id": 100001,
            "type": "private"
        },
        "text": "Hello"
    }
}
```

Telegram Serverless automatically sends:

```javascript
update.message
```

to:

```text
handlers/message.js
```

So your function receives:

```javascript
export default async function (message) {
}
```

Then:

```javascript
message.text
```

is:

```text
Hello
```

and:

```javascript
message.chat.id
```

contains the chat ID.

---

# 12. Access the Full Raw Update

Use the second parameter:

```javascript
export default async function (
    message,
    ctx
) {

    console.log(
        ctx.update.update_id
    );

}
```

Relationship:

```text
message
    =
update.message
```

while:

```text
ctx.update
    =
entire Telegram Update
```

---

# 13. Send Messages with the Built-in Bot API

Import:

```javascript
import { api } from 'sdk';
```

Send a message:

```javascript
await api.sendMessage({
    chat_id: message.chat.id,
    text: 'Hello!'
});
```

You do not need to manually call:

```text
https://api.telegram.org/bot<TOKEN>/sendMessage
```

Telegram Serverless connects to the Bot API internally.

---

# 14. Add Commands

Example:

```javascript
import { api } from 'sdk';

export default async function (message) {

    const text =
        message.text?.trim() ?? '';

    if (text === '/start') {

        await api.sendMessage({
            chat_id: message.chat.id,
            text: 'Welcome!'
        });

        return;
    }


    if (text === '/help') {

        await api.sendMessage({
            chat_id: message.chat.id,
            text:
                '/start - Start bot\n' +
                '/help - Help\n' +
                '/profile - Profile'
        });

        return;
    }


    await api.sendMessage({
        chat_id: message.chat.id,
        text: `You said: ${text}`
    });

}
```

Flow:

```text
message.js
    │
    ├── /start
    │      ↓
    │   Welcome
    │
    ├── /help
    │      ↓
    │   Help
    │
    └── other text
           ↓
        Echo text
```

---

# 15. Add Inline Buttons

Example:

```javascript
await api.sendMessage({

    chat_id: message.chat.id,

    text: 'Select an option:',

    reply_markup: {

        inline_keyboard: [

            [
                {
                    text: 'Profile',
                    callback_data: 'PROFILE'
                },

                {
                    text: 'Points',
                    callback_data: 'POINTS'
                }
            ]

        ]

    }

});
```

The user sees:

```text
Select an option:

┌─────────────┐ ┌─────────────┐
│   Profile   │ │   Points    │
└─────────────┘ └─────────────┘
```

When the user taps one, Telegram generates:

```text
callback_query
```

---

# 16. Create a Callback Handler

Run:

```powershell
npx tgcloud add handlers/callback_query
```

This creates:

```text
tgcloud/handlers/callback_query.js
```

Example:

```javascript
import { api } from 'sdk';

export default async function (query) {

    await api.answerCallbackQuery({
        callback_query_id: query.id
    });


    if (query.data === 'PROFILE') {

        await api.sendMessage({
            chat_id:
                query.message.chat.id,

            text:
                `Your Telegram ID: ${query.from.id}`
        });

        return;
    }


    if (query.data === 'POINTS') {

        await api.sendMessage({
            chat_id:
                query.message.chat.id,

            text:
                'Your points: 100'
        });

    }

}
```

Flow:

```text
User presses button
       ↓
Telegram callback_query
       ↓
handlers/callback_query.js
       ↓
query.data
       ↓
PROFILE
```

---

# 17. Telegram Serverless Handler Routing

```text
Telegram Update

message
   │
   ▼
handlers/message.js


callback_query
   │
   ▼
handlers/callback_query.js


inline_query
   │
   ▼
handlers/inline_query.js


chat_member
   │
   ▼
handlers/chat_member.js
```

Telegram handles the routing automatically.

You do not need a giant `switch` for update types.

---

# 18. Create the Built-in Database

Open:

```text
tgcloud/schema.js
```

Example:

```javascript
import {
    table,
    integer,
    text,
    sql
} from 'sdk/db';


export const users = table(
    'users',
    {

        telegramId:
            integer('telegram_id')
                .primaryKey(),

        firstName:
            text('first_name'),

        username:
            text('username'),

        messageCount:
            integer('message_count')
                .notNull()
                .default(0),

        createdAt:
            integer(
                'created_at',
                {
                    mode: 'timestamp'
                }
            ).default(
                sql`(unixepoch())`
            )

    }
);
```

Architecture:

```text
Telegram Serverless
       │
       ▼
schema.js
       │
       ▼
SQLite
       │
       ▼
users
```

The database is persistent between function executions.

---

# 19. Deploy the Schema

First deploy the code:

```powershell
npx tgcloud push
```

Then inspect migration:

```powershell
npx tgcloud migrate --dry-run
```

Then apply:

```powershell
npx tgcloud migrate
```

Flow:

```text
schema.js
   │
   │ push
   ▼
Telegram Serverless
   │
   │ migrate
   ▼
SQLite database
```

`push` and `migrate` are intentionally separate.

---

# 20. Insert Data

Example:

```javascript
import {
    api,
    db
} from 'sdk';

import {
    sql
} from 'sdk/db';

import {
    users
} from '../schema.js';


export default async function (message) {

    const user =
        message.from;


    await db
        .insert(users)
        .values({

            telegramId:
                user.id,

            firstName:
                user.first_name ?? '',

            username:
                user.username ?? '',

            messageCount:
                1

        })
        .onConflictDoUpdate({

            target:
                users.telegramId,

            set: {

                firstName:
                    user.first_name ?? '',

                username:
                    user.username ?? '',

                messageCount:
                    sql`${users.messageCount} + 1`

            }

        })
        .run();


    await api.sendMessage({

        chat_id:
            message.chat.id,

        text:
            'Message stored!'

    });

}
```

---

# 21. Read Data

Import:

```javascript
import {
    eq
} from 'sdk/db';
```

Query:

```javascript
const user =
    await db
        .select()
        .from(users)
        .where(
            eq(
                users.telegramId,
                message.from.id
            )
        )
        .get();
```

Use the result:

```javascript
await api.sendMessage({

    chat_id:
        message.chat.id,

    text:
        `Messages: ${user.messageCount}`

});
```

Flow:

```text
Telegram message
       ↓
message.js
       ↓
db.select()
       ↓
SQLite
       ↓
user data
       ↓
api.sendMessage()
       ↓
Telegram
```

---

# 22. Shared Library Code

Avoid putting everything in:

```text
handlers/message.js
```

Example:

```text
tgcloud/lib/users.js
```

Code:

```javascript
import {
    db
} from 'sdk';

import {
    eq
} from 'sdk/db';

import {
    users
} from '../schema.js';


export async function getUser(
    telegramId
) {

    return await db
        .select()
        .from(users)
        .where(
            eq(
                users.telegramId,
                telegramId
            )
        )
        .get();

}
```

Then import it:

```javascript
import {
    getUser
} from '../lib/users.js';
```

---

# 23. Recommended Project Structure

```text
telegram_bot/
│
├── tgcloud/
│   │
│   ├── handlers/
│   │   ├── message.js
│   │   └── callback_query.js
│   │
│   ├── lib/
│   │   ├── commands/
│   │   │   ├── start.js
│   │   │   ├── help.js
│   │   │   └── profile.js
│   │   │
│   │   ├── users/
│   │   │   ├── get.js
│   │   │   └── save.js
│   │   │
│   │   └── keyboard/
│   │       └── main.js
│   │
│   └── schema.js
│
├── docs/
│
├── tgcloud.jsonc
├── package.json
└── .tgcloud/
```

Architecture:

```text
Telegram
   │
   ▼
handlers/
   │
   ▼
lib/
   │
   ├─────────────┐
   ▼             ▼
Database        Bot API
SQLite          api.*
   │             │
   └──────┬──────┘
          ▼
       Telegram
```

---

# 24. Import Rules

Correct:

```javascript
import {
    users
} from '../schema.js';
```

Correct:

```javascript
import {
    getUser
} from '../lib/users.js';
```

Wrong:

```javascript
import {
    users
} from '../schema';
```

Wrong:

```javascript
import axios from 'axios';
```

Wrong:

```javascript
import express from 'express';
```

Runtime backend modules should use:

```text
sdk
sdk/*
your own tgcloud modules
```

Telegram Serverless is not a normal Node.js server runtime.

---

# 25. Test Without Deployment

Run:

```powershell
npx tgcloud run handlers/message "{ chat: { id: 1 }, from: { id: 1, first_name: 'Test' }, text: 'Hello' }"
```

Flow:

```text
Write code
    ↓
tgcloud run
    ↓
Telegram Serverless test execution
    ↓
See logs/result
```

This lets you test Serverless code without publishing it.

---

# 26. Test with Context Data

Example:

```powershell
npx tgcloud run handlers/message "{ chat: { id: 1 }, text: 'Hello' }" --ctx "{ update: { update_id: 123 } }"
```

Then:

```javascript
console.log(
    ctx.update.update_id
);
```

returns:

```text
123
```

---

# 27. Logging

Use:

```javascript
console.log('message', message);

console.info('started');

console.warn('warning');

console.error('error');
```

Logs are visible during Serverless test runs.

---

# 28. Deploy the Code

Run:

```powershell
npx tgcloud push
```

Flow:

```text
Your PC

tgcloud/
   │
   │ push
   ▼

Telegram Serverless
```

---

# 29. Webhook Management

Check webhook status:

```powershell
npx tgcloud webhook
```

Telegram shows information such as:

```text
Webhook URL
Allowed updates
Pending updates
Last error
Sync status
```

Telegram Serverless manages the webhook automatically.

---

# 30. allowed_updates

If your deployed handlers are:

```text
handlers/message.js
handlers/callback_query.js
```

Telegram can subscribe to:

```json
[
    "message",
    "callback_query"
]
```

If only:

```text
handlers/message.js
```

exists, only `message` updates need to wake your project.

---

# 31. Sync the Webhook

Check:

```powershell
npx tgcloud webhook
```

If needed:

```powershell
npx tgcloud webhook sync
```

To intentionally discard pending updates:

```powershell
npx tgcloud webhook sync --drop-pending
```

Use `--drop-pending` carefully because queued updates are removed.

---

# 32. Review Changes Before Deployment

Typical workflow:

```powershell
npx tgcloud status
```

Then:

```powershell
npx tgcloud diff
```

Then test:

```powershell
npx tgcloud run handlers/message "..."
```

Finally deploy:

```powershell
npx tgcloud push
```

---

# 33. Pull Cloud Code

Check cloud state:

```powershell
npx tgcloud fetch
```

Download deployed files:

```powershell
npx tgcloud pull
```

Flow:

```text
Telegram Cloud
      ↓
tgcloud pull
      ↓
Local project
```

---

# 34. Full Development Workflow

```text
┌─────────────────────────┐
│ Write code              │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ npx tgcloud status      │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ npx tgcloud diff        │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ npx tgcloud run         │
└────────────┬────────────┘
             ▼
          Works?
        ┌────┴────┐
       No        Yes
       │           │
       ▼           ▼
   Fix code     push
                   │
                   ▼
        ┌────────────────────┐
        │ Schema changed?    │
        └────────┬───────────┘
              No │ Yes
                 │   │
                 │   ▼
                 │ migrate
                 │
                 ▼
             Production
```

---

# 35. Complete Telegram Serverless Request Lifecycle

```text
USER
 │
 │ "Hello"
 ▼
TELEGRAM
 │
 │ Update.message
 ▼
TELEGRAM SERVERLESS
 │
 ▼
handlers/message.js
 │
 ├───────────────┐
 │               │
 ▼               ▼
db               api
 │               │
 ▼               ▼
SQLite       sendMessage
 │               │
 └───────────────┘
         │
         ▼
     TELEGRAM
         │
         ▼
        USER
```

Telegram Serverless removes the need for:

```text
VPS
Nginx
Apache
PM2
Docker
Manual webhook server
Express
PHP
Laravel
```

for the bot backend itself.

---

# 36. Built-in SDK

Common imports:

```javascript
import {
    db,
    api,
    fetch,
    InputFile,
    BotApiError,
    EndpointError
} from 'sdk';
```

For a normal chat bot, the most important are:

```text
api
db
InputFile
BotApiError
console
```

---

# 37. Bot API Error Handling

Example:

```javascript
import {
    api,
    BotApiError
} from 'sdk';


try {

    await api.sendMessage({
        chat_id: chatId,
        text: 'Hello'
    });

}
catch (error) {

    if (error instanceof BotApiError) {

        console.error(
            error.code,
            error.description
        );

        return;
    }

    throw error;
}
```

---

# 38. Sending Files

Example:

```javascript
import {
    api,
    InputFile
} from 'sdk';


const file =
    new InputFile(
        bytes,
        'report.pdf',
        {
            type:
                'application/pdf'
        }
    );


await api.sendDocument({

    chat_id: chatId,

    document: file

});
```

---

# 39. Download Telegram Files

Example:

```javascript
const bytes =
    await api.getFileContent(
        fileId
    );
```

Or stream:

```javascript
const {
    file,
    body
} =
    await api.getFileStream(
        fileId
    );
```

---

# 40. Important CLI Commands

| Command | Purpose |
|---|---|
| `npx tgcloud login` | Connect local project to the bot |
| `npx tgcloud status` | Show local/deployed status |
| `npx tgcloud diff` | Show exact changes |
| `npx tgcloud add` | Create handlers, library modules or endpoints |
| `npx tgcloud run` | Test without deployment |
| `npx tgcloud push` | Deploy code |
| `npx tgcloud migrate` | Apply database schema changes |
| `npx tgcloud webhook` | Inspect webhook status |
| `npx tgcloud fetch` | Refresh remote project state |
| `npx tgcloud pull` | Download remote modules |
| `npx tgcloud reset` | Restore local modules from deployed state |
| `npx tgcloud upgrade` | Upgrade an older project layout |

---

# 41. Recommended Learning Order

Learn Telegram Serverless in this order:

```text
1. Bot creation
      ↓
2. Enable Serverless
      ↓
3. CLI login
      ↓
4. handlers/message.js
      ↓
5. api.sendMessage()
      ↓
6. Commands
      ↓
7. Inline buttons
      ↓
8. callback_query handler
      ↓
9. schema.js
      ↓
10. db insert/select/update
      ↓
11. lib/ modules
      ↓
12. tgcloud run
      ↓
13. tgcloud push
      ↓
14. tgcloud migrate
      ↓
15. webhook monitoring
```

---

# Final Architecture

```text
                    Telegram User
                          │
                          ▼
                     Telegram
                          │
                          ▼
                Telegram Serverless
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
         handlers/                    lib/
             │                         │
             └────────────┬────────────┘
                          │
                  ┌───────┴───────┐
                  │               │
                  ▼               ▼
               Bot API          SQLite
                api.*             db.*
                  │               │
                  └───────┬───────┘
                          │
                          ▼
                       Telegram
                          │
                          ▼
                     Telegram User
```

---

## Official Documentation

Telegram Serverless:

https://core.telegram.org/bots/serverless
