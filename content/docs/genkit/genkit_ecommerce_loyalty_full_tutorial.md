---
title: "Genkit Full Tutorial — Localhost + E-commerce + Loyalty"
---

# Genkit Full Tutorial — Localhost + E-commerce + Loyalty

## 1. What We Are Building

This tutorial builds an **AI Shopping + Loyalty Assistant** using:

- Firebase Genkit
- TypeScript
- Gemini
- Genkit tools
- Genkit flows
- Structured output
- Localhost API
- Genkit Developer UI
- E-commerce product search
- Loyalty points
- Membership tier
- Rewards
- Deterministic checkout calculations

Architecture:

```text
Customer / Mobile App
        |
        | "I have 620 points.
        | Recommend coffee under $4."
        v
+----------------------------+
| Genkit Flow                |
| commerceLoyaltyAssistant   |
+-------------+--------------+
              |
              v
        Gemini Model
              |
        tool calling
              |
     +--------+---------+----------------+
     |                  |                |
     v                  v                v
searchProducts    getLoyalty      getRewards
     |                  |                |
     +------------------+----------------+
                        |
                        v
                Verified business data
                        |
                        v
              Structured AI response
```

A second flow will handle deterministic checkout calculations:

```text
checkoutLoyaltyQuote
```

It calculates:

```text
subtotal
reward discount
points used
points earned
projected point balance
```

Important rule:

> Do not let the LLM calculate or modify loyalty balances directly.

Use normal application code for:

- Pricing
- Stock
- Loyalty balance
- Rewards
- Redemption
- Transactions
- Order state

Use Gemini for:

- Natural-language understanding
- Tool selection
- Recommendations
- Explanations
- Structured responses

---

# 2. Requirements

Check Node.js:

```powershell
node --version
npm --version
```

Recommended:

```text
Node.js 20+
```

Create the project:

```powershell
mkdir genkit-commerce-loyalty
cd genkit-commerce-loyalty

npm init -y

npm install genkit @genkit-ai/google-genai @genkit-ai/express dotenv

npm install -D typescript tsx genkit-cli

mkdir src
```

---

# 3. Configure package.json

Update `package.json`:

```json
{
  "name": "genkit-commerce-loyalty",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx --watch src/index.ts",
    "genkit": "genkit start -- tsx --watch src/index.ts"
  }
}
```

---

# 4. Configure TypeScript

Create:

```text
tsconfig.json
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": [
    "src/**/*.ts"
  ]
}
```

---

# 5. Configure Gemini API Key

Create:

```text
.env
```

```env
GEMINI_API_KEY=YOUR_REAL_GEMINI_API_KEY
PORT=3400
```

Create:

```text
.gitignore
```

```gitignore
node_modules
.env
dist
.genkit
```

Never commit your real Gemini API key.

---

# 6. Initial Project Structure

```text
genkit-commerce-loyalty/
│
├── src/
│   └── index.ts
│
├── .env
├── .gitignore
├── package.json
└── tsconfig.json
```

Later you can split it into:

```text
src/
├── config/
├── flows/
├── tools/
├── repositories/
├── schemas/
├── services/
└── index.ts
```

---

# 7. Full Genkit Example

Create:

```text
src/index.ts
```

Paste:

