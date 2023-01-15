---
title: graphql-validatoin
date: 2023-01-11 11:55:11
categories:
	- graphql
	- validation
tags:
	- graphql
---


> [Validation](https://graphql.org/learn/validation/)翻译

通过使用类型系统，可以预先确定GraphQL查询是否有效。这允许服务器和客户端在创建无效查询时有效地通知开发人员，而无须依赖运行时检查。

对于我们的《星球大战》示例，文件[starWarsValidation-test.ts](https://github.com/graphql/graphql-js/blob/main/src/__tests__/starWarsValidation-test.ts)包含许多无效性的查询，并且是一个测试文件，可以用来测试参考示例的验证器。

首先，让我们进行一个复杂的有效查询。这是一个嵌套查询，类似于上一节中的示例，但将重复字段分解为一个片段：

```graphql
{
  hero {
    ...NameAndAppearances
    friends {
      ...NameAndAppearances
      friends {
        ...NameAndAppearances
      }
    }
  }
}

fragment NameAndAppearances on Character {
  name
  appearsIn
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
      ],
      "friends": [
        {
          "name": "Luke Skywalker",
          "appearsIn": [
            "NEWHOPE",
            "EMPIRE",
            "JEDI"
          ],
          "friends": [
            {
              "name": "Han Solo",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "Leia Organa",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "C-3PO",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "R2-D2",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            }
          ]
        },
        {
          "name": "Han Solo",
          "appearsIn": [
            "NEWHOPE",
            "EMPIRE",
            "JEDI"
          ],
          "friends": [
            {
              "name": "Luke Skywalker",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "Leia Organa",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "R2-D2",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            }
          ]
        },
        {
          "name": "Leia Organa",
          "appearsIn": [
            "NEWHOPE",
            "EMPIRE",
            "JEDI"
          ],
          "friends": [
            {
              "name": "Luke Skywalker",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "Han Solo",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "C-3PO",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "R2-D2",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            }
          ]
        }
      ]
    }
  }
}
```

这个查询是通过验证有效的。让我们再看一些无效的查询。

片段不能引用自身或创建循环，因为这可能会导致无边界的结果！下面和上面还是相同的查询，但没有明确三个嵌套级别：

```graphql
{
  hero {
    ...NameAndAppearancesAndFriends
  }
}

fragment NameAndAppearancesAndFriends on Character {
  name
  appearsIn
  friends {
    ...NameAndAppearancesAndFriends
  }
}
```

```json
{
  "errors": [
    {
      "message": "Cannot spread fragment \"NameAndAppearancesAndFriends\" within itself.",
      "locations": [
        {
          "line": 11,
          "column": 5
        }
      ]
    }
  ]
}
```

当我们查询字段时，我们必须查询给定类型上存在的字段。所以但`hero`返回一个`Character`时，我们必须查询`Character`上的字段。该类型没有`favoriteSpaceship`字段，因此无法查询。

```graphql
# INVALID: favoriteSpaceship does not exist on Character
{
  hero {
    favoriteSpaceship
  }
}
```

```json
{
  "errors": [
    {
      "message": "Cannot query field \"favoriteSpaceship\" on type \"Character\".",
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

每当我们查询字段时，它返回的不是标量或枚举，我们就需要指定要从字段中获取的数据。`hero`返回一个`Character`，我们一直在请求`name`和`appearsln`字段；如果忽略此项，则查询无效：

```graphql
# INVALID: hero is not a scalar, so fields are needed
{
  hero
}
```

```json
{
  "errors": [
    {
      "message": "Field \"hero\" of type \"Character\" must have a selection of subfields. Did you mean \"hero { ... }\"?",
      "locations": [
        {
          "line": 3,
          "column": 3
        }
      ]
    }
  ]
}
```

类似地，如果字段是标量，则在其上查询其他字段没有意义，这样做会导致查询无效：

```graphql
# INVALID: name is a scalar, so fields are not permitted
{
  hero {
    name {
      firstCharacterOfName
    }
  }
}
```

```json
{
  "errors": [
    {
      "message": "Field \"name\" must not have a selection since type \"String!\" has no subfields.",
      "locations": [
        {
          "line": 4,
          "column": 10
        }
      ]
    }
  ]
}
```

早些时候，注意到查询只能查询类型上的字段；当我们查询`Character`类型的`hero`时，我们只能查询`Character`上的字段。但，我们如果想查询`R2-D2s`的`primaryFunction`时，会发生什么？

```graphql
# INVALID: primaryFunction does not exist on Character
{
  hero {
    name
    primaryFunction
  }
}
```

```json
{
  "errors": [
    {
      "message": "Cannot query field \"primaryFunction\" on type \"Character\". Did you mean to use an inline fragment on \"Droid\"?",
      "locations": [
        {
          "line": 5,
          "column": 5
        }
      ]
    }
  ]
}
```

该查询无效，因为`primaryFunction`不是`Character`上的字段。如果`Character`是`Droid`，我们需要某种方式来表示我们希望获取`primaryFunction`，否则忽略该字段。我们可以使用前面介绍的片段来实现这一点。通过设置`Droid`上定义的片段并将其包含在内，我们确保只查询定义了它的`primaryFunction`。

```graphql
{
  hero {
    name
    ...DroidFields
  }
}

fragment DroidFields on Droid {
  primaryFunction
}
```

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

这个查询是有效的，但有点冗长；当我们多次使用命名片段时，上面的命名片段很好用，但我们只用了一次。我们可以使用内联片段，而不是命名片段；这仍然允许我们指明正在查询的类型，但不需要单独的命名片段：

```graphql
{
  hero {
    name
    ... on Droid {
      primaryFunction
    }
  }
```

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

这仅仅触及了验证系统的表面；有许多验证规则可以确保GraphQL查询在语义上有意义。规范在[validation](https://github.com/graphql/graphql-js/blob/main/src/validation)一节中详细介绍，GraphQL.js中的验证目录包含实现符合规范的GraphQL验证器的代码。

