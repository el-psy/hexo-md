---
title: graphql-schemas-types
date: 2023-01-09 14:03:38
categories:
	- graphql
	- schemas
tags:
	- graphql
---

> [Schemas and Types](https://graphql.org/learn/schema/#union-types)翻译

在这篇文章中，你将了解有关GraphQL类型系统有关的所有必要知识，以及它如何描述可查询的数据。由于GraphQL可以与任何后端框架或编程语言一起使用，因此我们将忽略具体实现细节，只讨论概念。

# Type system 类型系统

如果你以前见过GraphQL查询，那么你应该知道GraphQL查询语句基本上是选择对象上的字段的。例如，在以下查询中：

1. 我们从一个特殊的根对象开始  
2. 我们在根对象上选择hero字段  
3. 对于hero返回的对象，我们选择name和appearsln字段。  

因为GraphQL查询的结构和返回的结果非常匹配，所以你可以预测查询将会返回什么，而不需要了解服务器的太多信息。但我们对请求的数据进行准确描述还是很有用的————我们可以选择哪些字段？他们可能会返回什么样的对象？这些子对象上有哪些字段可用？这就是schema模式的来源。

每个GraphQL服务都定义了一组类型，完全描述了你可以在该服务上查询的数据的类型。然后，当查询来到GraphQL服务上时，将按照该模式对查询进行验证和执行。

# Type language 类型语言

GraphQL服务可以用任何语言编写。由于我们不能依赖特定的编程语言（如JavaScript）来讨论GraphQL模式，因此我们将定义自己的简单语言。我们将使用“GraphQL模式语言”——它类似于查询语言，并允许我们以不依赖语言的方式讨论GraphQL架构。

# Object types and fields 对象类型和字段

GraphQL模式的最基本组件是对象类型，它只表示可以从服务中获取的对象种类，以及它具有哪些字段。在GraphQL模式语言中，我们可以这样表示：

```graphql
type Character {
  name: String!
  appearsIn: [Episode!]!
}
```

这个语言非常易读，但让我们仔细研究一下，这样我们就可以共享词汇了：

- `Character`是GraphQL对象类型。这意味着它是一种具有某些字段的类型。模式中的大多数类型都是对象类型。

- `name`和`appearsln`是`Character`类型上的字段。这意味着`name`和`appearsln`时唯一可以出现在对`Character`类型进行操作的GraphQL查询的任何部分中的字段。

- `String`是内置标量类型之一。这些类型解析为单个标量对象，并且在查询中不能有子选择。稍后我们将进一步讨论标量类型。

- `String!`表示该字段不可为空，这意味着GraphQL服务承诺在你查询该字段时始终为你提供一个值。在类型语言中，我们将用感叹号表示这些字符。

- `[Episode!]!`表示`Episode`对象的数组。由于它也是不可为空的，因此在查询appearsln字段时，你可以期望一个数组（包含零个或多个项）。而且`Episode!`也是不可为空的，你也可以期望数组中的每个项都是一个`Episode`对象。

现在你知道了GraphQL对象类型是什么样子，以及如何阅读GraphQL类型语言的基础知识。

# Arguments 参数

GraphQL对象类型上的每个字段都可以有零个或多个参数，例如下面的length字段：

```graphql
type Starship {
  id: ID!
  name: String!
  length(unit: LengthUnit = METER): Float
}
```

所有的参数都需要命名。与JavaScript和Python等语言不同，GraphQL中的所有参数都是按名称传递的。在这种情况下，length字段有一个定义的参数unit。

参数可以是必须的，也可以是可选的。当一个参数是可选的时候，我们可以设定一个默认值——如果没有传递单位参数，它将默认设置为`METER`。

# The Query and Mutation types 查询和Mutation类型

模式中的大多数类型都只是普通对象类型，但模式中有两种类型是特殊的：

```graphql
schema {
  query: Query
  mutation: Mutation
}
```

每个GraphQL服务都有一个查询类型，至于mutation类型不是必须的。这些类型与常规的对象类型相同，但它们很特殊，因为它们定义了每个GraphQL查询的入口。因此，如果你看到类似下面的查询：


```graphql
query {
  hero {
    name
  }
  droid(id: "2000") {
    name
  }
}
```

```json
{
  "data": {
    "hero": {
      "name": "R2-D2"
    },
    "droid": {
      "name": "C-3PO"
    }
  }
}
```

这意味着GraphQL服务需要具有带有hero和droid字段的查询类型：

```graphql
type Query {
  hero(episode: Episode): Character
  droid(id: ID!): Droid
}
```

Mutation的工作方式与此类似——你可以在mutation类型上定义字段，这些字段可以作为查询中可以调用的根mutation字段。

重点是要记住，除了作为模式的入口之外，查询和mutation类型与其他任何GraphQL对象类型都相同，它们的字段工作方式完全相同。

# Scalar types 标量类型

GraphQL对象类型具有名称和字段，但在某些情况下，这些字段必须解析为一些具体数据。这就是标量类型的来源：它们表示查询的结果（叶子）。

在下面的查询中，name和appearsln字段将解析为标量类型：

```graphql
{
  hero {
    name
    appearsIn
  }
}
```

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ]
    }
  }
}
```

我们知道这一点是因为这些字段没有任何子字段——它们是查询树的叶子节点。

GraphQL附带一组现成的默认标量类型：

- `Int`：32位有符号整数  
- `Float`：双精度有符号浮点数。  
- `String`：utf-8字符串  
- `Boolean`：布尔
- `ID`：ID标量类型表示唯一标识符。这通常用于重新提取对象或作为缓存的键。ID类型的序列化方式与`String`相同；然而，将其定义为`ID`意味着它不是人类可读的。

在大多数GraphQL服务实现中，会有自定义标量类型的方法。例如，我们可以定义日期类型：

```graphql
scalar Date
```

然后有我们的实现来定义如何序列化、反序列化和验证该类型。例如，你可以指定Date类型应该始终序列化为整数时间戳，并且你的客户机应该知道任何日期字段都应该使用该格式。

# Enumeration types 枚举类型

枚举类型是一种特殊的标量，仅限于特定的一组允许值。这允许你：

- 验证此类型的任何参数是否为允许的值之一。

- 通过类型系统通知，该字段始终是一组有限值中的一个。

以下是GraphQL模式语言中的枚举定义：

```graphql
enum Episode {
  NEWHOPE
  EMPIRE
  JEDI
}
```

这意味着，无论我们在模式中使用哪种类型，我们都希望它恰好是`NEWHOPE`，`EMPIRE`，`JEDI`中的某一个。

请注意，各种语言的GraphQL服务实现都有自己特定于语言的方法处理枚举类型。在支持枚举作为一级公民的语言中，实现可能会利用这一点；在JavaScript这样没有枚举支持的语言中，这些值可能在内部映射到一组整数。然而，这些细节不会泄露给客户端，客户端可以完全按照枚举值的字符串名称进行操作。

# Lists and Non-Null 列表和非空

对象类型、标量类型和枚举类型是可以在GraphQL中定义的唯一类型。但是，当在模式的其他部分或查询变量声明中使用类型时，可以应用影响这些变量验证的其他类型修饰符。我们来看一个示例：

```graphql
type Character {
  name: String!
  appearsIn: [Episode]!
}
```

在这，我们使用的是`String`类型，并通过添加感叹号将其标记为非空。这意味着我们的服务器总是希望为该字段返回一个非空值，如果它最终得到一个空值，那么实际上会触发GraphQL执行错误，让客户端知道出了问题。

在定义字段的参数的时候也可以使用非空修饰符。如果将空值作为参数传递（无论是在GraphQL字符串中还是在变量中），则会导致GraphQL服务器返回验证错误。

query
```graphql
query DroidById($id: ID!) {
  droid(id: $id) {
    name
  }
}
```

variable
```graphql
{
  "id": null
}
```

result
```json
{
  "errors": [
    {
      "message": "Variable \"$id\" of non-null type \"ID!\" must not be null.",
      "locations": [
        {
          "line": 1,
          "column": 17
        }
      ]
    }
  ]
}
```

列表的工作方式类似：我们可以使用类型修饰符标记为List，这表示此字段将返回该类型的列表。在模式语言中，这将通过类型包含在方括号[]中来表示。它对参数的作用相同，其中验证步骤需要该值的列表。

可以同时使用列表和非空修饰符，例如，可以有一个非空字符串列表：

```
myField: [String!]
```

这表示列表本身可以为空，但是成员不能为空。例如在JSON中：

```
myField: null // valid
myField: [] // valid
myField: ['a', 'b'] // valid
myField: ['a', null, 'b'] // error
```

现在，我们又定义了一个非空字符串列表：

```
myField: [String]!
```

这意味着列表不可为空，但是可以包含空值：

```
myField: null // error
myField: [] // valid
myField: ['a', 'b'] // valid
myField: ['a', null, 'b'] // valid
```

你可以根据需要任意嵌套使用非空修饰符和列表修饰符。

# Interfaces 接口

与许多类型系统一样，GraphQL支持接口。接口是一种抽象类型，它包含一组字段，类型必出包含这些字段才能实现接口。

例如，你可以有一个Character接口来代表《星球大战》三部曲中的任何角色：

```graphql
interface Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
}
```

这意味着任何实现Character的类型都需要具有这些字段，以及这些参数和返回类型。

例如，一下是一些可能实现Character的类型。

```graphql
type Human implements Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
  starships: [Starship]
  totalCredits: Int
}

