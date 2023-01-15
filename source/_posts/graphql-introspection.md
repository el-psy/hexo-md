---
title: graphql-introspection
date: 2023-01-11 15:55:18
categories:
	- graphql
	- introspection
tags:
	- graphql
---

> [Introspection](https://graphql.org/learn/introspection/)翻译

向GraphQL模式询问有关其支持的查询的信息通常非常有用。GraphQL允许我们使用introspection系统这样做。

对于我们的《星球大战》示例，文件[starWarsIntrossection-test.ts](https://github.com/graphql/graphql-js/blob/main/src/__tests__/starWarsIntrospection-test.ts)包含很多演示introspection系统的查询，并且是一个测试用例文件，可以运行该文件来练习参考实现的introspection系统。

我们设计了类型系统，所以我们知道哪些类型是可用的。但如果我们不知道，则可以通过查询`__schema`字段来询问GraphQL，该字段在查询的根类型上总是可用的。现在让我们这么做，并询问可用的类型。

```graphql
{
  __schema {
    types {
      name
    }
  }
}
```

```json
{
  "data": {
    "__schema": {
      "types": [
        {
          "name": "Query"
        },
        {
          "name": "String"
        },
        {
          "name": "ID"
        },
        {
          "name": "Mutation"
        },
        {
          "name": "Episode"
        },
        {
          "name": "Character"
        },
        {
          "name": "Int"
        },
        {
          "name": "LengthUnit"
        },
        {
          "name": "Human"
        },
        {
          "name": "Float"
        },
        {
          "name": "Droid"
        },
        {
          "name": "FriendsConnection"
        },
        {
          "name": "FriendsEdge"
        },
        {
          "name": "PageInfo"
        },
        {
          "name": "Boolean"
        },
        {
          "name": "Review"
        },
        {
          "name": "ReviewInput"
        },
        {
          "name": "Starship"
        },
        {
          "name": "SearchResult"
        },
        {
          "name": "__Schema"
        },
        {
          "name": "__Type"
        },
        {
          "name": "__TypeKind"
        },
        {
          "name": "__Field"
        },
        {
          "name": "__InputValue"
        },
        {
          "name": "__EnumValue"
        },
        {
          "name": "__Directive"
        },
        {
          "name": "__DirectiveLocation"
        }
      ]
    }
  }
}
```

哦，有个类型海。它们都是什么水？让我们将它们分组：

- `Query, Character, Human, Episode, Droid`——这些是我们在类型系统中定义的。

- `String, Boolean`——这些事类型系统提供的内建标量。

- `__Schema, __Type, __TypeKind, __Field, __InputValue, __EnumValue, __Directive`——这些都以双下划线开头，表示它们是内建系统的一部分。

现在，让我们试着找出一个好方法，开始探索可用的查询。当我们设计类型系统时，我们指定了多有查询的起始类型；让我们问问内省系统吧！

```graphql
{
  __schema {
    queryType {
      name
    }
  }
}
```

```json
{
  "data": {
    "__schema": {
      "queryType": {
        "name": "Query"
      }
    }
  }
}
```

这与我们在类型系统中说的一致，查询类型是我们将开始的地方。注意这里的命名只是按照管理；我们可以将我们的查询类型命名为任何其他类型，如果我们将其指定为查询的起始类型，它仍然会返回到这里。不过，将其命名为`Query`是一个有用的约定。

检查一个特定的类型通常很有用。让我们看看`Droid`类型。

```graphql
{
  __type(name: "Droid") {
    name
  }
}
```

```json
{
  "data": {
    "__type": {
      "name": "Droid"
    }
  }
}
```

不过，如果我们想了解更多`Droid`的信息呢？例如，它是接口还是对象？

```graphql
{
  __type(name: "Droid") {
    name
    kind
  }
}
```

```json
{
  "data": {
    "__type": {
      "name": "Droid",
      "kind": "OBJECT"
    }
  }
}
```

`kind`返回一个`__TypeKind`枚举类型，其中一个值是`OBJECT`.如果我们询问`Character`，我们会发现它是一个接口：

```graphql
{
  __type(name: "Character") {
    name
    kind
  }
}
```

```json
{
  "data": {
    "__type": {
      "name": "Character",
      "kind": "INTERFACE"
    }
  }
}
```

对于一个对象知道它有什么字段是很有用的，所以让我们问问`Droid`的introspection系统：

```graphql
{
  __type(name: "Droid") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

```json
{
  "data": {
    "__type": {
      "name": "Droid",
      "fields": [
        {
          "name": "id",
          "type": {
            "name": null,
            "kind": "NON_NULL"
          }
        },
        {
          "name": "name",
          "type": {
            "name": null,
            "kind": "NON_NULL"
          }
        },
        {
          "name": "friends",
          "type": {
            "name": null,
            "kind": "LIST"
          }
        },
        {
          "name": "friendsConnection",
          "type": {
            "name": null,
            "kind": "NON_NULL"
          }
        },
        {
          "name": "appearsIn",
          "type": {
            "name": null,
            "kind": "NON_NULL"
          }
        },
        {
          "name": "primaryFunction",
          "type": {
            "name": "String",
            "kind": "SCALAR"
          }
        }
      ]
    }
  }
}
```

这些就是我们在`Droid`上定义的字段。

`id`看起来有点奇怪，它没有类型的名称。这是因为它是`NON_NULL`类型的包装类型。如果我们在该字段的类型上查询`type`，我们将在哪里找到`ID`类型，并告诉我们这是一个非空`ID`。

同样，`friends`和`appearsln`上都没有`name`，因为它们是`LIST`包装类型。我们可以在这里类型上查询`type`，这将告诉我们这些是什么列表。

```graphql
{
  __type(name: "Droid") {
    name
    fields {
      name
      type {
        name
        kind
        ofType {
          name
          kind
        }
      }
    }
  }
}
```

```json
{
  "data": {
    "__type": {
      "name": "Droid",
      "fields": [
        {
          "name": "id",
          "type": {
            "name": null,
            "kind": "NON_NULL",
            "ofType": {
              "name": "ID",
              "kind": "SCALAR"
            }
          }
        },
        {
          "name": "name",
          "type": {
            "name": null,
            "kind": "NON_NULL",
            "ofType": {
              "name": "String",
              "kind": "SCALAR"
            }
          }
        },
        {
          "name": "friends",
          "type": {
            "name": null,
            "kind": "LIST",
            "ofType": {
              "name": "Character",
              "kind": "INTERFACE"
            }
          }
        },
        {
          "name": "friendsConnection",
          "type": {
            "name": null,
            "kind": "NON_NULL",
            "ofType": {
              "name": "FriendsConnection",
              "kind": "OBJECT"
            }
          }
        },
        {
          "name": "appearsIn",
          "type": {
            "name": null,
            "kind": "NON_NULL",
            "ofType": {
              "name": null,
              "kind": "LIST"
            }
          }
        },
        {
          "name": "primaryFunction",
          "type": {
            "name": "String",
            "kind": "SCALAR",
            "ofType": null
          }
        }
      ]
    }
  }
}
```

让我们对特别有用的introspection的一个特性作为结尾；让我们向系统索取文档！

```graphql
{
  __type(name: "Droid") {
    name
    description
  }
}
```

```json
{
  "data": {
    "__type": {
      "name": "Droid",
      "description": null
    }
  }
}
```

因此，我们可以使用introspection系统来访问有关类型系统的文档，并创建文档浏览器，或丰富的IDE体验。

这只是触及了introspection系统的表面，我们可以查询枚举值、类型实现的接口等。我们甚至可以introspection  introspection系统本身。规范在[introspection](https://github.com/graphql/graphql-js/blob/main/src/type/introspection.ts)一节中详细介绍，GraphQL.js中的introspection文件包含实现符合规范的GraphQL查询introspection系统的代码。

