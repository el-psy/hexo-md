---
title: graphql-execution
date: 2023-01-11 13:49:52
categories:
	- graphql
	- execution
tags:
	- graphql
---

> [Execution](https://graphql.org/learn/execution/)翻译

经过验证后，GraphQL查询由GraphQL服务器执行，该服务器返回一个反映所请求查询形状的结果，通常为JSON。

GraphQL无法在没有类型系统的情况下执行查询，让我们使用一个示例类型系统来说明执行查询。这是本文示例中使用的同一类型系统的一部分：

```graphql
type Query {
  human(id: ID!): Human
}

type Human {
  name: String
  appearsIn: [Episode]
  starships: [Starship]
}

enum Episode {
  NEWHOPE
  EMPIRE
  JEDI
}

type Starship {
  name: String
}
```

为了描述执行查询时发生的情况，让我们使用一个示例来了解一下。

你可以将GraphQL查询中的每个字段视为返回下一个类型的前一个类型的函数或方法。事实上，这正是GraphQL的工作原理。每种类型上的每个字段都由GraphQL服务器开发人员提供的名为解析器的函数支持。每当执行一个字段时，将调用相应的解析器来说生成下一个值。

如果一个字段产生一个标量值，如字符串或数字，则执行完成。但是，如果字段产生对象值，则查询将包含应用该对象的另一个字段选择。浙江一直持续达到标量值。GraphQL查询始终以标量值结尾。

# Root fields & resolvers 跟字段和解析器

在每个GraphQL服务器的顶层都有一种类型，它表示GraphQL API的所有可能入口，通常成为根类型或查询类型。

在本例中，我们的查询类型提供了一个名为`human`的字段，该字段接收参数id。该字段的解析器函数可能访问数据库，然后构造并返回一个`human`对象。

```graphql
Query: {
  human(obj, args, context, info) {
    return context.db.loadHumanByID(args.id).then(
      userData => new Human(userData)
    )
  }
}
```

这个例子是用JavaScript编写的，但是GraphQL服务器可以用[许多不同的语言](https://graphql.org/code/)构建。解析器函数接收四个参数：

- obj 前一对象，在根查询类型上该字段通常不使用。

- args 为GraphQL查询中的字段提供参数。

- context 提供给每个解析器的一个值，它保存重要的上下文信息，如当前登录的用户或对数据库的访问。

- info 保存与当前查询相关的字段特定信息以及模式详细信息的值，详细信息可以查阅[Graphql解析器info类型的更多细节](https://graphql.org/graphql-js/type/#graphqlobjecttype)。

# Asynchronous resolvers 异步解析器

让我们仔细看看这个解析器函数中发生了什么。

```graphql
human(obj, args, context, info) {
  return context.db.loadHumanByID(args.id).then(
    userData => new Human(userData)
  )
}
```

`context`用于提供对数据库的访问，该数据库用于通过在GraphQL查询中作为参数提供的id为用户加载数据。由于从数据库加载是一个异步操作，因此返回Promise。在JavaScript中，Promise用于处理异步值，但在许多语言中都存在相同的概念，通常称为`Futures`、`Task`或`Deferred`。当数据库返回时，我们可以构造并返回一个新的`Human`对象。

请注意，虽然解析器函数需要知道Promise，但GraphQL查询不需要。它只希望human字段返回一些东西，然后可以查询器name。在执行过程中，GraphQL将等待`Promise`、`Futures`和`Tasks`完成，然后继续执行，并以最佳并发性执行。

# Trivial resolvers 简单解析器

既然`Human`对象可用，GraphQL执行可以继续执行其上请求的字段。

```graphql
Human: {
  name(obj, args, context, info) {
    return obj.name
  }
}
```

Graphql服务器根据类型系统知道下一步需要做什么。即在`Human`字段返回任何内容之前，GraphQL知道下一步将是解析`Human`类型上的字段，因为类型系统告诉它`human`字段将返回一个`Human`。

在这种情况下解析`name`非常简单。调用`name`解析器函数，obj参数是从上一个字段返回的新`Human`对象。在这种情况下，我们希望`Human`对象具有一个`name`属性，我们可以直接读取并返回该属性。

事实上，许多GraphQL库将允许你省略这么简单的解析器，并假设如果没有为字段提供解析器，则将读取并返回同名属性。

# Scalar coercion 标量强制

解析`name`字段时，可以同时解析`appearsln`和`starships`字段。`appearsln`字段也可能有一个简单的解析器，但让我们仔细看看：

```graphql
Human: {
  appearsIn(obj) {
    return obj.appearsIn // returns [ 4, 5, 6 ]
  }
}
```

请注意，我们的类型系统表明`appearsln`将返回具有已知值的枚举类型，但此函数返回的是数字！事实上，如果我们查看结果，就会看到返回了正确的枚举值。发生了什么事？

这就是标量强制的一个例子。类型系统知道需要什么，并将解析器函数返回的值转换为支持API约定的值。在这种情况下，我们的服务器上可能定义了一个枚举类型，它在内部使用4、5、6等数字，但在GraphQL类型系统中它们将表示为枚举值。

# List resolvers 列表解析器

我们已经看到了当一个字段返回一个上面的`appearsln`字段的列表时会发生什么。它返回了一个枚举值列表，因为这是类型系统所期望的，所以列表中的每个值都被强制转换为对应的枚举值。而当`starship`字段解析时会发生什么？

```graphql
Human: {
  starships(obj, args, context, info) {
    return obj.starshipIDs.map(
      id => context.db.loadStarshipByID(id).then(
        shipData => new Starship(shipData)
      )
    )
  }
}
```

此字段的解析器不仅返回一个Promise，还返回了Promise列表。`Human`对象有它们驾驶的星际飞船的id列表，但我们需要加载所有这些id才能获得真正的`Starship`对象。

GraphQL在下一步之前会等待所有这些Promise完成，留下一个对象列表，并将再次同时加载每个项的`name`字段。

# Producing the result 生成结果

当每个字段都解析完成，生成的值将被存放到一个键值映射中，字段名（或别名）作为键，解析的值作为值。这从查询的底部的叶节点一直延伸到根查询的原始字段。它们共同生成一个结构，反映了原始查询，然后可以将生成的结构（通常是JSON）发送到请求它的客户端。

让我们最后看一看原始查询，看看所有这些解析函数是如何产生结果的：

```graphql
{
  human(id: 1002) {
    name
    appearsIn
    starships {
      name
    }
  }
}
```

```json
{
  "data": {
    "human": {
      "name": "Han Solo",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ],
      "starships": [
        {
          "name": "Millenium Falcon"
        },
        {
          "name": "Imperial shuttle"
        }
      ]
    }
  }
}
```