```typescript
import 'dotenv/config';

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { startFlowServer } from '@genkit-ai/express';


/*
|--------------------------------------------------------------------------
| Genkit Configuration
|--------------------------------------------------------------------------
*/

const ai = genkit({
  plugins: [
    googleAI(),
  ],

  model: googleAI.model('gemini-flash-latest'),
});


/*
|--------------------------------------------------------------------------
| Mock Database
|--------------------------------------------------------------------------
*/

const PRODUCTS = [
  {
    id: 'P1001',
    name: 'Iced Americano',
    category: 'COFFEE',
    price: 2.80,
    stock: 50,
    tags: ['coffee', 'americano', 'cold'],
  },
  {
    id: 'P1002',
    name: 'Iced Latte',
    category: 'COFFEE',
    price: 3.60,
    stock: 30,
    tags: ['coffee', 'latte', 'milk', 'cold'],
  },
  {
    id: 'P1003',
    name: 'Hot Cappuccino',
    category: 'COFFEE',
    price: 3.50,
    stock: 25,
    tags: ['coffee', 'cappuccino', 'hot'],
  },
  {
    id: 'P2001',
    name: 'Chicken Sandwich',
    category: 'FOOD',
    price: 4.50,
    stock: 18,
    tags: ['sandwich', 'chicken', 'food'],
  },
  {
    id: 'P2002',
    name: 'Ham & Cheese Croissant',
    category: 'FOOD',
    price: 3.75,
    stock: 15,
    tags: ['croissant', 'ham', 'cheese', 'food'],
  },
  {
    id: 'P3001',
    name: 'BROWN Tumbler',
    category: 'MERCHANDISE',
    price: 15.00,
    stock: 10,
    tags: ['tumbler', 'cup', 'merchandise'],
  },
];


const CUSTOMERS = [
  {
    userId: 'U1001',
    name: 'Demo Golden User',
    tier: 'GOLDEN',
    points: 620,
  },
  {
    userId: 'U1002',
    name: 'Demo Member',
    tier: 'MEMBER',
    points: 160,
  },
];


const REWARDS = [
  {
    code: 'VOUCHER_2',
    title: '$2 Discount Voucher',
    pointsCost: 200,
    discountUsd: 2,
  },
  {
    code: 'VOUCHER_5',
    title: '$5 Discount Voucher',
    pointsCost: 450,
    discountUsd: 5,
  },
  {
    code: 'VOUCHER_10',
    title: '$10 Discount Voucher',
    pointsCost: 900,
    discountUsd: 10,
  },
];


/*
|--------------------------------------------------------------------------
| Schemas
|--------------------------------------------------------------------------
*/

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  stock: z.number(),
  tags: z.array(z.string()),
});


const LoyaltySchema = z.object({
  found: z.boolean(),
  userId: z.string(),
  name: z.string(),
  tier: z.string(),
  points: z.number(),
  multiplier: z.number(),
});


const RewardSchema = z.object({
  code: z.string(),
  title: z.string(),
  pointsCost: z.number(),
  discountUsd: z.number(),
  affordable: z.boolean(),
});


const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(20),
});


const CartQuoteSchema = z.object({

  ok: z.boolean(),

  userId: z.string(),

  tier: z.string(),

  multiplier: z.number(),

  subtotal: z.number(),

  pointsToEarn: z.number(),

  lineItems: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number(),
      quantity: z.number(),
      lineTotal: z.number(),
    })
  ),

  errors: z.array(z.string()),
});


/*
|--------------------------------------------------------------------------
| Business Logic
|--------------------------------------------------------------------------
*/

function getTierMultiplier(tier: string): number {

  switch (tier) {

    case 'GOLDEN':
      return 1.5;

    case 'SILVER':
      return 1.2;

    default:
      return 1;
  }
}


/*
|--------------------------------------------------------------------------
| Cart Calculation
|--------------------------------------------------------------------------
*/

function calculateCart(
  userId: string,
  items: Array<{
    productId: string;
    quantity: number;
  }>
) {

  const customer = CUSTOMERS.find(
    customer => customer.userId === userId
  );

  if (!customer) {

    return {

      ok: false,

      userId,

      tier: 'UNKNOWN',

      multiplier: 1,

      subtotal: 0,

      pointsToEarn: 0,

      lineItems: [],

      errors: [
        'Customer not found'
      ],
    };

  }

  const multiplier = getTierMultiplier(
    customer.tier
  );

  const lineItems: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }> = [];

  const errors: string[] = [];

  let subtotal = 0;

  for (const item of items) {

    const product = PRODUCTS.find(
      product => product.id === item.productId
    );

    if (!product) {

      errors.push(
        `Product ${item.productId} was not found`
      );

      continue;
    }

    if (product.stock < item.quantity) {

      errors.push(
        `Insufficient stock for ${product.name}`
      );

      continue;
    }

    const lineTotal =
      product.price * item.quantity;

    subtotal += lineTotal;

    lineItems.push({

      productId: product.id,

      name: product.name,

      price: product.price,

      quantity: item.quantity,

      lineTotal:
        Number(lineTotal.toFixed(2)),

    });

  }

  subtotal =
    Number(subtotal.toFixed(2));

  /*
  |--------------------------------------------------------------------------
  | Example Loyalty Formula
  |--------------------------------------------------------------------------
  |
  | $1 = 10 base points
  |
  | MEMBER = x1
  | SILVER = x1.2
  | GOLDEN = x1.5
  |
  */

  const pointsToEarn =
    Math.floor(
      subtotal
      * 10
      * multiplier
    );

  return {

    ok: errors.length === 0,

    userId,

    tier: customer.tier,

    multiplier,

    subtotal,

    pointsToEarn,

    lineItems,

    errors,

  };

}


/*
|--------------------------------------------------------------------------
| TOOL 1 - Product Search
|--------------------------------------------------------------------------
*/

const searchProducts = ai.defineTool(

  {

    name: 'searchProducts',

    description:
      'Search the ecommerce product catalog by keyword, category and maximum price. Use this before recommending products.',

    inputSchema: z.object({

      query: z
        .string()
        .describe(
          'Product search keywords such as coffee, sandwich, latte or tumbler'
        ),

      category: z
        .string()
        .optional()
        .describe(
          'Optional category such as COFFEE, FOOD or MERCHANDISE'
        ),

      maxPrice: z
        .number()
        .optional()
        .describe(
          'Optional maximum product price in USD'
        ),

    }),

    outputSchema:
      z.array(ProductSchema),

  },

  async ({
    query,
    category,
    maxPrice,
  }) => {

    const q =
      query.trim().toLowerCase();

    return PRODUCTS
      .filter(product => {

        const searchable =
          [
            product.name,
            product.category,
            ...product.tags,
          ]
            .join(' ')
            .toLowerCase();

        if (
          q &&
          !searchable.includes(q)
        ) {
          return false;
        }

        if (
          category &&
          product.category.toUpperCase()
          !== category.toUpperCase()
        ) {
          return false;
        }

        if (
          maxPrice !== undefined &&
          product.price > maxPrice
        ) {
          return false;
        }

        if (product.stock <= 0) {
          return false;
        }

        return true;

      })
      .slice(0, 10);

  }

);


/*
|--------------------------------------------------------------------------
| TOOL 2 - Loyalty Profile
|--------------------------------------------------------------------------
*/

const getCustomerLoyalty = ai.defineTool(

  {

    name: 'getCustomerLoyalty',

    description:
      'Returns the verified loyalty points and membership tier for a customer.',

    inputSchema: z.object({

      userId: z.string(),

    }),

    outputSchema:
      LoyaltySchema,

  },

  async ({ userId }) => {

    const customer = CUSTOMERS.find(
      customer =>
        customer.userId === userId
    );

    if (!customer) {

      return {

        found: false,

        userId,

        name: '',

        tier: 'UNKNOWN',

        points: 0,

        multiplier: 1,

      };

    }

    return {

      found: true,

      userId: customer.userId,

      name: customer.name,

      tier: customer.tier,

      points: customer.points,

      multiplier:
        getTierMultiplier(customer.tier),

    };

  }

);


/*
|--------------------------------------------------------------------------
| TOOL 3 - Reward Options
|--------------------------------------------------------------------------
*/

const getRewardOptions = ai.defineTool(

  {

    name: 'getRewardOptions',

    description:
      'Returns available loyalty reward options and whether the customer currently has enough points to redeem each reward.',

    inputSchema: z.object({

      userId: z.string(),

    }),

    outputSchema: z.object({

      customerFound:
        z.boolean(),

      currentPoints:
        z.number(),

      rewards:
        z.array(RewardSchema),

    }),

  },

  async ({ userId }) => {

    const customer = CUSTOMERS.find(
      customer =>
        customer.userId === userId
    );

    if (!customer) {

      return {

        customerFound: false,

        currentPoints: 0,

        rewards: [],

      };

    }

    return {

      customerFound: true,

      currentPoints:
        customer.points,

      rewards:
        REWARDS.map(reward => ({

          ...reward,

          affordable:
            customer.points >=
            reward.pointsCost,

        })),

    };

  }

);


/*
|--------------------------------------------------------------------------
| TOOL 4 - Cart Loyalty Calculation
|--------------------------------------------------------------------------
*/

const calculateCartLoyalty = ai.defineTool(

  {

    name: 'calculateCartLoyalty',

    description:
      'Calculates an ecommerce cart subtotal and the loyalty points the customer would earn. Use this tool instead of doing arithmetic yourself.',

    inputSchema: z.object({

      userId: z.string(),

      items:
        z.array(CartItemSchema),

    }),

    outputSchema:
      CartQuoteSchema,

  },

  async ({
    userId,
    items,
  }) => {

    return calculateCart(
      userId,
      items
    );

  }

);


/*
|--------------------------------------------------------------------------
| AI Assistant Output
|--------------------------------------------------------------------------
*/

const AssistantOutputSchema = z.object({

  reply:
    z.string()
      .describe(
        'Natural language response for the customer'
      ),

  recommendedProductIds:
    z.array(z.string()),

  recommendedRewardCodes:
    z.array(z.string()),

  checkoutSuggested:
    z.boolean(),

});


/*
|--------------------------------------------------------------------------
| FLOW 1 - AI Ecommerce + Loyalty Assistant
|--------------------------------------------------------------------------
*/

export const commerceLoyaltyAssistant =
  ai.defineFlow(

    {

      name:
        'commerceLoyaltyAssistant',

      inputSchema: z.object({

        userId:
          z.string(),

        message:
          z.string().min(1),

      }),

      outputSchema:
        AssistantOutputSchema,

    },

    async ({
      userId,
      message,
    }) => {

      const response =
        await ai.generate({

          model:
            googleAI.model(
              'gemini-flash-latest'
            ),

          system: `
