# Opaque JS

Take a look at the [documentation](https://opaquejs.github.io) for more information.

## User stories

- What is this? -> Introduction
- This is cool, lets get started! -> Quickstart
- I don't remember how x is done / I want to do y, is this possible? -> Main Part
- I want to get a deeper understanding of z / How does z actually works (advanced users or adapter authors) -> Digging deeper / Reference

# Introduction

You may know the concept of an ORM from server side frameworks like Laravels with the Eloquent ORM or Adonisjs with the Lucid ORM. Opaquejs tries to bring this experience of a unified way of handling your data to your client side Javascript. Opaquejs let's you rewrite this:

```js
let tasks = undefined;
try {
  const res = await axios.post("http://some.website/graphql", {
    query: "{ tasks(done: false) { title createdAt } }",
  });
  tasks = res.data.data.tasks;
} catch (e) {
  // Handle the error somehow
}
for (const task of tasks) {
  const createdAt = Date.parse(task.createdAt);
  if (createdAt > new Date()) {
    // Do something
  }
}
```

To this:

```js
import Task from "./models/Task";

const tasks = await Task.query().where("done", false).get();

for (const task of tasks) {
  if (task.isCreatedInFuture()) {
    // Do something
  }
}
```

Opaquejs is framework independent, you can use it with any frontend framework like vue, react and any backend such as GraphQL, a REST API, or even an SQL Database directly. If no integration exists for your intended use case, you can easily develop your own custom adapter to support any possible data source.

Additionally, Opaquejs is completely written in typescript to get the most out of intellisense autocompletion and error detection. But if you are sticking with traditional "vanilla" javascript, you can totally do this. The only difference will be the lack of decorators in plain javascript.

# Quickstart

```sh
npm i @opaquejs/opaque
```

The most minimal setup would be a model stored in-memory:

```ts
// .../models/Task.ts
import { InMemoryAdapter, OpaqueModel, attribute } from "@opaquejs/opaque";
import { DateTime } from "luxon";

export class Task extends OpaqueModel {
  static adapter = new InMemoryAdapter();

  @attribute({ primary: true })
  public id: string;

  @attribute()
  public title: string;

  @attribute()
  public done: boolean = false;

  @attribute.dateTime()
  public createdAt: DateTime = DateTime.now();
}
```

You are now ready to use your Model to store tasks in memory!

```ts
import { Task } from "./Task";

const task = await Task.create({ title: "My first Task!" });

task.done = true;
await task.save();

const doneTasks = await Task.query().where("done", true).get();
```

# CRUD Operations

## Create

Create a model using the normal constructor approach:

```ts
import { Task } from "./Task";

const task = new Task();
task.title = "Buy Milk";
await task.save();
```

### The static create method

There is also a helper method to make this task easier:

```ts
import { Task } from "./Task";

const task = await Task.create({ title: "Buy Milk" });
```

## Read

### all

Fetch all tasks from your defined adapter.

```ts
import { Task } from "./Task";

const allTasks = await Task.all();
```

### find

Fetch only one task with the defined primary key. This returns a single task instead of an array.

```ts
import { Task } from "./Task";

const task = await Task.find(12);
```

### first

Fetch only the first task. This returns a single task instead of an array.

```ts
import { Task } from "./Task";

const task = await Task.find(12);
```

### using the query builder

Sometimes, you need more control over the fetched records. The query builder is here to help you!

```ts
import { DateTime } from "luxon";
import { Task } from "./Task";

const task = await Task.query()
  .where("done", false)
  .orWhere("createdAt", "<", DateTime.local())
  .limit(10)
  .skip(20)
  .get();
```

## Update

Updating is as straight forward as creating:

```ts
import { Task } from "./Task";

const task = await Task.first();
task.done = true;
await task.save();
```

## Deleting

Deleting your models also isn't a problem.

```ts
import { Task } from "./Task";

const task = await Task.first();
await task.delete();
```

# Connecting to a Real Backend

There are two main approaches when connecting to a backend:

1. Connecting to an existing backend and using the query language this backend offers
   - You will need to use some kind of translator between the opaque query language and your api query language or implement your own query builder
2. Developing an endpoint specifically for Opaquejs query language.
   - You can pass the Opaque queries directly to the API and translate those queries on the server side with one of the translators

## Adapters

An adapter is a collection of functions that fetches and pushes data to and from a data source. This is used to connect a model to a backend.

For further information about how to use an adapter, please read through the adapter documentation. Most of the time, it will look like this on the client side:

```ts
import { OpaqueModel } from "@opaquejs/opaque";
import { SomeAdapter } from "somebackend-opaque-adapter";

export class BaseModel extends OpaqueModel {
  static adapter = new SomeAdapter({ someOption: true });
}
```

Here is a list of first party adapters:

- GraphQL

## Translators

If you want to integrate Opaquejs deeper in your infrastructure, you can also use one of the translators to parse Opaque Queries on the server side. This lets you translate Opaque Queries to other representations like knex.js queries.

The basic functionality of translators is the following: You give them an Opaque Query, and the translator function returns the query in another "language", like an SQL query.

Here is a list of the first-party translators:

- Knex.js

# Relationships

## Belongs To

You can define a belongsTo relationship using the `belongsTo` Method on a model instance:

```ts
import { OpaqueModel } from "@opaquejs/opaque";
import { User } from "./User";

export class Task extends OpaqueModel {
  public user() {
    return this.belongsTo(User);
  }
}
```

You should then use the relationship using the `exec` method:

```ts
import { Task } from "./Task";

const user = await Task.first().user().exec();
```

## Has Many

```ts
import { OpaqueModel } from "@opaquejs/opaque";
import { Task } from "./Task";

export class User extends OpaqueModel {
  public tasks() {
    return this.hasMany(Task);
  }
}
```

You should then use the relationship using the `exec` method:

```ts
import { User } from "./User";

const tasks = await User.first().user().exec();
```
