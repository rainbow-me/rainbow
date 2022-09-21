# Resources (Async State)

Hello, and welcome to the `resources/` directory.

Here you will find where a lot of our async state resides.

If you have some async state in your code, you may want to create a resource for it.

For a detailed outline of async state (terminology, patterns, persistence, etc) in the Rainbow app, check out the [Async State RFC](https://www.notion.so/rainbowdotme/Async-State-RFC-711800896f9a458889fc4ffad4de271a).

## What is a resource?

A resource is a piece of **asynchronous code**.

A resource can be defined as a **query** or **mutation**.

## What is a Query?

A query is a fetcher that invokes an asynchronous function **“Query Function”** against a **“Query Key”**, thus a Query includes a Query Function & Query Key.

> Note: This is not to be confused with a GraphQL query, a query in this sense is simply a fetcher!

## What is a Mutation?

A mutation is typically used to create/update/delete data or perform server side-effects, but it is not exclusive to this. Think of it as a Query except that it is not cached, and must be fetched manually (consumer explicitly invokes the fetch function). An example use case is uploading a photo or updating a user profile.

## How do I create a Query/Mutation?

Copy + paste the template query/mutation from the `_template/` directory into an appropriate directory under `resources/`, and then follow the steps in that file.