You are an ecommerce and loyalty assistant.

Your responsibilities are:

Help customers discover products.
Explain loyalty balances.
Explain rewards.
Help calculate potential cart points.

IMPORTANT BUSINESS RULES:

1. Never invent product prices.
2. Never invent product availability.
3. Never invent loyalty points.
4. Never invent membership tier.
5. Never calculate loyalty points yourself.
6. Use calculateCartLoyalty for cart calculations.
7. Use searchProducts before recommending products.
8. Use getCustomerLoyalty for loyalty information.
9. Use getRewardOptions before recommending rewards.

You are NOT allowed to:

- create an order
- change an order
- redeem points
- modify loyalty balance
- modify product stock
- claim that payment was completed

You may only recommend and provide verified information.

Keep responses friendly and concise.
`,

          prompt: `
Authenticated customer ID:

${userId}

Customer message:

${message}
`,

          tools: [

            searchProducts,

            getCustomerLoyalty,

            getRewardOptions,

            calculateCartLoyalty,

          ],

          maxTurns: 8,

          output: {

            schema:
              AssistantOutputSchema,

          },

        });

      if (!response.output) {

        throw new Error(
          'AI returned invalid structured output'
        );

      }

      return response.output;

    }

  );


/*
|--------------------------------------------------------------------------
| Checkout Quote Schema
|--------------------------------------------------------------------------
*/

const CheckoutQuoteOutputSchema =
  z.object({

    ok:
      z.boolean(),

    userId:
      z.string(),

    tier:
      z.string(),

    subtotal:
      z.number(),

    rewardCode:
      z.string()
      .nullable(),

    rewardDiscount:
      z.number(),

    pointsBefore:
      z.number(),

    pointsUsed:
      z.number(),

    projectedPointsEarned:
      z.number(),

    projectedPointsAfter:
      z.number(),

    payableTotal:
      z.number(),

    errors:
      z.array(z.string()),

  });


/*
|--------------------------------------------------------------------------
| FLOW 2 - Deterministic Checkout Loyalty Quote
|--------------------------------------------------------------------------
*/

export const checkoutLoyaltyQuote =
  ai.defineFlow(

    {

      name:
        'checkoutLoyaltyQuote',

      inputSchema: z.object({

        userId:
          z.string(),

        items:
          z.array(
            CartItemSchema
          ),

        redeemRewardCode:
          z.string()
          .optional(),

      }),

      outputSchema:
        CheckoutQuoteOutputSchema,

    },

    async ({
      userId,
      items,
      redeemRewardCode,
    }) => {

      const customer =
        CUSTOMERS.find(
          customer =>
            customer.userId === userId
        );

      if (!customer) {

        return {

          ok: false,

          userId,

          tier: 'UNKNOWN',

          subtotal: 0,

          rewardCode: null,

          rewardDiscount: 0,

          pointsBefore: 0,

          pointsUsed: 0,

          projectedPointsEarned: 0,

          projectedPointsAfter: 0,

          payableTotal: 0,

          errors: [
            'Customer not found'
          ],

        };

      }

      const cart =
        calculateCart(
          userId,
          items
        );

      const errors =
        [...cart.errors];

      let pointsUsed = 0;

      let rewardDiscount = 0;

      let appliedRewardCode:
        string | null = null;

      if (redeemRewardCode) {

        const reward =
          REWARDS.find(
            reward =>
              reward.code ===
              redeemRewardCode
          );

        if (!reward) {

          errors.push(
            'Reward code not found'
          );

        }

        else if (
          customer.points <
          reward.pointsCost
        ) {

          errors.push(
            'Not enough loyalty points'
          );

        }

        else {

          pointsUsed =
            reward.pointsCost;

          rewardDiscount =
            Math.min(
              reward.discountUsd,
              cart.subtotal
            );

          appliedRewardCode =
            reward.code;

        }

      }

      const payableTotal =
        Number(
          Math.max(
            0,
            cart.subtotal -
            rewardDiscount
          )
          .toFixed(2)
        );

      const multiplier =
        getTierMultiplier(
          customer.tier
        );

      const projectedPointsEarned =
        Math.floor(
          payableTotal
          * 10
          * multiplier
        );

      const projectedPointsAfter =
        customer.points
        - pointsUsed
        + projectedPointsEarned;

      return {

        ok:
          errors.length === 0,

        userId,

        tier:
          customer.tier,

        subtotal:
          cart.subtotal,

        rewardCode:
          appliedRewardCode,

        rewardDiscount,

        pointsBefore:
          customer.points,

        pointsUsed,

        projectedPointsEarned,

        projectedPointsAfter,

        payableTotal,

        errors,

      };

    }

  );


/*
|--------------------------------------------------------------------------
| Start HTTP Flow Server
|--------------------------------------------------------------------------
*/

startFlowServer({

  flows: [

    commerceLoyaltyAssistant,

    checkoutLoyaltyQuote,

  ],

  port:
    Number(
      process.env.PORT ?? 3400
    ),

  cors: {

    origin: '*',

  },

});
```

