---
title: petite-vue学习记录2
date: 2022-12-14 01:15:26
categories:
	- 前端
	- 框架
	- petite-vue
tags:
	- 前端
	- 框架
	- petite-vue
---

# petite-vue 调用流程

目录结构
```powershell
(venv) PS F:\lite\petite-vue\src> tree /f
文件夹 PATH 列表
卷序列号为 0123-4567
F:.
│  app.ts
│  block.ts
│  context.ts
│  eval.ts
│  index.ts
│  scheduler.ts
│  utils.ts
│  walk.ts
│
└─directives
        bind.ts
        effect.ts
        for.ts
        html.ts
        if.ts
        index.ts
        model.ts
        on.ts
        ref.ts
        show.ts
        text.ts
```

大致来说，
1. 从```index.ts```中导出各种东西，包括在```app.ts```中的```createApp```。
2. 然后创建```app```实例。过程中，首先通过```context.ts```创建了```ctx```对象，保管创建```createApp```时的一些参数。
3. 然后调用```mount```方法，挂载在dom节点上。首先会找一个```root```节点列表。也就是有```v-scope```属性的那种。
4. 然后调用```block.ts```的```Block```。过程中会检查是否是```root```节点列表中的根节点。
5. 然后调用```walk.ts```中的```walk```，不断检查所有节点。
6. 检查节点过程中检查所有的指令，就是```directives```文件夹下那种。
7. 调用对应指令，通过```ctx.effect```之类的。调用之后会将其保存。如果需要响应式调用会调用响应函数，完成响应式应答。

至于响应式原理，不在这里。可以看看`@vue/reactivity`？

# index.ts

```ts
export { createApp } from './app'
export { nextTick } from './scheduler'
export { reactive } from '@vue/reactivity'

import { createApp } from './app'

const s = document.currentScript
if (s && s.hasAttribute('init')) {
  createApp().mount()
}
```

这里暴露了`createApp`，`nextTick`，`reactive`，三个接口。
`createApp`用于创建`app`实例。
`nextTick`用于解决响应式不能立即应答的问题。
`reactive`暴露vue的响应式变量创建接口。

# app.ts

核心就是`createApp`

```js
createApp = function(initialData){
	return {
		directive:(){},
		mount:(){},
		unmount:(){}
	}
}
```

## createApp初始化

```js
  // root context
  const ctx = createContext()
  if (initialData) {
    ctx.scope = reactive(initialData)
    bindContextMethods(ctx.scope)

    // handle custom delimiters
    if (initialData.$delimiters) {
      const [open, close] = (ctx.delimiters = initialData.$delimiters)
      ctx.delimitersRE = new RegExp(
        escapeRegex(open) + '([^]+?)' + escapeRegex(close),
        'g'
      )
    }
  }

  // global internal helpers
  ctx.scope.$s = toDisplayString
  ctx.scope.$nextTick = nextTick
  ctx.scope.$refs = Object.create(null)

  let rootBlocks: Block[]
```

首先是使用`context.ts`中的`createContext`方法创建了一个`ctx`对象。
```ts
export interface Context {
  key?: any // 不清楚有什么用
  scope: Record<string, any> // 响应式对象存放
  dirs: Record<string, Directive> // 存放自定义指令
  blocks: Block[] // 不是由根创建的Block实例，会把创建的Block实例向添加到ctx对象中这个属性中
  effect: typeof rawEffect // 一个函数，会把指令生成的响应式函数注入到ctx对象中。
  effects: ReactiveEffectRunner[] // 所谓的响应式函数存放处，和react的effect类似
  cleanups: (() => void)[] // 不清楚有什么用
  delimiters: [string, string] // 分隔符，可以自定义。
  delimitersRE: RegExp // 分隔符对应的一个正则
}
```
然后是处理`initialData`
将`initialData`响应式化，然后存到`ctx`的scope中。
`bindContextMethods`将`ctx.scope`下的函数的`this`绑定到`ctx.scope`上。

然后是对`ctx.scope`进行一些绑定。

最后创建了一个`rootBlocks`列表。
在返回值中会用到。

## directive

```ts
directive(name: string, def?: Directive) {
      if (def) {
        ctx.dirs[name] = def
        return this
      } else {
        return ctx.dirs[name]
      }
    },
```

将指令定义函数存放到`ctx.dirs`中。
如果没有输入`def`参数，则返回`ctx.dirs[name]`。

## mount