type Droid implements Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
  primaryFunction: String
}
```

你可以看到，这两种类型都具有Character接口中的所有字段，但也引入了特定的特定Character类型的额外字段`totalCredits`、`starships`和`primaryFunction`。

当你想要返回一个或一组对象，但这些对象可能有几种不同的类型的时候，接口会很有用。

例如，请注意一下查询会产生错误：

查询
```graphql
query HeroForEpisode($ep: Episode!) {
  hero(episode: $ep) {
    name
    primaryFunction
  }
}
```

参数
```json
{
  "ep": "JEDI"
}
```

结果
```json
{
  "errors": [
    {
      "message": "Cannot query field \"primaryFunction\" on type \"Character\". Did you mean to use an inline fragment on \"Droid\"?",
      "locations": [
        {
          "line": 4,
          "column": 5
        }
      ]
    }
  ]
}
```

hero字段返回类型Character，这意味着它可能是Human或者Droif，具体取决于`episode`参数。在上面的查询中，你只能请求存在于Character接口的字段，该接口不包含`primaryFunction`。

想要请求特定对象类型上的字段，需要使用内联片段：

查询
```graphql
query HeroForEpisode($ep: Episode!) {
  hero(episode: $ep) {
    name
    ... on Droid {
      primaryFunction
    }
  }
}
```

参数
```json
{
  "ep": "JEDI"
}
```

结果
```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "primaryFunction": "Astromech"
    }
  }
}
```

在查询中的内联片段部分，请参照[内联片段](https://graphql.org/learn/queries/#inline-fragments)章节。

# Union types 联合类型

联合类型与接口非常相似，但它们不能在类型之间指定任何共享字段。

```
union SearchResult = Human | Droid | Starship
```

当我们从模式中返回一个`SearchResult`类型时，可能会得到一个`Human`、`Droid`或`Starship`。注意，联合类型的成员需要是具体的对象类型，不可以是接口或其他联合类型。

在这种情况下，如果查询返回`SearchResult`联合类型的字段，则需要使用内联片段来查询所有字段。

```graphql
{
  search(text: "an") {
    __typename
    ... on Human {
      name
      height
    }
    ... on Droid {
      name
      primaryFunction
    }
    ... on Starship {
      name
      length
    }
  }
}
```

```json
{
  "data": {
    "search": [
      {
        "__typename": "Human",
        "name": "Han Solo",
        "height": 1.8
      },
      {
        "__typename": "Human",
        "name": "Leia Organa",
        "height": 1.5
      },
      {
        "__typename": "Starship",
        "name": "TIE Advanced x1",
        "length": 9.2
      }
    ]
  }
}
```

`__typename`字段解析为一个字符串，该字符串允许你在客户端上区分不同的数据类型。

此外，在本例中，由于`Human`和`Droid`共享一个接口（`Chatacter`），因此可以在一个地方查询它们的公共字段，而不必在多个类型中重复相同的字段。

```graphql
{
  search(text: "an") {
    __typename
    ... on Character {
      name
    }
    ... on Human {
      height
    }
    ... on Droid {
      primaryFunction
    }
    ... on Starship {
      name
      length
    }
  }
}
```

请注意，`name`仍在`Starship`上指定，否则它不会显示在结果中，因为`Starship`不是`Character`。

# Input types 输入类型

到目前为止，我们只讨论了标量值（例如枚举和字符串）作为参数传递到字段中。但也可以轻松传递复杂的对象。这在mutation中尤其有价值，因为你可能希望传入一整个要创建的对象。在GraphQL模式语言中，输入类型看起来和常规对象完全相同，但使用`input`创建而不是`type`。

一下是如何在mutation中使用输入类型：

查询
```graphql
mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
  createReview(episode: $ep, review: $review) {
    stars
    commentary
  }
}
```

参数
```json
{
  "ep": "JEDI",
  "review": {
    "stars": 5,
    "commentary": "This is a great movie!"
  }
}
```

结果
```json
{
  "data": {
    "createReview": {
      "stars": 5,
      "commentary": "This is a great movie!"
    }
  }
}
```

输入类型上的字段本身可以引用输入对象类型，但不能在模式中混合输出和输入类型。输入类型的字段上也不能有参数。