---

# 8. Start Genkit Locally

Run:

```powershell
npm run genkit
```

Developer UI:

```text
http://localhost:4000
```

HTTP API:

```text
http://localhost:3400
```

---

# 9. Test AI Flow in Genkit Developer UI

Open:

```text
http://localhost:4000
```

Select:

```text
commerceLoyaltyAssistant
```

Input:

```json
{
  "userId": "U1001",
  "message": "I want a coffee under $4. Also tell me my loyalty points and which reward I can redeem."
}
```

Possible execution flow:

```text
commerceLoyaltyAssistant
        |
        v
Gemini
        |
        +---- searchProducts
        |
        +---- getCustomerLoyalty
        |
        +---- getRewardOptions
        |
        v
Gemini final response
```

Possible output:

```json
{
  "reply": "You have 620 points and Golden membership. Iced Americano, Iced Latte, and Hot Cappuccino are under $4. You can redeem the $2 or $5 voucher.",
  "recommendedProductIds": [
    "P1001",
    "P1002",
    "P1003"
  ],
  "recommendedRewardCodes": [
    "VOUCHER_2",
    "VOUCHER_5"
  ],
  "checkoutSuggested": true
}
```

---

# 10. Test Checkout Loyalty Flow

Select:

```text
checkoutLoyaltyQuote
```