```ts
mount(el?: string | Element | null) {
      if (typeof el === 'string') {
        el = document.querySelector(el)
        if (!el) {
          import.meta.env.DEV &&
            console.error(`selector ${el} has no matching element.`)
          return
        }
      }

      el = el || document.documentElement
      let roots: Element[]
      if (el.hasAttribute('v-scope')) {
        roots = [el]
      } else {
        roots = [...el.querySelectorAll(`[v-scope]`)].filter(
          (root) => !root.matches(`[v-scope] [v-scope]`)
        )
      }
      if (!roots.length) {
        roots = [el]
      }

      if (
        import.meta.env.DEV &&
        roots.length === 1 &&
        roots[0] === document.documentElement
      ) {
        console.warn(
          `Mounting on documentElement - this is non-optimal as petite-vue ` +
            `will be forced to crawl the entire page's DOM. ` +
            `Consider explicitly marking elements controlled by petite-vue ` +
            `with \`v-scope\`.`
        )
      }

      rootBlocks = roots.map((el) => new Block(el, ctx, true))
      return this
    },
```

首先是处理`el`参数。

如果是`string`类型，则使用`el.querySelectorAll`查找所有dom节点。
如果是`null`，则默认为`html`节点。
如果是`Element`，不予处理

然后是生成`roots`
如果`el`节点带有`v-scope`属性，则`roots = [el]`。
否则`roots`为`el`节点下有`v-scope`属性的dom节点。
如果`el`节点下没有属性`v-scope`的节点，则`roots = [el]`。

接下来检查`warn`。
如果在构建工具中处于开发模式，并且`el`参数为`null`,并且没有使用`v-scope`。
则发出警告。

最后创建`Block`实例。
输入`el`dom节点，`ctx`对象，`isRoot`参数为`true`。
并将`Block`实例保存在`rootBlocks`中，就是`createApp`初始化最后创建的那个。

## unmount

```ts
  rootBlocks.forEach((block) => block.teardown())
    }
```

没什么可讲的。
使用`block`实例的`teardown`方法卸载。


# block.ts

只能说，在`app.ts`中的`createApp.mount`中会用到。
在某些指令中也会用到。

## `Block`类的属性

```ts
export class Block {
  template: Element | DocumentFragment // 一个dom节点，也是模板。
  ctx: Context // ctx对象
  key?: any // 不清楚
  parentCtx?: Context // ctx对象。

