---
title: "FastAPI Crash Course — Complete Guide"
description: "Beginner-friendly breakdown of modern Python REST API development with FastAPI and Pydantic."
---

# FastAPI Crash Course — Complete Guide

This document summarizes the uploaded ****FastAPI Crash Course - Modern Python API Development**** PDF in beginner-friendly language.

> Note: The uploaded PDF contains only the first 10 pages of the course transcript. It ends while the instructor is starting the Pydantic schemas section, so the complete Issue Tracker project is not included.

---

# 1. What is FastAPI?

****FastAPI**** is a modern Python framework for building:

- REST APIs

- Backend applications

- Microservices

- Web services

Simple idea:

\`\`\`text

Frontend / Mobile App

        ↓

      HTTP

        ↓

     FastAPI

        ↓

Business Logic

        ↓

Database / Storage

\`\`\`

For example, a mobile application could request:

\`\`\`http

GET /api/v1/issues

\`\`\`

FastAPI receives the request, runs Python code, gets the required data, and returns a JSON response.

FastAPI is built on top of ****Starlette****, which handles lower-level web features such as:

- Routing

- Middleware

- Requests

- Responses

- ASGI support

---

# 2. Why Use FastAPI?

FastAPI provides many useful features.

\| Feature | Easy Explanation |

\|---|---|

\| High performance | Can handle many API requests efficiently |

\| ASGI | Supports asynchronous/concurrent requests |

\| Pydantic | Validates request and response data |

\| Swagger | Automatically creates interactive API documentation |

\| Python type hints | Help FastAPI understand your data |

\| Dependency injection | Makes shared services easier to manage |

\| Security utilities | Supports OAuth2, JWT, authentication patterns |

\| WebSockets | Supports real-time applications |

\| Minimal boilerplate | Requires relatively little setup code |

The course focuses mainly on learning:

- Project structure

- Routes

- Pydantic models

- API architecture

- Python type hints

- Swagger

- Storage

- FastAPI fundamentals

---

# 3. ASGI vs WSGI

Older Python web applications often use:

\`\`\`text

WSGI

Web Server Gateway Interface

\`\`\`

WSGI is synchronous.

A simplified idea:

\`\`\`text

Request A

   ↓

Process

   ↓

Finish

   ↓

Request B

\`\`\`

FastAPI uses:

\`\`\`text

ASGI

Asynchronous Server Gateway Interface

\`\`\`

ASGI supports asynchronous processing.

Example:

\`\`\`text

Request A → waiting for database

Request B → processing

Request C → processing

Request A → database result returned

\`\`\`

This is especially useful when your API frequently waits for things such as:

- Database queries

- External APIs

- File operations

- Network requests

The tutorial uses JSON storage, so it does not fully demonstrate async database benefits.

---

# 4. Main FastAPI Architecture

A typical FastAPI application can look like this:

\`\`\`text

React / Vue / Mobile App

           │

           │ HTTP Request

           ▼

        NGINX

           │

           ▼

      ASGI Server

       Uvicorn

           │

           ▼

        FastAPI

           │

      ┌────┴─────┐

      │          │

    Routes    Pydantic

      │        Models

      ▼

 Business Logic

      │

      ▼

 Database / JSON

\`\`\`

Example request:

\`\`\`http

GET /api/v1/issues

\`\`\`

FastAPI processes the route, validates data if necessary, loads the data, and returns a JSON response.

---

# 5. Creating the Project

The tutorial starts by creating a new project folder.

Example:

\`\`\`text

fastapi-issue-tracker/

\`\`\`

Then create a Python virtual environment:

\`\`\`bash

python -m venv .venv

\`\`\`

A virtual environment keeps project dependencies separate from the rest of your computer.

Example:

\`\`\`text

fastapi-project/

│

├── .venv/

│   ├── FastAPI

│   ├── Pydantic

│   └── other packages

│

└── main.py

\`\`\`

## macOS / Linux

Activate it using:

\`\`\`bash

source ./.venv/bin/activate

\`\`\`

## Windows

Activate it using:

\`\`\`bash

./.venv/Scripts/activate

\`\`\`

---

# 6. Installing FastAPI

The course uses:

\`\`\`bash

pip install "fastapi[standard]"

\`\`\`

\`pip\` is Python's package manager.

This installs FastAPI and the dependencies needed for the course.

The instructor also mentions ****Uvicorn****, which is an ASGI server used to run FastAPI applications.

---

# 7. \`main.py\` — Application Entry Point

The first application file is:

\`\`\`text

main.py

\`\`\`

Basic FastAPI setup:

\`\`\`python

from fastapi import FastAPI

app = FastAPI()

\`\`\`

This:

\`\`\`python

app = FastAPI()

\`\`\`

creates the FastAPI application.

Think of \`app\` as the main object for your whole API.

---

# 8. Creating the First Route

The tutorial creates a health-check endpoint.

Example:

\`\`\`python

@app.get("/health")

def health_check():

    return {"status": "ok"}

\`\`\`

This decorator:

\`\`\`python

@app.get("/health")

\`\`\`

means:

\`\`\`text

HTTP Method = GET

URL         = /health

\`\`\`

When a client requests:

\`\`\`http

GET /health

\`\`\`

FastAPI runs:

\`\`\`python

health_check()

\`\`\`

and returns:

\`\`\`json

{

  "status": "ok"

}

\`\`\`

The function name itself does not control the URL.

The route decorator does.

---

# 9. Running the FastAPI Server

The tutorial uses:

\`\`\`bash

fastapi dev main.py

\`\`\`

The development server normally runs on:

\`\`\`text

http://localhost:8000

\`\`\`

If you visit:

\`\`\`text

http://localhost:8000/

\`\`\`

without creating a route for \`/\`, you get a Not Found response.

But:

\`\`\`text

http://localhost:8000/health

\`\`\`

returns:

\`\`\`json

{

  "status": "ok"

}

\`\`\`

---

# 10. Swagger Documentation

FastAPI automatically creates interactive API documentation.

Open:

\`\`\`text

http://localhost:8000/docs

\`\`\`

This opens ****Swagger UI****.

Swagger lets you:

- See all routes

- See HTTP methods

- View parameters

- Enter request bodies

- Send API requests

- See responses

- View response headers

- View status codes

- Get generated \`curl\` commands

Example:

\`\`\`text

GET /health

Try it out

    ↓

Execute

    ↓

200 OK

{

    "status": "ok"

}

\`\`\`

This means you can test many endpoints without needing Postman.

---

# 11. GET Routes

The tutorial creates a simple list:

\`\`\`python

items = [1, 2, 3]

\`\`\`

Then creates a route:

\`\`\`python

@app.get("/items")

def get_items():

    return items

\`\`\`

Request:

\`\`\`http

GET /items

\`\`\`

Response:

\`\`\`json

[

  1,

  2,

  3

]

\`\`\`

---

# 12. Path Parameters

FastAPI supports dynamic values inside URLs.

Example:

\`\`\`text

/items/{item_id}

\`\`\`

Request:

\`\`\`http

GET /items/1

\`\`\`

Here:

\`\`\`text

1

\`\`\`

becomes:

\`\`\`text

item_id

\`\`\`

Example code:

\`\`\`python

@app.get("/items/{item_id}")

def get_item(item_id: int):

    ...

\`\`\`

This:

\`\`\`python

item_id: int

\`\`\`

is a Python type hint.

It tells FastAPI:

> \`item_id\` should be an integer.

---

# 13. Path Parameters vs Query Parameters

## Path Parameter

Example:

\`\`\`text

/items/10

\`\`\`

Here:

\`\`\`text

10 = item_id

\`\`\`

Typical code:

\`\`\`python

@app.get("/items/{item_id}")

def get_item(item_id: int):

    ...

\`\`\`

## Query Parameters

Example:

\`\`\`text

/items?page=1&limit=10

\`\`\`

Values:

\`\`\`text

page  = 1

limit = 10

\`\`\`

Visual difference:

\`\`\`text

Path parameter:

GET /users/123

           ↑

        user_id

\`\`\`

\`\`\`text

Query parameters:

GET /users?page=1&limit=20

            ↑      ↑

           page   limit

\`\`\`

Query parameters can also have:

- Type hints

- Default values

- Validation

---

# 14. POST Requests

\`GET\` usually retrieves information.

\`POST\` usually creates or sends information.

Example:

\`\`\`http

POST /items

\`\`\`

Body:

\`\`\`json

{

  "name": "Test Item"

}

\`\`\`

The tutorial demonstrates a basic POST route that:

1. Receives an item

2. Adds it to the existing data

3. Returns the new item

---

# 15. The Problem Without Pydantic

Without a proper schema, the API can accept unexpected data.

Suppose you want:

\`\`\`json

{

  "name": "Coffee"

}

\`\`\`

But someone sends:

\`\`\`json

{

  "boo": "bar"

}

\`\`\`

Without proper validation, the API does not know the exact structure you expect.

This is why the tutorial introduces ****Pydantic****.

---

# 16. What is Pydantic?

Pydantic is used to define and validate structured data.

For example:

\`\`\`python

class Issue:

    title: str

    description: str

    priority: str

\`\`\`

Conceptually:

\`\`\`text

Incoming JSON

      ↓

   Pydantic

      ↓

Validation

      ↓

Valid?

  /       \\

Yes       No

 │         │

 ▼         ▼

Route     Error

\`\`\`

FastAPI uses Pydantic together with Python type hints.

Pydantic can be used for:

- Request body validation

- Response validation

- Data serialization

- API documentation

---

# 17. Why Split Routes Into Separate Files?

At first, everything can be placed inside:

\`\`\`text

main.py

\`\`\`

But as the project grows, this becomes difficult to maintain.

Bad example:

\`\`\`text

main.py

├── 20 issue routes

├── 20 user routes

├── 10 auth routes

├── 10 product routes

├── 20 order routes

└── more code

\`\`\`

The tutorial moves issue-related routes to:

\`\`\`text

app/routes/issues.py

\`\`\`

Better structure:

\`\`\`text

project/

│

├── main.py

│

└── app/

    └── routes/

        └── issues.py

\`\`\`

---

# 18. \`APIRouter\`

FastAPI provides:

\`\`\`python

APIRouter

\`\`\`

Example:

\`\`\`python

from fastapi import APIRouter

router = APIRouter()

\`\`\`

Instead of:

\`\`\`python

@app.get(...)

\`\`\`

inside the route file, use:

\`\`\`python

@router.get(...)

\`\`\`

Example:

\`\`\`python

@router.get("/")

def get_issues():

    return []

\`\`\`

\`APIRouter\` helps organize different resources separately.

Examples:

\`\`\`text

issues.py

users.py

orders.py

products.py

\`\`\`

---

# 19. Router Prefix

Instead of repeating:

\`\`\`text

/api/v1/issues

\`\`\`

for every route, define a prefix.

Example concept:

\`\`\`python

router = APIRouter(

    prefix="/api/v1/issues"

)

\`\`\`

Then individual routes can use:

\`\`\`text

/

\`\`\`

or:

\`\`\`text

/{issue_id}

\`\`\`

Final URLs could become:

\`\`\`text

GET /api/v1/issues

GET /api/v1/issues/1

POST /api/v1/issues

\`\`\`

---

# 20. API Versioning

The tutorial uses:

\`\`\`text

/api/v1/issues

\`\`\`

\`v1\` means:

\`\`\`text

Version 1

\`\`\`

If your API changes significantly later, you could create:

\`\`\`text

/api/v2/issues

\`\`\`

This lets older clients continue using the old API while new clients use the new one.

---

# 21. Router Tags

Router tags help organize Swagger documentation.

For example:

\`\`\`text

Issues

Users

Orders

Products

\`\`\`

Swagger can group endpoints by resource.

---

# 22. Connecting the Router to \`main.py\`

Creating \`issues.py\` is not enough.

You must include the router in the main FastAPI application.

Example:

\`\`\`python

from app.routes.issues import router as issues_router

\`\`\`

Then:

\`\`\`python

app.include_router(issues_router)

\`\`\`

Architecture:

\`\`\`text

main.py

  │

  ├── FastAPI()

  │

  └── include_router()

           │

           ▼

   app/routes/issues.py

           │

           ├── GET issues

           ├── POST issue

           ├── PUT issue

           └── etc.

\`\`\`

---

# 23. Project Structure at This Point

The project becomes roughly:

\`\`\`text

fastapi-issue-tracker/

│

├── main.py

│

└── app/

    │

    ├── routes/

    │   └── issues.py

    │

    ├── storage.py

    │

    └── schemas.py

\`\`\`

The runtime data is intended to go into:

\`\`\`text

data/

└── issues.json

\`\`\`

Responsibilities:

\`\`\`text

main.py

↓

Starts FastAPI and connects routers

\`\`\`

\`\`\`text

routes/issues.py

↓

Contains issue HTTP endpoints

\`\`\`

\`\`\`text

storage.py

↓

Reads and writes stored data

\`\`\`

\`\`\`text

schemas.py

↓

Defines and validates issue data

\`\`\`

---

# 24. Storage System

The tutorial does not use a real database yet.

Instead, it stores issues in:

\`\`\`text

data/issues.json

\`\`\`

The instructor explains that a production project might use:

- PostgreSQL

- SQLAlchemy

- SQLModel

- Another ORM/database solution

But JSON is used so the course can focus on FastAPI itself.

---

# 25. \`storage.py\`

The storage module contains two main functions:

\`\`\`text

load_data()

save_data()

\`\`\`

Think of them as:

\`\`\`text

load_data()

JSON → Python

\`\`\`

\`\`\`text

save_data()

Python → JSON

\`\`\`

---

# 26. \`load_data()\`

The function checks whether the JSON file exists.

Conceptually:

\`\`\`text

Does issues.json exist?

       │

   ┌───┴────┐

   │        │

  YES       NO

   │        │

   ▼        ▼

Read file  Return []

   │

   ▼

Parse JSON

   │

   ▼

Return data

\`\`\`

The tutorial uses:

\`\`\`python

pathlib

\`\`\`

and:

\`\`\`python

json

\`\`\`

The file is opened in read mode:

\`\`\`text

r

\`\`\`

Then the content is parsed from JSON.

If the file does not exist, the function returns:

\`\`\`python

[]

\`\`\`

---

# 27. \`save_data()\`

The save function writes Python data into the JSON file.

Conceptually:

\`\`\`text

Python data

    ↓

Create data/ directory if needed

    ↓

Open issues.json

    ↓

Write mode "w"

    ↓

json.dump(...)

    ↓

issues.json updated

\`\`\`

The directory creation uses options equivalent to:

\`\`\`python

parents=True

exist_ok=True

\`\`\`

Meaning:

- Create missing parent directories

- Do not fail if the directory already exists

The JSON is written with indentation so the file is easier to read.

---

# 28. Why Use \`load_data()\` and \`save_data()\`?

Without helper functions, every route might repeat:

\`\`\`text

Open file

Read JSON

Parse JSON

Change data

Open file

Write JSON

\`\`\`

Instead, routes can simply call:

\`\`\`python

load_data()

\`\`\`

or:

\`\`\`python

save_data()

\`\`\`

This keeps route code cleaner.

---

# 29. \`schemas.py\`

Near the end of the PDF, the instructor starts creating:

\`\`\`text

app/schemas.py

\`\`\`

This file is intended to contain Pydantic models.

The tutorial explains that different operations may need different schemas.

Examples:

\`\`\`text

Create Issue

Update Issue

Issue Response

\`\`\`

For example, when creating an issue, the user might send:

\`\`\`text

title

description

priority

\`\`\`

But a response might also include:

\`\`\`text

id

status

created_at

\`\`\`

The uploaded transcript stops before the full schemas are implemented.

---

# 30. Example Issue Data

An issue may look conceptually like:

\`\`\`json

{

  "title": "Login button broken",

  "description": "The login button does nothing.",

  "priority": "high",

  "status": "open"

}

\`\`\`

The exact completed model is not available in the uploaded PDF.

---

# 31. Enums

The tutorial introduces Python \`Enum\`.

An enum means:

> A field can only use a predefined set of values.

Example status values:

\`\`\`text

OPEN

IN_PROGRESS

CLOSED

\`\`\`

Instead of allowing:

\`\`\`text

status = "banana"

\`\`\`

FastAPI/Pydantic can restrict the valid values.

Priority could also use an enum.

Example:

\`\`\`text

LOW

MEDIUM

HIGH

\`\`\`

---

# 32. \`BaseModel\`

The tutorial starts importing:

\`\`\`python

from pydantic import BaseModel

\`\`\`

Pydantic schemas normally inherit from \`BaseModel\`.

Example:

\`\`\`python

class IssueCreate(BaseModel):

    title: str

    description: str

\`\`\`

This means:

> This class describes structured data that Pydantic should validate.

The uploaded transcript ends shortly after this section begins.

---

# 33. Full Request Flow

Imagine the frontend sends:

\`\`\`http

POST /api/v1/issues

\`\`\`

with:

\`\`\`json

{

  "title": "App crashes",

  "description": "Crash after login",

  "priority": "high"

}

\`\`\`

The intended flow is:

\`\`\`text

Mobile / Web App

        │

        │ POST /api/v1/issues

        ▼

     FastAPI

        │

        ▼

  issues router

        │

        ▼

 Pydantic schema

        │

     Validate

        │

        ▼

 Route logic

        │

        ▼

  storage.py

        │

        ▼

data/issues.json

        │

        ▼

 JSON response

\`\`\`

This is the main architecture the PDF teaches.

---

# 34. GET, POST, PUT, DELETE

The uploaded section directly demonstrates GET and POST.

The general API pattern is:

\| Method | Purpose | Example |

\|---|---|---|

\| \`GET\` | Read data | Get issues |

\| \`POST\` | Create data | Create issue |

\| \`PUT\` | Update data | Update issue |

\| \`DELETE\` | Delete data | Delete issue |

A conventional Issue Tracker API could look like:

\`\`\`text

GET    /api/v1/issues

GET    /api/v1/issues/5

POST   /api/v1/issues

PUT    /api/v1/issues/5

DELETE /api/v1/issues/5

\`\`\`

However, the uploaded PDF does not contain the completed CRUD implementation.

---

# 35. Automatic Documentation

A powerful FastAPI relationship is:

\`\`\`text

Python type hints

       +

Pydantic Models

       +

FastAPI Routes

       ↓

Automatic Swagger Documentation

\`\`\`

Swagger can automatically understand things such as:

\`\`\`text

Endpoint

HTTP method

Parameters

Request body

Response

Validation rules

\`\`\`

This reduces the amount of manual API documentation work.

---

# 36. Dependency Injection

The course mentions dependency injection but does not implement it yet.

It can be used for shared components such as:

\`\`\`text

Database connections

Authentication

Shared services

Configuration

\`\`\`

Conceptually:

\`\`\`text

Route

  │

  └── needs database

         ↓

FastAPI supplies dependency

         ↓

Route uses it

\`\`\`

---

# 37. Authentication and Security

FastAPI provides utilities for common security approaches such as:

\`\`\`text

OAuth2

JWT

JSON Web Tokens

\`\`\`

But authentication is not implemented in this uploaded section.

The PDF does not yet teach:

\`\`\`text

Login

Access tokens

Refresh tokens

Protected routes

Roles

Permissions

\`\`\`

These are described as more advanced topics.

---

# 38. Real-Time Support

FastAPI also supports:

\`\`\`text

WebSockets

Streaming

\`\`\`

Possible use cases include:

\`\`\`text

Chat

Live notifications

Real-time dashboards

Live status updates

\`\`\`

These features are only mentioned in the uploaded section and are not implemented.

---

# 39. Most Important Things to Remember

Beginner mental model:

\`\`\`text

1. FastAPI()

      ↓

Creates your application

2. @app.get() / @router.get()

      ↓

Creates endpoints

3. APIRouter

      ↓

Separates routes into files

4. Path/query parameters

      ↓

Get values from URLs

5. POST body

      ↓

Receive JSON data

6. Pydantic

      ↓

Validate incoming/outgoing data

7. Swagger

      ↓

Automatically document and test the API

8. Storage / Database

      ↓

Store persistent data

9. Uvicorn / ASGI

      ↓

Runs the FastAPI application

\`\`\`

---

# 40. Architecture in One Picture

\`\`\`text

              CLIENT

        Web / Mobile App

               │

               │ HTTP

               ▼

       ┌─────────────────┐

       │     FastAPI     │

       └─────────────────┘

               │

               ▼

       ┌─────────────────┐

       │    APIRouter    │

       │     issues      │

       └─────────────────┘

               │

               ▼

       ┌─────────────────┐

       │    Pydantic     │

       │     Schema      │

       └─────────────────┘

               │

               ▼

       ┌─────────────────┐

       │  Route / Logic  │

       └─────────────────┘

               │

               ▼

       ┌─────────────────┐

       │   storage.py    │

       └─────────────────┘

               │

               ▼

       ┌─────────────────┐

       │   issues.json   │

       └─────────────────┘

\`\`\`

---

# 41. What the PDF Has Covered

By page 10, the uploaded PDF covers:

\`\`\`text

✓ What FastAPI is

✓ Starlette

✓ ASGI

✓ FastAPI architecture

✓ Virtual environments

✓ Installing FastAPI

✓ main.py

✓ FastAPI()

✓ GET routes

✓ POST routes

✓ Path parameters

✓ Query parameters

✓ Python type hints

✓ Swagger UI

✓ APIRouter

✓ Router prefix

✓ API versioning

✓ Separating routes

✓ JSON storage

✓ load_data()

✓ save_data()

✓ Basic Pydantic idea

✓ BaseModel introduction

✓ Enum introduction

\`\`\`

---

# 42. What the Uploaded PDF Does NOT Finish

The uploaded transcript stops before showing the complete implementation of:

\`\`\`text

✗ Finished Pydantic schemas

✗ Create Issue implementation

✗ Update Issue implementation

✗ Delete Issue implementation

✗ Complete CRUD API

✗ Proper HTTP errors

✗ Middleware implementation

✗ Complete response models

✗ Database integration

✗ SQLAlchemy

✗ PostgreSQL

✗ Authentication

✗ JWT

✗ Protected routes

✗ Pytest testing

✗ Production deployment

\`\`\`

The transcript ends while the instructor is starting \`schemas.py\`.

---

# 43. Simplest Way to Understand the Lesson

Remember:

\`\`\`text

FastAPI

   =

URLs

   +

Python functions

   +

Pydantic validation

   +

Business logic

   +

Storage / Database

   +

Automatic documentation

\`\`\`

The Issue Tracker is essentially intended to become:

\`\`\`text

GET /api/v1/issues

        ↓

Give me all issues

\`\`\`

\`\`\`text

GET /api/v1/issues/1

        ↓

Give me issue #1

\`\`\`

\`\`\`text

POST /api/v1/issues

        ↓

Create a new issue

\`\`\`

\`\`\`text

PUT /api/v1/issues/1

        ↓

Update issue #1

\`\`\`

\`\`\`text

DELETE /api/v1/issues/1

        ↓

Delete issue #1

\`\`\`

Once you understand:

\`\`\`text

Routes

  ↓

Schemas

  ↓

Business Logic

  ↓

Storage / Database

  ↓

Response

\`\`\`

you understand the basic FastAPI architecture taught in this part of the course.
---

# Part 2 — Completing the Missing FastAPI Lessons

**Important source note:** Sections 1–43 summarize the supplied partial course transcript. Sections 44 onward are an **original educational continuation** using modern FastAPI and Pydantic v2; they are not taken from unseen pages of the original course. A separate complete runnable example is included in `fastapi_issue_tracker/`.

# 44. Complete Pydantic Schemas

Pydantic `BaseModel` describes the shape of accepted data. FastAPI uses it to validate requests and automatically document them in Swagger UI.

```python
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Status(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"

class IssueCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=2000)
    priority: Priority = Priority.MEDIUM

class IssueUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    priority: Priority | None = None
    status: Status | None = None

class IssueResponse(IssueCreate):
    id: int
    status: Status
    created_at: datetime
```

**Three models are useful because:** `IssueCreate` represents fields a client may send to create a record; `IssueUpdate` represents changes to existing records; `IssueResponse` defines what the server sends back, including generated metadata. `Field` sets validation limits, and `extra="forbid"` rejects unexpected fields. In Pydantic v2, `.model_dump()` converts a model to a Python dictionary and `.model_dump(mode="json")` converts enums and dates to JSON-compatible values.

# 45. HTTP Status Codes and Validation

| Status | Meaning | Typical situation |
| --- | --- | --- |
| `200 OK` | Request succeeded | Read or update issue |
| `201 Created` | Resource was created | Create issue |
| `204 No Content` | Succeeded with no response body | Delete issue |
| `400 Bad Request` | Request cannot be accepted | Invalid business rule |
| `401 Unauthorized` | Not authenticated | Missing/invalid login token |
| `403 Forbidden` | Authenticated but not permitted | User lacks access |
| `404 Not Found` | Resource does not exist | Unknown issue ID |
| `422 Unprocessable Content` | Input does not match validation rules | Invalid priority or title |
| `500 Internal Server Error` | Unexpected server failure | Unhandled exception |

Example validation: sending `{"title": "", "priority": "urgent"}` fails because the title is empty and `urgent` is not in the priority enum. FastAPI normally returns a `422` error response with structured details.

# 46. JSON Storage Implementation

For a small learning project, store an array of issues in `data/issues.json`. **This is not suitable for concurrent multi-process production access.** The runnable example uses atomic file replacement and a per-process lock for basic safety.

```python
import json
from pathlib import Path