Input:

```json
{
  "userId": "U1001",
  "items": [
    {
      "productId": "P1002",
      "quantity": 2
    },
    {
      "productId": "P2001",
      "quantity": 1
    }
  ],
  "redeemRewardCode": "VOUCHER_5"
}
```

Calculation:

```text
2 × Iced Latte
2 × $3.60
= $7.20

1 × Chicken Sandwich
= $4.50

Subtotal
= $11.70

Reward
= -$5.00

Payable
= $6.70
```

Golden multiplier:

```text
1.5
```

Formula:

```text
Points =
floor(
    payableAmount
    × 10
    × tierMultiplier
)
```

Example:

```text
6.70 × 10 × 1.5
= 100.5

floor()
= 100 points
```

Points:

```text
Before:
620

Redeemed:
-450

Earned:
+100

Projected balance:
270
```

---

# 11. Test Using Postman

Request:

```text
POST http://localhost:3400/commerceLoyaltyAssistant
```

Headers:

```text
Content-Type: application/json
```

Body:

```json
{
  "data": {
    "userId": "U1001",
    "message": "Show me coffee under $4 and tell me what rewards I can redeem."
  }
}
```

---

# 12. Test Using PowerShell

```powershell
$body = @{
    data = @{
        userId = "U1001"
        message = "Show me coffee under 4 dollars and check my loyalty rewards."
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
    -Uri "http://localhost:3400/commerceLoyaltyAssistant" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

---

# 13. Test Deterministic Checkout Flow Through HTTP

```powershell
$body = @{
    data = @{
        userId = "U1001"

        items = @(
            @{
                productId = "P1002"
                quantity = 2
            },
            @{
                productId = "P2001"
                quantity = 1
            }
        )

        redeemRewardCode = "VOUCHER_5"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
    -Uri "http://localhost:3400/checkoutLoyaltyQuote" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

---

# 14. Main Genkit Concepts

| Concept | Example |
|---|---|
| Model | Gemini |
| Flow | `commerceLoyaltyAssistant` |
| Flow | `checkoutLoyaltyQuote` |
| Tool | `searchProducts` |
| Tool | `getCustomerLoyalty` |
| Tool | `getRewardOptions` |
| Tool | `calculateCartLoyalty` |
| Schema | Zod |
| Developer UI | `localhost:4000` |
| HTTP API | `localhost:3400` |
| Trace | Shows model/tool execution |

## Flow

A flow represents a complete workflow.

Example:

```text
commerceLoyaltyAssistant
```

## Tool

A tool represents a capability Gemini is allowed to use.

Examples:

```text
searchProducts
getCustomerLoyalty
getRewardOptions
calculateCartLoyalty
```

Example:

```text
User:
"What rewards can I get?"
```

Gemini can call:

```text
getCustomerLoyalty
        +
getRewardOptions
```

Then Genkit runs those functions and gives the verified results back to Gemini.

---

# 15. Why Tools Are Important

Bad approach:

```typescript
await ai.generate({
  prompt: `
    User has 620 points.
    Products are...
    Rewards are...
  `
});
```

Better:

```text
Gemini
   |
   +--> getProducts()
   |
   +--> getMember()
   |
   +--> getRewards()
   |
   +--> calculateCart()
```

Benefits:

- Current business data
- Less prompt size
- Better security
- Easier debugging
- Deterministic calculations
- Easier connection to real APIs

---

# 16. Connect Genkit to an Existing Backend

Recommended architecture:

```text
Mobile App / Web
        |
        v
Central API
PHP / Laravel / Spring Boot
        |
        v
Genkit AI Service
Node.js + TypeScript
        |
        +------------------------+
        |                        |
        v                        v
Product API                 Loyalty API
        |                        |
        v                        v
MySQL / BC                  Member DB
```

Example Genkit tool calling an existing internal API:

```typescript
const getCustomerLoyalty = ai.defineTool(
  {
    name: 'getCustomerLoyalty',

    description:
      'Retrieve the authenticated customer loyalty profile.',

    inputSchema: z.object({
      userId: z.string(),
    }),

    outputSchema: LoyaltySchema,
  },

  async ({ userId }) => {

    const response = await fetch(
      `http://localhost/brown-api/loyalty/profile?user_id=${userId}`,
      {
        headers: {
          'X-Internal-Key':
            process.env.INTERNAL_API_KEY!
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        'Loyalty service request failed'
      );
    }

    return await response.json();
  }
);
```

Genkit does not care whether the business system uses:

```text
PHP
Laravel
Spring Boot
MySQL
SQL Server
Microservices
```

It only needs a clean tool/API contract.

---

# 17. Recommended Production Architecture

```text
                    ┌─────────────────┐
                    │   Mobile App    │
                    │ Flutter / Web   │
                    └────────┬────────┘
                             │
                             │ JWT
                             ▼
                  ┌────────────────────┐
                  │ Central API        │
                  │ PHP / Spring       │
                  └─────────┬──────────┘
                            │
                            │ internal auth
                            ▼
                 ┌─────────────────────┐
                 │ Genkit AI Service   │
                 │ Node + TypeScript   │
                 └─────────┬───────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   Product Tool       Loyalty Tool      Order Tool
          │                │                │
          ▼                ▼                ▼
      Product API      Loyalty API       Order API
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                   Existing Database
```

---

# 18. Authentication Security

For localhost you may send:

```json
{
  "userId": "U1001"
}
```

Do not trust this in production.

A malicious user could change it to another customer ID.

Production flow:

```text
JWT
 |
 v
