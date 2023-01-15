---
title: rollup插件
date: 2022-12-16 15:02:55
categories:
	- 前端
	- rollup
tags:
	- 前端
	- rollup
---

> [rollup 插件](https://rollupjs.org/guide/en/#plugin-development)翻译

# 插件概述

一个rollup插件是一个具有一个或多个属性，构建hook和输出生成hook的对象插件应作为一个包分发，该包导出一个函数，该函数可以使用插件特定的option调用并返回这样的对象。

插件允许你自定义rollup的行为，例如，在绑定之前传输代码，或在node_modules文件夹中查找第三方模块。有关如何使用插件的示例，请查看[Using plugins](https://rollupjs.org/guide/en/#using-plugins)。

可以在[github.com/rollup/awesome](https://github.com/rollup/awesome)上找到一个插件列表。如果你想对插件提出建议，请提交一个PR。

# 简单示例

下面的插件在不访问文件系统的情况下拦截任何虚拟模块的导入。例如，如果你想在浏览器中使用rollup，这是必要的。它甚至可以用于替换示例中所示的entry points。

```js
// rollup-plugin-my-example.js
export default function myExample () {
  return {
    name: 'my-example', // this name will show up in warnings and errors
    resolveId ( source ) {
      if (source === 'virtual-module') {
        return source; // this signals that rollup should not ask other plugins or check the file system to find this id
      }
      return null; // other ids should be handled as usually
    },
    load ( id ) {
      if (id === 'virtual-module') {
        return 'export default "This is virtual!"'; // the source code for "virtual-module"
      }
      return null; // other ids should be handled as usually
    }
  };
}

// rollup.config.js
import myExample from './rollup-plugin-my-example.js';
export default ({
  input: 'virtual-module', // resolved by our plugin
  plugins: [myExample()],
  output: [{
    file: 'bundle.js',
    format: 'es'
  }]
});
```

# 惯例

- 插件应该有一个清晰的名字，带有rollup-plugin- 的前缀。
- 在package.json文件中包含rollup-plugin关键字。
- 插件应该经过测试。我们推荐[mocha](https://github.com/mochajs/mocha)，或者[ava](https://github.com/avajs/ava)，它们支持开箱即用的Promise。
- 如果可能，请使用异步方法，例如使用fs.reafFile而不是fs.reafFileSync。
- 使用英语书写文档。
- 如果合适，请确认你的插件输出正确的源映射。
- 如果你的插件使用“虚拟模块”（例如，helper函数），请在模块ID前加上\0。这将阻止其他插件尝试处理它。

# Properties 属性

## name

Type: string
插件的名字，用于error和warning信息中。

# Build Hooks 构建Hook

为了与构建过程交互，插件对象需要包含hook。hook是在构建的各个阶段调用的函数。hook可以影响构建的运行，提供有关构建的信息，或者在构建完成之后进行修改。这有不同种类的hook：

- async：这种hook可以返回一个Promise，解析为相同类型的值；否则，这个hook应该标记为sync。
- first：如果几个插件都实现了这个hook，hook将按顺序执行，直到hook返回null或undefined以外的值。
- sequential：如果几个插件实现了这个hook，那么这些插件都将按照指定的插件顺序执行。如果其中一个hook是异步的，那么这种类型的后续hook将等待当前hook执行完毕。
- parallel：如果有几个插件实现了这个hook，那么这些插件都将按照执行的插件顺序执行。如果一个hook是异步的，那么这种类型的后续hook将并行执行，而不是等待当前hook。

hook不仅可以是对象，也可以是函数。在这种情况下，必须将实际的hook函数（或者banner/footer/intro/outro的值）指定为处理程序。这允许你提供更改hook执行的其他可选属性。

- order: "pre" | "post" | null

如果有几个插件实现了这个hook，要么先运行这个插件('pre')，要么最后运行('post')，或者在用户执行的顺序运行(没有值或者为null)

```js
  export default function resolveFirst() {
    return {
      name: 'resolve-first',
      resolveId: {
        order: 'pre',
        handler(source) {
          if (source === 'external') {
            return { id: source, external: true };
          }
          return null;
        }
      }
    };
  }
```

如果几个插件都使用了‘pre'或’post'，rollup将按照用户指定的顺序运行它们。此选项可用于所有插件hook。对于并行hook，它会更改hook的同步部分的运行顺序。

- sequential: boolean

