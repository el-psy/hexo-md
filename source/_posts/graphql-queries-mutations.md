---
title: graphql-queries-mutations
date: 2022-12-15 12:42:35
categories:
	- graphql
	- query
tags:
	- graphql
---

> [Queries and Mutations](https://graphql.org/learn/queries/)翻译

在这篇文章里，你会学到如何进行GraphQL的查询的细节。

# Fields 字段

简而言之，GraphQL就是查询对象上的特定字段。让我们从一个非常简单的查询以及运行它的结果开始：

```graphql
{
  hero {
    name
  }
}
```

```json
{
  "data": {
    "hero": {
      "name": "R2-D2"
    }
  }
}
```

你可以直观发现查询和结果的结构完全相同。这对于GraphQL至关重要，因为这使得你总是得到需要的信息，并且服务端明确知道客户端的所需字段。
字段返回了一个字符串类型。本例中是《星球大战》的主要英雄的名字，“R2-D2”。

> 哦，还有一件事——上面的查询是交互式的。这意味着你可以随心所欲地改变他，并得到新的结果。尝试向查询中的hero对象添加appearsln字段，然后查看新结果。
> 还是去原网页试试吧。。

在上个例子中，我们只是查询了hero的name字段，但字段也可以引用对象。在这种情况下，可以为该对象进行字段的子查询。GraphQL查询可以遍历相关对象及其字段，让客户端在一个请求中获取大量相关数据，而不是像传统REST架构中那样进行多次往返。

```graphql
{
  hero {
    name
    # Queries can have comments!
    friends {
      name
    }
  }
}
```

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "friends": [
        {
          "name": "Luke Skywalker"
        },
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

注意，在这个例子中，friends字段返回一个项目列表。GraphQL查询对于单个项目或项目列表都是相同的；然而，我们根据schema中所指示的内容，知道应该选择那个。

# Arguments 参数

如果我们唯一能做的就是遍历对象及其字段，GraphQL不过就是一种有非常有用的获取数据的语言。但是当它有了向字段传递参数的动能时，事情就会变得更加有趣了。

```graphql
{
  human(id: "1000") {
    name
    height
  }
}
```

```json
{
  "data": {
    "human": {
      "name": "Luke Skywalker",
      "height": 1.72
    }
  }
}
```

在REST这样的系统中，你只能传递一组参数，即请求中的查询参数和url字段。但是在GraphQL中，每个字段和嵌套对象中都可以获得自己的一套参数，使得GraphQL完全可以替代多个API请求。你甚至可以将参数传递到标量字段中，在服务端实现一次数据转换，而不是在客户端实现。

```graphql
{
  human(id: "1000") {
    name
    height(unit: FOOT)
  }
}
```

```json
{
  "data": {
    "human": {
      "name": "Luke Skywalker",
      "height": 5.6430448
    }
  }
}
```

参数可以有许多不同的类型。在上面的示例中，我们使用了Enumeration枚举类型，它表示一组有限的选项（在本例中，长度单位为METER或FOOT）。GraphQL附带一组默认类型，但GraphQL服务端也可以声明自己的自定义类型，只要它们可以序列化为传输格式即可。

[这里阅读更多有关GraphQL类型系统](https://graphql.org/learn/schema)

# Aliases 别名

如果你目光敏锐，可能已经注意到，由于结果对象字段与查询字段名称匹配，但不包含参数，因此不能直接查询具有不同参数的同一字段。这就是为什么需要别名从原因——它们允许你将字段的结果重命名为所需的任何名称。

```graphql
{
  empireHero: hero(episode: EMPIRE) {
    name
  }
  jediHero: hero(episode: JEDI) {
    name
  }
}
```

```json
{
  "data": {
    "empireHero": {
      "name": "Luke Skywalker"
    },
    "jediHero": {
      "name": "R2-D2"
    }
  }
}
```

在上面的例子中，两个hero字段可能会冲突，但由于我们使用了别名，因此可以在一个请求中获得两个结果。

# Fragments 片段

假设我们的应用程序有一个比较复杂的页面，可以让我们并排查看两位hero以及他们的朋友。你可以想象，这样的查询可能很快变得复杂，因为我们至少需要重复字段一次——比较的每一侧都需要重复一次。
这就是GraphQL使用了被称为片段的可复用单元的原因。片段允许你构建字段集，然后再需要时将它们包含在查询中，下面是如何使用片段的例子：

```graphql
{
  leftComparison: hero(episode: EMPIRE) {
    ...comparisonFields
  }
  rightComparison: hero(episode: JEDI) {
    ...comparisonFields
  }
}

fragment comparisonFields on Character {
  name
  appearsIn
  friends {
    name
  }
}
```

```json
{
  "data": {
    "leftComparison": {
      "name": "Luke Skywalker",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ],
      "friends": [
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        },
        {
          "name": "C-3PO"
        },
        {
          "name": "R2-D2"
        }
      ]
    },
    "rightComparison": {
      "name": "R2-D2",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ],
      "friends": [
        {
          "name": "Luke Skywalker"
        },
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

你可以看到，如果重复这些片段，上面的查询会变得非常复杂。片段的概念通常用于将复杂的应用程序数据需求切分成更小的块，特别是当你需要将具有不同片段的大量UI组件则合成一个初始数据请求时。

## Using variables inside fragments 在片段中使用变量

片段中可以访问查询或mutation中声明的变量。参见[变量](https://graphql.org/learn/queries/#variables)

```graphql
query HeroComparison($first: Int = 3) {
  leftComparison: hero(episode: EMPIRE) {
    ...comparisonFields
  }
  rightComparison: hero(episode: JEDI) {
    ...comparisonFields
  }
}

fragment comparisonFields on Character {
  name
  friendsConnection(first: $first) {
    totalCount
    edges {
      node {
        name
      }
    }
  }
}
```

```json
{
  "data": {
    "leftComparison": {
      "name": "Luke Skywalker",
      "friendsConnection": {
        "totalCount": 4,
        "edges": [
          {
            "node": {
              "name": "Han Solo"
            }
          },
          {
            "node": {
              "name": "Leia Organa"
            }
          },
          {
            "node": {
              "name": "C-3PO"
            }
          }
        ]
      }
    },
    "rightComparison": {
      "name": "R2-D2",
      "friendsConnection": {
        "totalCount": 3,
        "edges": [
          {
            "node": {
              "name": "Luke Skywalker"
            }
          },
          {
            "node": {
              "name": "Han Solo"
            }
          },
          {
            "node": {
              "name": "Leia Organa"
            }
          }
        ]
      }
    }
  }
}
```

# Operation name 操作名

到目前为止，我们一直使用一种省略关键字和查询名称的缩略语法。但在实际生产应用程序中，使用关键字和查询名称语法可以减少代码的歧义。
下面是一个例子，其中包含关键字查询作为操作类型，HeroNameAndFriends作为操作名称。

```graphql
query HeroNameAndFriends {
  hero {
    name
    friends {
      name
    }
  }
}
```

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "friends": [
        {
          "name": "Luke Skywalker"
        },
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

操作类型是查询，mutaition，以及订阅，并描述你要执行的操作类型。除非你使用查询的简略语法，操作类型是必须的。在这种情况下，你无法为操作提供名称或者变量定义。

操作名称是操作的一个显式的有意义的名称。它只在多操作文档中是必须的，但我们推荐使用，因为它对于调试和服务端日志记录非常有用。当出问题（你在网络日志或者GraphQL服务日志中看到错误）时，通过操作名称找到代码中出问题的查询的位置，要比试图破解内容更容易。把它想象成你最喜欢的编程语言的一个函数名。例如，在JavaScript中，我们可以只使用匿名函数工作，但当我们为函数命名时，更容易追踪它，调试代码，并在调用时记录。同样，GraphQL查询和mutation名，以及片段名称，可以是在服务端识别不同GraphQL请求的有力的调试工具。

# Variables 变量

到目前为止，我们已经在查询中写入了所有参数。但在大多数应用程序中，字段的参数是动态的。例如，可能有一个下拉列表，让你选择最感兴趣的《星球大战》剧集，或者一个搜索字段，或者一组过滤器。

直接在查询语句中传递这些动态参数不会是一个好主意，因为这样我们的客户端代码需要在运行时动态操作查询语句，并将其序列化为GraphQL特定格式。取而代之，GraphQL有一种一流的方式，将动态值从查询语句中分离出来，并将它们作为单独的字典传递。这些值被称为变量。

当我们开始处理变量时，需要做三件事：
1. 用$variableName替换查询中的静态值
2. 将$variable声明为查询接受的变量之一
3. 传递variableName：单独的，适于传输的（通常是JSON）变量字典中的值。

这是它们一起工作的例子：

查询语句
```graphql
query HeroNameAndFriends($episode: Episode) {
  hero(episode: $episode) {
    name
    friends {
      name
    }
  }
}
```

变量值
```json
{
  "episode": "JEDI"
}
```

查询结果
```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "friends": [
        {
          "name": "Luke Skywalker"
        },
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

现在，在我们的客户点代码中，可以简单地传送一个不同的变量，而不是需要构建一个全新的查询语句。一般来说这是一个很好的做法，可以用来表示查询中那些参数是动态的——我们不应该使用字符串插值添加用户的值来构建查询语句。

## Variable definitions 变量定义

变量定义是在上面的查询中看起来像（\$episode: Episode）的部分。它的工作方式与类型化语言中函数参数的定义方式相同。它列出了所有变量，前缀是$，后面是它的类型，在本例中为Episode。

所有声明的变量必须是标量，枚举或者输入对象类型。因此，如果你想要传递一个复杂的对象到一个字段中，需要知道服务端上匹配的输入类型。在Schema模式页面上了解更多输入对象类型的相关信息。

变量定义成可以是可选的，也可以是必须的。在上面的例子中，因为在Episode类型后没有!符号，它就是可选的。但如果变量传递到在字段需要非空参数，那么也必须要传递给变量。

想要进一步了解这些变量定义的语法，学习GraphQL模式语言很有用。模式语言在Schema页面有详细说明。

## Default variables 默认变量

在类型声明之后可以添加默认值，也可以将默认值分配给查询中的变量。

```graphql
query HeroNameAndFriends($episode: Episode = JEDI) {
  hero(episode: $episode) {
    name
    friends {
      name
    }
  }
}
```

当为所有变量提供默认值时，你可以在不传递任何变量的条件下调用查询。如果任何变量作为变量字典的一部分传递，它们将覆盖默认值。

# Directives 指令

我们之前讨论了如何使用变量来避免使用字符串插值的方式构建动态查询。通过在参数中传递变量解决了大部分此类问题，但我们可能还需要另一种方法来动态改变查询的结构和形状。例如，我们可以想象一个UI组件，它有一个详细的汇总视图，其中一个包含的字段多余另一个。

让我们为这样的一个组件构建一个查询：

查询语句:

```graphql
query Hero($episode: Episode, $withFriends: Boolean!) {
  hero(episode: $episode) {
    name
    friends @include(if: $withFriends) {
      name
    }
  }
}
```

变量

```json
{
  "episode": "JEDI",
  "withFriends": false
}
```

查询结果
```json
{
  "data": {
    "hero": {
      "name": "R2-D2"
    }
  }
}
```

尝试修改上面的变量，将withFriends修改为true，并查看结果如何变化(去原网页试试吧)。

我们需要在GraphQL中使用一个名为指令的特性。指令可以用在字段或者片段中，并且可以以服务器希望的任何方式影响查询的执行。GraphQL核心规范仅包含两个指令，任何符合规范的GraphQL服务器都必须支持这两个指令:

- @include(if: Boolean) 仅当参数为true时，才在结果中包含此字段。
- @skip(if: Boolean) 如果参数为真，则跳过此字段。

指令对于需要改变查询字段是需要进行字符串操作的情况非常有用。服务器还可以自定义全新的指令来增添实验性功能。

# Mutations

GraphQL大多数讨论都集中在获取数据上，但任何完整的数据平台都需要一种修改服务端数据的方案。

在REST中，任何请求都可能会对服务器产生一些副作用，但按照惯例，不会使用GET请求来修改数据。GraphQL与此类似——从技术讲任何查询都可以实现数据写入。然而，我们还是构建了一个惯例，任何导致写入的操作推荐显式地发送请求。

就像查询一样，如果mutation字段返回对象类型，则可以请求嵌套字段。这对于获取更新后对象的新状态非常有用。让我们看一下一个简单的mutation示例：

mutation:
```graphql
mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
  createReview(episode: $ep, review: $review) {
    stars
    commentary
  }
}
```

变量
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

注意createReview字段如何返回新创建的commentary和star字段。这在mutation现有数据时十分有用。例如，当增加字段时，我们可以通过一个请求来mutation和查询字段的新值。

你可能还注意到，在这个例子中，我们传递的review变量不是标量。他是一种输入对象类型，一种可以作为参数传入的特殊类型的对象类型。在Schema页面上了解有关输入类型的更多信息。

## Multiple fields in mutations Mutation中的多个字段

Mutation可以包含多个字段，就像查询一样。查询和mutation之间有一个重要差别，除了名称之外：

> 查询字段可以并列执行，mutation字段只能一个一个地串行执行。

这意味着，如果我们在一个请求中发送两个incrementCredits的mutation，第一个保证在第二个开始之前完成，从而保证我们不会与自己产生竞争冲突条件。

# Inline Fragments 内联片段

与其他许多类型系统一样，GraphQL Schema包括定义接口和联合类型的能力。在[模式指南](https://graphql.org/learn/schema/#interfaces)中了解它们。

如果要查询返回接口或联合类型的字段，则需要使用内联片段来访问基础具体类型上的数据。举个例子：

查询字段
```graphql
query HeroForEpisode($ep: Episode!) {
  hero(episode: $ep) {
    name
    ... on Droid {
      primaryFunction
    }
    ... on Human {
      height
    }
  }
}
```

变量
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

在这个查询中，hero字段返回类型Character，该类型可能是Human或Droid，具体取决于episode参数。在直接选择中，你只能询问Character界面上存在的字段，例如name。

要请求具体类型上的字段，需要使用带有类型条件的内联片段。因为第一个片段在Droid上标记为...，所以只有当从hero返回的角色是Droid类型时，才会执行primaryFunction字段。对于Human类型的height字段也是如此。

命名片段也可以以相同的方式使用。因为命名片段总是附带一个类型。

## Meta fields 元字段

考虑到在某些情况下，你不知道从GraphQL服务器上返回什么类型的数据，你需要一些方法确认如何在客户端上处理这些数据。GraphQL允许你请求_typename，一个元字段，以获取该点的对象类型的名称。

查询
```graphql
{
  search(text: "an") {
    __typename
    ... on Human {
      name
    }
    ... on Droid {
      name
    }
    ... on Starship {
      name
    }
  }
}
```

结果
```json
{
  "data": {
    "search": [
      {
        "__typename": "Human",
        "name": "Han Solo"
      },
      {
        "__typename": "Human",
        "name": "Leia Organa"
      },
      {
        "__typename": "Starship",
        "name": "TIE Advanced x1"
      }
    ]
  }
}
```

在上面的查询中，搜索返回一个联合类型，他可以是三个选项之一。如果没有_typename字段，就无法区分客户端的不同类型。

GraphQL服务提供了几个元字段，其他的用于公开[Introspection](https://graphql.org/learn/introspection/)系统。