Backend verifies token
 |
 v
Backend determines user_id
 |
 v
Genkit receives trusted identity
```

Protect especially:

```text
loyalty points
membership
coupons
rewards
orders
payments
wallet balance
```

---

# 19. Safe Reward Redemption

Do not expose an unrestricted tool like:

```typescript
redeemPoints()
```

Recommended flow:

```text
AI recommends reward
        |
        v
Customer confirms
        |
        v
Backend validates
        |
        v
Begin transaction
        |
        v
Recheck point balance
        |
        v
Redeem
        |
        v
Commit transaction
```

AI may recommend.

The backend must authorize and execute the transaction.

---

# 20. Structured Output

Example:

```typescript
output: {
  schema: AssistantOutputSchema
}
```

This provides predictable data:

```json
{
  "reply": "...",
  "recommendedProductIds": [],
  "recommendedRewardCodes": [],
  "checkoutSuggested": false
}
```

This is much better for Flutter or web UI than parsing free-text AI responses.

Example UI mapping:

```text
AI response
   |
   +---- reply
   |
   +---- productIds
   |
   +---- rewardCodes
   |
   +---- checkoutSuggested
```

---

# 21. Full User Journey Example

```text
User:
"I need breakfast under $8.
I have points too."

            │
            ▼

commerceLoyaltyAssistant

            │
            ▼

