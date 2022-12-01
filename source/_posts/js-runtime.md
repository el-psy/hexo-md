---
title: 任务，微任务，事件循环以及js运行时理论篇
date: 2022-11-30 16:21:29
categories:
	- 前端
	- eventLoop
tags: 
	- 前端
	- eventLoop
	- js-runtime
	- microtask
---

# 背景
宏任务和微任务是前端八股重要一问。
答案就是宏任务在微任务之前。
但到底是怎么一回事呢？
当然可以直接去看
[In depth: Microtasks and the JavaScript runtime environment](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth)
[深入：微任务与 Javascript 运行时环境](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth)
[在 JavaScript 中通过 queueMicrotask() 使用微任务](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide)
我也不过是从中总结而已。

# 前言
在MDN中，在下只找到了一处使用```宏任务```这个词的地方。
就是[深入：微任务与 Javascript 运行时环境](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth)，里面使用括号标注了```宏任务```这个词。
而在英文，以及大部分的中文翻译中，都只是用了```task```或者```任务```这个词。

# 第一核心问题

第一核心问题，当然是什么是任务和微任务。
在[在 JavaScript 中通过 queueMicrotask() 使用微任务](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide)中有解答。

- 任务：一个 任务 就是由执行诸如从头执行一段程序、执行一个事件回调或一个 interval/timeout 被触发之类的标准机制而被调度的任意 JavaScript 代码。这些都在 任务队列（task queue）上被调度。
- 微任务：一个 微任务（microtask）就是一个简短的函数，当创建该函数的函数执行之后，并且 只有当 Javascript 调用栈为空，而控制权尚未返还给被 user agent 用来驱动脚本执行环境的事件循环之前，该微任务才会被执行。

是不是一头雾水？那换一种说法，也是八股常考，如何触发任务和微任务。

任务触发：
1. 一段新程序或子程序被直接执行时（比如从一个控制台，或在一个 script 元素中运行代码）。
2. 触发了一个事件，将其回调函数添加到任务队列时。
3. 执行到一个由 setTimeout() 或 setInterval() 创建的 timeout 或 interval，以致相应的回调函数被添加到任务队列时。

微任务触发：
JavaScript 中的 promises 和 Mutation Observer API 都使用微任务队列去运行它们的回调函数，但当能够推迟工作直到当前事件循环过程完结时，也是可以执行微任务的时机。为了允许第三方库、框架、polyfills 能使用微任务，Window 暴露了 queueMicrotask() 方法，而 Worker 接口则通过 WindowOrWorkerGlobalScope mixin 提供了同名的 queueMicrotask() 方法。
> 也就是promises、Mutation Observer API和queueMicrotask。

# 什么是事件循环

在[深入：微任务与 Javascript 运行时环境](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth)有解答。

每个代理都是由事件循环驱动的，事件循环负责收集事件（包括用户事件以及其他非用户事件等）、对任务进行排队以便在合适的时候执行回调。然后它执行所有处于等待中的 JavaScript 任务，然后是微任务，然后在开始下一次循环之前执行一些必要的渲染和绘制操作。

网页或者 app 的代码和浏览器本身的用户界面程序运行在相同的 线程中，共享相同的 事件循环。该线程就是 主线程，它除了运行网页本身的代码之外，还负责收集和派发用户和其它事件，以及渲染和绘制网页内容等。

然后，事件循环会驱动发生在浏览器中与用户交互有关的一切，但在这里，对我们来说更重要的是需要了解它是如何负责调度和执行在其线程中执行的每段代码的。

有如下三种事件循环：

1. Window 事件循环
> window 事件循环驱动所有同源的窗口 (though there are further limits to this as described elsewhere in this article XXXX ????).

2. Worker 事件循环
> worker 事件循环顾名思义就是驱动 worker 的事件循环。这包括了所有种类的 worker：最基本的 web worker 以及 shared worker 和 service worker。Worker 被放在一个或多个独立于“主代码”的代理中。浏览器可能会用单个或多个事件循环来处理给定类型的所有 worker。

3. Worklet 事件循环
> worklet (en-US) 事件循环用于驱动运行 worklet 的代理。这包含了 Worklet (en-US)、AudioWorklet (en-US) 以及 PaintWorklet (en-US)。

多个同源（译者注：此处同源的源应该不是指同源策略中的源，而是指由同一个窗口打开的多个子窗口或同一个窗口中的多个 iframe 等，意味着起源的意思，下一段内容就会对这里进行说明）窗口可能运行在相同的事件循环中，每个队列任务进入到事件循环中以便处理器能够轮流对它们进行处理。记住这里的网络术语“window”实际上指的用于运行网页内容的浏览器级容器，包括实际的 window，一个 tab 标签或者一个 frame。

在特定情况下，同源窗口之间共享事件循环，例如：

如果一个窗口打开了另一个窗口，它们可能会共享一个事件循环。
如果窗口是包含在 iframe 中，则它可能会和包含它的窗口共享一个事件循环。
在多进程浏览器中多个窗口碰巧共享了同一个进程。
这种特定情况依赖于浏览器的具体实现，各个浏览器可能并不一样。

总结：
事件循环线程就是主线程。至于背地里做的那些事，由浏览器安排。
事件循环线程的流程：
1. 收集事件（包括用户事件以及其他非用户事件等）
2. 对任务进行排队以便在合适的时候执行回调
3. 执行所有处于等待中的 JavaScript 任务
4. 执行所有处于等待中的 JavaScript 微任务
5. 执行一些必要的渲染和绘制操作

# 任务和微任务的先后

。。简单的话，事件循环已经解答了。
在一次事件循环中，先执行任务，再执行微任务。
至于细节一点。
[在 JavaScript 中通过 queueMicrotask() 使用微任务](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide)里讲。

首先，每当一个任务存在，事件循环都会检查该任务是否正把控制权交给其他 JavaScript 代码。如若不然，事件循环就会运行微任务队列中的所有微任务。
其次，如果一个微任务通过调用 queueMicrotask(), 向队列中加入了更多的微任务，则那些新加入的微任务 会早于下一个任务运行。这是因为事件循环会持续调用微任务直至队列中没有留存的，即使是在有更多微任务持续被加入的情况下。

# 最后

上面说的是真的吗？
不过是MDN中讲的罢了。
还需要真正用代码来验证。