---
title: 跨域资源共享
date: 2022-12-01 14:01:27
categoires:
	- 前端
	- cors
tags:
	- 前端
	- cors
---

# 前言

首先，这篇是从[跨源资源共享（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS?qs=cors)中弄出来的。
说起来，MDN还真是强大呢。
跨域资源共享，或称为CORS，是一种浏览器安全机制，需要后端的配合。现在前后端分离的趋势下，加给一种前端的源和后端的源的限制，以达到安全的目的。具体上是，在后端中设置一些访问的限制，主要是访问的源的限制，也有其他的限制；浏览器端中如果发现请求不符合后端服务器的限制，则返回请求失败。

# 同源的定义

如果两个 URL 的 protocol、port (en-US) (如果有指定的话) 和 host 都相同的话，则这两个 URL 是同源。

出自[浏览器的同源策略](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy)

# 什么情况下需要CORS

- 前文提到的由 XMLHttpRequest 或 Fetch API 发起的跨源 HTTP 请求。
- Web 字体（CSS 中通过 @font-face 使用跨源字体资源），因此，网站就可以发布 TrueType 字体资源，并只允许已授权网站进行跨站调用。
- WebGL 贴图。
- 使用 drawImage() 将图片或视频画面绘制到 canvas。
- 来自图像的 CSS 图形 (en-US)。

出自[跨源资源共享（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS?qs=cors)

# 流程

1. 浏览器通过XHR或者Fetch等方式发起跨域资源请求。
2. 判断是否为简单请求

3.1. 如果是简单请求
> 直接向后端发起请求，通过返回的响应头判断请求是否符合CORS的安全策略

3.2. 如果不是简单请求

> 先发起预检请求，判断是否符合CORS的安全策略
> 如果符合安全策略，再发送实际的请求

# 什么是简单请求

这实在是一个复杂的问题，估计在面试中把答案说出来，面试官也很少能弄清。
前3条还好，后两条比较难遇到。

1. 使用下列方法之一
> GET, HEAD, POST
2. 除了被用户代理自动设置的首部字段，允许人为设置的字段为Fetch规范定义的对 CORS 安全的首部字段集合：
> Accept
> Accept-Language
> Content-Language
> Content-Type（需要注意额外的限制）
> Range（只允许简单的范围首部值 如 bytes=256- 或 bytes=127-255）
3. Content-Type 首部所指定的媒体类型的值仅限于下列三者之一：
> text/plain
> multipart/form-data
> application/x-www-form-urlencoded
4. 如果请求是使用 XMLHttpRequest 对象发出的，在返回的 XMLHttpRequest.upload 对象属性上没有注册任何事件监听器；也就是说，给定一个 XMLHttpRequest 实例 xhr，没有调用 xhr.upload.addEventListener()，以监听该上传请求。
5. 请求中没有使用 ReadableStream 对象。

# 需要注意的头部

```yaml
Access-Control-Allow-Origin: https://foo.example
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: X-PINGOTHER, Content-Type
Access-Control-Max-Age: 86400
```

。。应该能轻松看懂吧。
这是在后端服务器上设置的头部，在CORS请求中的响应头中返回的字段，用于CORS的安全策略。
包括设置了允许访问的源，允许访问的方式，请求头中允许设置的头部字段，预检请求可以缓存时间从长短（单位秒）。

# fetch

是的，fetch的访问也会受到cors的限制，与简单请求有一定的相关。可以多注意一下。