Gemini detects:

Intent:
BUY BREAKFAST

Budget:
$8

Need:
loyalty information

            │
            ├───────────────┐
            ▼               ▼
     searchProducts   getCustomerLoyalty
            │               │
            └───────┬───────┘
                    ▼
             getRewardOptions
                    │
                    ▼
               Gemini
                    │
                    ▼

"Your Golden account has
620 points.

I recommend:

Iced Latte       $3.60
Chicken Sandwich $4.50

Total = $8.10

That's slightly above your $8 budget.

A $2 reward is available,
which would reduce the price
to $6.10."

                    │
                    ▼

User presses:
"Use $2 reward"

                    │
                    ▼

checkoutLoyaltyQuote

                    │
                    ▼

Backend validation

                    │
                    ▼

Actual checkout API

                    │
                    ▼

Payment

                    │
                    ▼

Order completed

                    │
                    ▼

Award loyalty points
```

---

# 22. Model Configuration

For development:

```typescript
googleAI.model(
  'gemini-flash-latest'
)
```

For production, consider pinning a specific tested model version after validating the flow.

That reduces unexpected behavior changes after model updates.

---

# 23. Where Genkit Fits

Genkit does not replace:

```text
Spring Boot
PHP
Laravel
MySQL
SQL Server
Redis
Kafka
Order service
Loyalty engine
Payment service
```

Think of Genkit as an:

```text
AI orchestration layer
```

Your normal backend owns:

```text
Authentication
Authorization
Products
Prices
Inventory
Orders
Payments
Loyalty balances
Mission progress
Coupons
Rewards
Transactions
Idempotency
```

Genkit handles:

```text
Natural-language understanding
Tool selection
Recommendations
AI reasoning
Structured responses
Prompt management
Agent workflows
Tracing
Model integration
```

---

# 24. Future E-commerce + Loyalty Genkit Architecture

```text
Genkit
│
├── Ecommerce Agent
│   ├── searchProducts
│   ├── productDetails
│   ├── checkStock
│   └── calculateCart
│
├── Loyalty Agent
│   ├── memberProfile
│   ├── pointBalance
│   ├── rewardCatalog
│   ├── missionProgress
│   └── rewardEligibility
│
├── Order Assistant
│   ├── orderHistory
│   ├── orderStatus
│   └── reorderSuggestion
│
└── Recommendation Engine
    ├── favoriteItems
    ├── lastOrders
    ├── availableRewards
    └── personalizedOffers