DATA_FILE = Path("data/issues.json")

def load_data():
    if not DATA_FILE.exists():
        return []
    with DATA_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)

def save_data(issues):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(issues, f, indent=2)
```

This is the **simplified teaching version**. For the safer working implementation see `app/storage.py` in the downloadable project. JSON content might look like:

```json
[
  {
    "id": 1,
    "title": "Login button broken",
    "description": "Nothing happens after clicking",
    "priority": "high",
    "status": "open",
    "created_at": "2026-10-19T09:00:00+00:00"
  }
]
```

# 47. Creating an Issue — POST

A `POST` endpoint receives an `IssueCreate` object, creates an ID, sets default status, stores the issue and returns a `201` response.

```python
from datetime import datetime, timezone
from fastapi import APIRouter, status
from app.schemas import IssueCreate, IssueResponse
from app.storage import load_data, save_data

router = APIRouter(prefix="/api/v1/issues", tags=["Issues"])

@router.post("", response_model=IssueResponse,
             status_code=status.HTTP_201_CREATED)
def create_issue(payload: IssueCreate):
    issues = load_data()
    new_id = max((i["id"] for i in issues), default=0) + 1
    new_issue = {
        **payload.model_dump(mode="json"),
        "id": new_id,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    issues.append(new_issue)
    save_data(issues)
    return new_issue
```

This excerpt focuses on the request-to-response flow; the runnable project includes the per-process lock. Use Swagger UI to post `{"title":"Fix login","priority":"high"}`.

# 48. Reading Issues — GET

Create two endpoints, one for all issues and one for an issue by ID.

```python
from fastapi import HTTPException

@router.get("", response_model=list[IssueResponse])
def list_issues():
    return load_data()

@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue(issue_id: int):
    issue = next((x for x in load_data() if x["id"] == issue_id), None)
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue
```

The `issue_id: int` annotation causes FastAPI to parse an integer path parameter. A missing record should return `404`, rather than `null` with `200`.

# 49. Updating Issues — PUT and PATCH

For the beginner example, the update payload has optional fields, so the caller can change only those fields supplied. The running project exposes this as `PUT`; strictly speaking, partial changes are conventionally performed with **`PATCH`**, while `PUT` generally replaces the full representation.

```python
@router.patch("/{issue_id}", response_model=IssueResponse)
def patch_issue(issue_id: int, payload: IssueUpdate):
    issues = load_data()
    for issue in issues:
        if issue["id"] == issue_id:
            updates = payload.model_dump(exclude_unset=True, mode="json")
            if any(v is None for v in updates.values()):
                raise HTTPException(status_code=422, detail="Null values not allowed")
            issue.update(updates)
            save_data(issues)
            return issue
    raise HTTPException(status_code=404, detail="Issue not found")
```

Example body: `{"status":"in_progress"}`. `exclude_unset=True` means other fields remain unchanged. For production, use storage transactions and decide clearly whether `null` means “clear this field” or “invalid”.

# 50. Deleting Issues — DELETE

```python
from fastapi import Response

@router.delete("/{issue_id}", status_code=204)
def delete_issue(issue_id: int):
    issues = load_data()
    remaining = [issue for issue in issues if issue["id"] != issue_id]
    if len(remaining) == len(issues):
        raise HTTPException(status_code=404, detail="Issue not found")
    save_data(remaining)
    return Response(status_code=204)
```

A successful delete returns **204 No Content**, not an ordinary JSON object. Repeating deletion of an already missing ID returns `404` in this design.

# 51. Combining the Application Files

```text
fastapi_issue_tracker/
├── main.py
├── requirements.txt
├── pytest.ini
├── app/
│   ├── __init__.py
│   ├── schemas.py
│   ├── storage.py
│   └── routes/
│       ├── __init__.py
│       └── issues.py
├── data/
└── tests/
    └── test_issues.py
```

`main.py` creates the application, adds a health check and includes the issue router:

```python
from fastapi import FastAPI
from app.routes.issues import router as issues_router

app = FastAPI(title="Issue Tracker API")

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(issues_router)
```

Run the downloadable project with:

```bash
python -m venv .venv
# macOS or Linux:
source .venv/bin/activate
# Windows PowerShell alternative:
# .venv\Scripts\Activate.ps1
pip install -r requirements.txt
fastapi dev main.py
```

Now visit `http://127.0.0.1:8000/docs` to try the five issue endpoints. Run tests using `pytest -q`.

# 52. Middleware

Middleware runs around a request/response. Common uses include request timing, logging, CORS configuration and security headers.

```python
import time
from fastapi import Request

@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    response.headers["X-Process-Time"] = f"{elapsed:.4f}"
    return response
```

If a separate frontend needs browser access, configure CORS with explicit allowed origins rather than broadly trusting every website:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

# 53. Dependency Injection (`Depends`)

Dependencies provide reusable logic to routes, such as checking authentication or obtaining a database session.

```python
from fastapi import Depends, Header, HTTPException

def require_demo_key(x_api_key: str | None = Header(default=None)):
    if x_api_key != "local-demo-only":
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

@app.get("/example-protected")
def protected_example(key: str = Depends(require_demo_key)):
    return {"message": "Access granted"}
```

**Demo only:** Never hard-code real secrets into source files. Use environment variables or a secret manager, and require HTTPS for credentials.

# 54. Authentication, Password Hashing and JWT

**Authentication** answers *Who are you?*; **authorization** answers *What are you allowed to do?* JWTs are signed tokens used to carry claims such as user ID and expiry. OAuth2 describes authorization flows; it is not itself a password hashing algorithm.

Typical login flow:

```text
User submits credentials
  → server looks up the account
  → server verifies the password hash
  → server issues a short-lived signed token
  → client sends Authorization: Bearer <token>
  → protected route checks signature, expiry and claims
```

Recommended design choices:

- Hash passwords with a password hashing library (Argon2id is a common modern choice); never store plaintext passwords.
- Put signing secrets in environment variables or secret storage; rotate them when needed.
- Validate algorithm, signature, expiration (`exp`), issuer (`iss`) and audience (`aud`) where applicable.
- Use HTTPS, least privilege and access checks per resource; do not mistake a valid token for permission to edit all issues.
- Handle refresh tokens, revocation and rate limiting as separate security decisions.

The downloadable teaching API **does not implement login or JWT**, so do not expose it publicly without access controls. Authentication is a separate advanced exercise rather than an invented continuation of the original video.

# 55. SQLAlchemy, SQLModel and PostgreSQL

A JSON file is convenient for learning, but a relational database becomes useful when multiple requests, users and servers modify shared data.

| Concept | Explanation |
| --- | --- |
| PostgreSQL | Database server storing tables and managing transactions |
| SQLite | File-based SQL database, convenient for local exercises |
| SQLAlchemy | Python SQL toolkit and ORM |
| SQLModel | Higher-level models built on Pydantic and SQLAlchemy |
| Migration | Controlled change to database schema, commonly via Alembic |
| Transaction | A group of operations that succeed or fail together |

A minimal SQLAlchemy 2-style example:

```python
from sqlalchemy import create_engine, String, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session

class Base(DeclarativeBase):
    pass

class IssueRow(Base):
    __tablename__ = "issues"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    priority: Mapped[str] = mapped_column(String(20), default="medium")

engine = create_engine("sqlite:///./issues.db")
Base.metadata.create_all(engine)  # educational setup; use migrations later

with Session(engine) as session:
    session.add(IssueRow(title="Example issue", priority="high"))
    session.commit()
    issues = session.scalars(select(IssueRow)).all()
```

To switch to PostgreSQL, install a suitable driver, configure a PostgreSQL connection URL via an environment variable, and run migrations. For example, with Psycopg 3: `postgresql+psycopg://USER:PASSWORD@HOST:5432/DBNAME`. Do not embed credentials in source control. Real APIs should use one session per request, ensure sessions close, and manage transactions and concurrency correctly.

# 56. API Testing with Pytest

Testing checks behavior without manually repeating each Swagger request. FastAPI supplies `TestClient` for easy HTTP-level tests.

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

Also test successful creation (`201`), list/get (`200`), update (`200`), delete (`204`), missing ID (`404`) and invalid fields (`422`). For tests that write to JSON, give each test a **temporary data file** to avoid modifying actual project data. The downloadable project includes these tests and fixtures.

# 57. Environment Variables and Configuration

Environment variables separate configuration from code and keep credentials out of your repository.

```python
import os

DATA_PATH = os.getenv("ISSUES_DATA_FILE", "data/issues.json")
DATABASE_URL = os.getenv("DATABASE_URL")
```

For larger systems use `pydantic-settings` to validate configuration. Keep `.env` outside version control, and use a secret manager for production credentials.

# 58. Deployment Basics

During development `fastapi dev main.py` enables auto-reload. For a basic production-style process, `fastapi run main.py` runs without development reloading. Configure the runtime platform's bind address/port and use a process supervisor or managed hosting.

Production checklist:

- Put the service behind HTTPS, and configure trusted hosts/proxy headers correctly.
- Add authentication and authorization before exposing user data.
- Move JSON storage to a transactional database before using multiple workers.
- Use migrations, backups and tested restores for database changes.
- Add structured logging, monitoring, health checks and request timeouts.
- Pin and update dependencies, and protect secrets.

**Do not deploy the included JSON example as a multi-worker public service.** Its lock protects only one process.

# 59. Common FastAPI Beginner Mistakes

| Mistake | Better approach |
| --- | --- |
| Expecting `/` to exist automatically | Define a `/` route, or use `/docs` or `/health` |
| Forgetting `include_router(...)` | Include each router from the application entry point |
| Confusing path and query parameters | `/issues/4` is a path; `/issues?status=open` has a query |
| Accepting arbitrary dictionaries for every request | Validate request bodies with Pydantic models |
| Sending `200` for every case | Return appropriate 201, 204, 404 or 422 codes |
| Forgetting `model_dump(exclude_unset=True)` | Use it for partial updates |
| Assuming async automatically makes CPU code faster | Use async for properly asynchronous I/O, not CPU speedups |
| Treating CORS as authentication | Implement actual authentication and authorization |
| Putting secrets in code | Use environment variables or secret management |
| Using JSON files as a database in production | Use a transactional database |

# 60. End-to-End Practice Exercise

1. Run the Issue Tracker project and open `/docs`.
2. Create an issue titled “Login button broken” with priority `high`.
3. Fetch all issues and then fetch the issue by its ID.
4. Change status to `in_progress` using the update endpoint.
5. Delete the issue and confirm that fetching it returns `404`.
6. Attempt to create an issue with an empty title and observe `422`.
7. Run `pytest -q` and read the test assertions.

**Challenge:** Add `GET /api/v1/issues?status=open` filtering using a typed query parameter. Then add a test for it. For additional practice, replace file storage with SQLite/SQLAlchemy and add authentication before allowing edits.

# 61. Final Summary and Learning Roadmap

```text
Client request
    ↓
FastAPI route / APIRouter
    ↓
Path, query and Pydantic body validation
    ↓
Dependencies / permission checks
    ↓
Business logic
    ↓
Storage (learning JSON → production database)
    ↓
Pydantic response model
    ↓
JSON + HTTP status code
```

**Beginner:** Routing, type hints, Swagger UI, Pydantic schemas, GET/POST/PUT/DELETE, errors and testing. **Intermediate:** Dependencies, middleware, filtering, pagination, database sessions, migrations and configuration. **Advanced:** Authentication, permissions, observability, background tasks, async database access, caching and safe deployment.

You now have a finished learning path for the material missing from the partial transcript, along with a complete working Issue Tracker example. The original transcript's unseen material cannot be reconstructed verbatim; the continuation above follows common modern FastAPI practices instead.
