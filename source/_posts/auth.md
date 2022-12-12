---
title: HTTP-身份认证
date: 2022-12-03 23:39:49
categoires:
	- 前端
	- auth
tags:
	- 前端
	- auth
---

# 前言

token，又是前端八股常考且必考。但总是云里雾里。
这篇文章里也差不多。
没事可以多看看
- [HTTP 身份验证](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Authentication)
- [Introduction to JSON Web Tokens](https://jwt.io/introduction/)
- [OAuth 2.0](https://oauth.net/2/)

# 总领

到底怎么认证一个用户？  
简答来说，就是在HTTP头部放一段密文，用于验证。
至于怎么放，放什么，五花八门。

# 在MDN中

依据文章[HTTP 身份验证](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Authentication)
认证的流程基本就是，客户端请求，服务端通过```WWW-Authenticate```首部通知如何认证；然后经过认证后，客户端使用```Authorization```发送认证字段。

至于认证的方案：
1. Basic (查看 RFC 7617，base64 编码凭证。),
2. Bearer (查看 RFC 6750，bearer 令牌通过 OAuth 2.0 保护资源),
3. Digest (查看 RFC 7616，只有 md5 散列 在 Firefox 中支持，查看 bug 472823 用于 SHA 加密支持),
4. HOBA (查看 RFC 7486（草案），HTTP Origin-Bound 认证，基于数字签名),
5. Mutual (查看 draft-ietf-httpauth-mutual),
6. AWS4-HMAC-SHA256 (查看 AWS docs).

。。基本就是Basic和Bearer。剩下的我也不知道。。

Basic最简单了，用":"将用户名和密码拼接，然后使用base64编码，就完事了。参见[Authorization](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Authorization)

Bearer的可以参见[OAuth 2.0](https://oauth.net/2/)。反正我是没怎么看懂。

# cookie

首先cookie是什么样的？
在浏览器中的开发者工具中开启网络选项页可以看到，cookie在请求头中是一个字符串，可以格式化成一堆键值对。
总之是一个存放数据的地方。
在Storage api之前是主要存放数据的地方。

而在flask中的session变量存放的键值对也会放到cookie中

当然也可以存放密文用于身份验证。

# token

世界上或许有很多种token？或许吧。
但我只知道jsonwebtoken。
参见[Introduction to JSON Web Tokens](https://jwt.io/introduction/)

jwt分为三部分，头部header，负载payload，签名Signature。
header包含两部分，token的类型，加密算法
payload包含各种信息。
Signature，需要计算。

首先，头部需要将json转换为字符串，然后经过base64。
然后负载也一样。
最后签名需要使用加密算法，将头部负载和密码一起放入。

在python中
base64可以用```base64```库，加密算法可以用```hashlib```库，hmac算法可以用```hmac```库。这些库都是默认就有的。
在js中
base64可以用```atob```和```btoa```函数。