```

A mission system can later become another Genkit tool:

```text
getMissionProgress
getAvailableMissions
getMissionReward
getMissionEligibleProducts
```

Example customer question:

```text
"What mission should I complete next?"
```

Possible flow:

```text
Gemini
   |
   +--> getCustomerLoyalty
   |
   +--> getMissionProgress
   |
   +--> getAvailableMissions
   |
   +--> searchProducts
   |
   v
Personalized mission recommendation
```

---

# 25. Recommended Next Development Steps

After the localhost example works:

```text
Step 1
Move mock products to your real Product API

Step 2
Move customer points to your Loyalty API

Step 3
Move rewards to your real rewards database

Step 4
Add JWT/internal API authentication

Step 5
Add Redis caching

Step 6
Add order-history tool

Step 7
Add Mission On Board tools

Step 8
Add recommendation flow

Step 9
Add conversation/session support

Step 10
Deploy the Genkit service
```

Recommended final architecture:

```text
Flutter
   |
   v
Central API
   |
   v
Genkit AI Service
   |
   +------ Product Service
   |
   +------ Order Service
   |
   +------ Loyalty Service
   |
   +------ Mission Service
   |
   +------ Reward Service
```

This keeps AI separate from the transaction-critical business logic while still giving users a powerful ecommerce and loyalty assistant.
