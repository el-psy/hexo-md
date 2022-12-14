---
title: petite-vue学习记录1
date: 2022-12-13 11:52:17
categories:
	- 前端
	- 框架
	- petite-vue
tags:
	- 前端
	- 框架
	- petite-vue
---

# 起源

摸鱼中。摸到了```petite-vue```。

# 总览

也就[petite-vue github](https://github.com/vuejs/petite-vue)了。
并没有找到文档什么的。
或许有csdn或者简书之类的blog写点东西？

# 1. 引入

直接cdn引入，或者script标签引入代码。
好像vite有个社区模板？
并没有见过vite这类前端构建工具使用```petite-vue```。

# 2. 引入了什么？

假设使用如下方式引入
```html
<script src="https://unpkg.com/petite-vue"></script>
```

会产生一个```PetiteVue```变量。
之下有```createApp```，```nextTick```，```reactive```3个属性。
然后还会默认运行一段代码
```ts
const s = document.currentScript
if (s && s.hasAttribute('init')) {
  createApp().mount()
}
```
即引入```PetiteVue```时，标签加了```init```属性会将```createApp```挂载在全局上。

# 3. createApp

```js
createApp = function(initialData) {
	return {
		directive(name, def?){},
		mount(el? ){},
		unmount(){}
	}
}
```

`createApp`差不多就是这个结构。
`initialData`中就是各种属性和函数，通过`@vue/reactivity`中的`reactive`变成响应式的，存放在`ctx.scope`。
`mount`的`el`是可选参数。如果为空，则默认为全局。在挂载过程中，通过`document.querySelector(el)`获取根dom节点，然后检查下面有```v-scope```的dom节点，作为接下来的输入，也就是真正响应式发生作用的范围。

`initialData`也可以写成`vue`中`data`的样式，写成一个返回对象的函数。
然后在`v-scope`的属性值中调用函数，进行初始化。

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/petite-vue?module'

  function Counter(props) {
    return {
      count: props.initialCount,
      inc() {
        this.count++
      },
      mounted() {
        console.log(`I'm mounted!`)
      }
    }
  }

  createApp({
    Counter
  }).mount()
</script>

<div v-scope="Counter({ initialCount: 1 })" @vue:mounted="mounted">
  <p>{{ count }}</p>
  <button @click="inc">increment</button>
</div>

<div v-scope="Counter({ initialCount: 2 })">
  <p>{{ count }}</p>
  <button @click="inc">increment</button>
</div>

```

# 4. 指令

指令列表
1. v-bind
2. v-effect
3. v-for
4. v-html
5. v-if v-else v-else-if
6. v-model
7. v-on
8. v-ref
9. v-show
10. v-text

## v-effect

行内执行响应式代码
```html
<div v-scope="{ count: 0 }">
  <div v-effect="$el.textContent = count"></div>
  <button @click="count++">++</button>
</div>
```

# 5. 其他

## v-scope

它是根。```petite-vue```以它所在dom节点作为根。
后面的属性值应返回一个对象。
和根的```ctx.scope```合并作为根下的响应式对象。

## @vue:mounted @vue:unmounted

在app挂载和卸载是执行的行内语句。

## 定制指令

我也不是很懂。
所以复制粘贴大法。
来自[petite-vue github](https://github.com/vuejs/petite-vue)。

```js
const myDirective = (ctx) => {
  // the element the directive is on
  ctx.el
  // the raw value expression
  // e.g. v-my-dir="x" then this would be "x"
  ctx.exp
  // v-my-dir:foo -> "foo"
  ctx.arg
  // v-my-dir.mod -> { mod: true }
  ctx.modifiers
  // evaluate the expression and get its value
  ctx.get()
  // evaluate arbitrary expression in current scope
  ctx.get(`${ctx.exp} + 10`)

  // run reactive effect
  ctx.effect(() => {
    // this will re-run every time the get() value changes
    console.log(ctx.get())
  })

  return () => {
    // cleanup if the element is unmounted
  }
}

// register the directive
createApp().directive('my-dir', myDirective).mount()
```