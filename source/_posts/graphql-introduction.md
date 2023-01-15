---
title: Introduction to GraphQL翻译
date: 2022-12-15 11:52:21
categories:
	- graphql
	- introduction
tags:
	- graphql
---

> [Introduction to GraphQL](https://graphql.org/learn/)翻译

# graphql简介

> 想要了解GraphQL是如何工作的，如何使用的？在查找如何构建一个GraphQL服务的文档？这里的库能够帮助你使用[不同的编程语言](https://graphql.org/code/)实现GraphQL。如果想进行实用教程的深入学习，请看[How to GraphQL](https://www.howtographql.com/)。如果想查看免费在线教程，[Exploring GraphQL: A Query Language for APIs](https://www.edx.org/course/exploring-graphql-a-query-language-for-apis)

GraphQL是一种API的查询语言，也是一种为了类型定义的数据系统执行查询服务的服务端运行时。GraphQL没有绑定到任何特定的数据库或存储引擎，而是由你的现有代码和数据支持。

创建GraphQL服务，是通过在类型上定义类型和字段，然后为每个类型上的每个字段提供函数实现的。l例如，一个告诉你登录用户是谁（用户的名字）的GraphQL服务可能如下所示：

```graphql
type Query {
  me: User
}

type User {
  id: ID
  name: String
}
```

每个类型上的每个字段的函数如下：


```ts
function Query_me(request) {
  return request.auth.user;
}

function User_name(user) {
  return user.getName();
}
```

GraphQL服务运行后（通常是在web服务的URL上），它可以接收GraphQL查询来进行验证和执行。服务首先会检查查询请求，确认它只使用了已定义的类型和字段，然后运行提供函数来生成结果。

例如，如下查询：

```graphql
{
  me {
    name
  }
}
```

会产生如下的JSON查询结果：

```json
{
  "me": {
    "name": "Luke Skywalker"
  }
}
```

想要了解更过，点击继续阅读。