  isFragment: boolean // 是否使用template模板
  start?: Text // 在 insert()中初始化了。
  end?: Text // 在 insert() 中初始化了。
```

## `Block`类的初始化

```ts
constructor(template: Element, parentCtx: Context, isRoot = false) {
    this.isFragment = template instanceof HTMLTemplateElement

    if (isRoot) {
      this.template = template
    } else if (this.isFragment) {
      this.template = (template as HTMLTemplateElement).content.cloneNode(
        true
      ) as DocumentFragment
    } else {
      this.template = template.cloneNode(true) as Element
    }

    if (isRoot) {
      this.ctx = parentCtx
    } else {
      // create child context
      this.parentCtx = parentCtx
      parentCtx.blocks.push(this)
      this.ctx = createContext(parentCtx)
    }

    walk(this.template, this.ctx)
  }
```

首先判断`template`是否为`template`模板，结果存放到`this.isFragment`中。

然后处理`this.template`。
如果`isRoot`为真，`this.template = template`。
如果`this.isFragment`为真，将`template.content`复制一份放到`this.template`中。
否则，，将`template`复制一份放到`this.template`中。

接下来处理`this.ctx`
如果`isRoot`为真，`this.ctx = parentCtx`。
否则，将`parentCtx`存到`this.parentCtx`中，然后将block实例存到`parentCtx`的`blocks`中，然后重新创建一个`ctx`对象。

最后使用`walk.ts`的`walk`，处理模板中所有需要响应式的地方。

# walk.ts

递归处理所有dom节点。
首先会检查节点的`nodeType`。

## nodeType==1

这代表节点为`html`元素。

```ts
if (type === 1) {
    // Element
    const el = node as Element
    if (el.hasAttribute('v-pre')) {
      return
    }

    checkAttr(el, 'v-cloak')

    let exp: string | null

    // v-if
    if ((exp = checkAttr(el, 'v-if'))) {
      return _if(el, exp, ctx)
    }

    // v-for
    if ((exp = checkAttr(el, 'v-for'))) {
      return _for(el, exp, ctx)
    }

    // v-scope
    if ((exp = checkAttr(el, 'v-scope')) || exp === '') {
      const scope = exp ? evaluate(ctx.scope, exp) : {}
      ctx = createScopedContext(ctx, scope)
      if (scope.$template) {
        resolveTemplate(el, scope.$template)
      }
    }

    // v-once
    const hasVOnce = checkAttr(el, 'v-once') != null
    if (hasVOnce) {
      inOnce = true
    }

    // ref
    if ((exp = checkAttr(el, 'ref'))) {
      applyDirective(el, ref, `"${exp}"`, ctx)
    }

    // process children first before self attrs
    walkChildren(el, ctx)

    // other directives
    const deferred: [string, string][] = []
    for (const { name, value } of [...el.attributes]) {
      if (dirRE.test(name) && name !== 'v-cloak') {
        if (name === 'v-model') {
          // defer v-model since it relies on :value bindings to be processed
          // first, but also before v-on listeners (#73)
          deferred.unshift([name, value])
        } else if (name[0] === '@' || /^v-on\b/.test(name)) {
          deferred.push([name, value])
        } else {
          processDirective(el, name, value, ctx)
        }
      }
    }
    for (const [name, value] of deferred) {
      processDirective(el, name, value, ctx)
    }

    if (hasVOnce) {
      inOnce = false
    }
  }
```

如果节点有属性`v-pre`，中断。

如果有`v-cloak`属性，清除该属性。

接下来处理`v-if`和`v-for`。并返回`el`的下一个dom节点。

然后是`v-scope`。
如果`v-scope`有属性值，在这里处理。
如果`ctx.scope`使用了`template`模板，在这里处理。

接下来处理`v-once`。

然后调用`walkChildren`，递归式处理所有dom节点。

然后处理自定义的指令。

## nodeType==3

这代表为文本节点。

还记得`ctx`中定义了分隔符？并且存了一个用于分隔符处理的正则？
就在这里用上了。

```ts
else if (type === 3) {
    // Text
    const data = (node as Text).data
    if (data.includes(ctx.delimiters[0])) {
      let segments: string[] = []
      let lastIndex = 0
      let match
      while ((match = ctx.delimitersRE.exec(data))) {
        const leading = data.slice(lastIndex, match.index)
        if (leading) segments.push(JSON.stringify(leading))
        segments.push(`$s(${match[1]})`)
        lastIndex = match.index + match[0].length
      }
      if (lastIndex < data.length) {
        segments.push(JSON.stringify(data.slice(lastIndex)))
      }
      applyDirective(node, text, segments.join('+'), ctx)
    }
  }
```

虽然没有太看懂。。

## nodeType==11

这代表节点是template标签节点。

```ts
else if (type === 11) {
    walkChildren(node as DocumentFragment, ctx)
  }
```

直接使用`walkChildren`进行递归遍历。

# context.ts

用于`ctx`对象相关，包括创建之类的。

## createContext

```ts
export const createContext = (parent?: Context): Context => {
  const ctx: Context = {
    delimiters: ['{{', '}}'],
    delimitersRE: /\{\{([^]+?)\}\}/g,
    ...parent,
    scope: parent ? parent.scope : reactive({}),
    dirs: parent ? parent.dirs : {},
    effects: [],
    blocks: [],
    cleanups: [],
    effect: (fn) => {
      if (inOnce) {
        queueJob(fn)
        return fn as any
      }
      const e: ReactiveEffectRunner = rawEffect(fn, {
        scheduler: () => queueJob(e)
      })
      ctx.effects.push(e)
      return e
    }
  }
  return ctx
}
```

`ctx`对象的根源。
在`app.ts`中，最开始初始化一个空的`ctx`对象，并把`initialData`存到`ctx.scope`中。
可以明显看到`effect`，即需要触发的响应式函数所在。
`rawEffect`从`@vue/reactivity`引入。

## createScopedContext

在遍历到有`v-scope`属性的节点时会调用。
毕竟`v-scope`是有属性值需要处理。

```ts
export const createScopedContext = (ctx: Context, data = {}): Context => {
  const parentScope = ctx.scope
  const mergedScope = Object.create(parentScope)
  Object.defineProperties(mergedScope, Object.getOwnPropertyDescriptors(data))
  mergedScope.$refs = Object.create(parentScope.$refs)
  const reactiveProxy = reactive(
    new Proxy(mergedScope, {
      set(target, key, val, receiver) {
        // when setting a property that doesn't exist on current scope,
        // do not create it on the current scope and fallback to parent scope.
        if (receiver === reactiveProxy && !target.hasOwnProperty(key)) {
          return Reflect.set(parentScope, key, val)
        }
        return Reflect.set(target, key, val, receiver)
      }
    })
  )

  bindContextMethods(reactiveProxy)
  return {
    ...ctx,
    scope: reactiveProxy
  }
}
```

可以看到，直接将原`ctx`对象复制了一份，与`v-scope`属性值合并。
然后重新`Proxy`。
最后使用`bindContextMethods`进行了函数绑定。

## bindContextMethods

```ts
export const bindContextMethods = (scope: Record<string, any>) => {
  for (const key of Object.keys(scope)) {
    if (typeof scope[key] === 'function') {
      scope[key] = scope[key].bind(scope)
    }
  }
}
```

重新进行函数绑定。

# 其他

## eval.ts

进行属性值表达式处理。

## scheduler.ts

`nextTick`，用于响应式处理延迟的。
`queueJob`，任务队列。好像用到了`ctx`的`efftct`上？
`flushJobs`，运行任务队列。

## utils.ts

`checkAttr`，获得属性值，并清除属性。
`listen`，事件绑定？