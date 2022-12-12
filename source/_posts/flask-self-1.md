---
title: flask记录-1
date: 2022-12-12 13:40:41
categories:
	- 后端
	- flask
tags:
	- 后端
	- flask
---

# 源点

提高前端项目的体量，需要一个后端支撑。所以选了flask？
其实是根据项目面对人群进行的选择。
标注面对ml人群，他们很有可能直接一发anaconda，然后里面就默认安装flask。
对于那些需要做保密项目，安装开发环境艰难，开发环境简陋的比较友好？
毕竟在linux平台安装python的最简单方案就是anaconda。
在此记录一下flask项目中的一些bug。
毕竟bug数量已经是函数数量的好几倍了。

# 启动

在flask文档中flask的启动是，首先设定一个flask相关的临时环境变量，然后通过```flask run```命令启动。
如果文件名是```app.py```等几种，也可以直接```flask run```。

我就直接
```python
if __name__ == '__main__':
	app = create_app()
	app.run(debug=True)
```
其中```debug=True```开启了debug模式，如果修改文件，则自动重启flask服务。
这种方法适用于开发模式。
当然，我也没想着能够部署。

# cors

cors非常轻松。
直接安装```flask_cors```包。
然后在```config.py```中设置对应配置，然后导入即可。
然后就可以轻松在前端进行```ajax```通信了。

# json web token

可以看看[Introduction to JSON Web Tokens](https://jwt.io/introduction/)
这里使用了```pyjwt```。
jwt分为三段。

> 第一段是
> ```js
> {
>   "alg": "HS256", # 加密算法
>   "typ": "JWT" # 代表token类型是json web token
> }
> ```
> 然后进行base64转换。这是明文。
  

> 第二段是一些json记录。
> 其中一些键是保留字段。
> 在pyjwt中实现了一下
> ```exp``` (Expiration Time) Claim 到期时间
> ```nbf``` (Not Before Time) Claim 起始时间，在这之前的请求不予处理
> ```iss``` (Issuer) Claim 发行人
> ```aud``` (Audience) Claim 受众，我也不清楚这是什么
> ```iat``` (Issued At) Claim 发行时间
> 总之，我用了```iat```和```exp```，限制了token的生效时间。
> 然后自定义了一个```actor```字段描述用户角色。
> 最后把这段进行base64转换。这是明文。
  

> 第三段是密文
> 就是根据生成的密码，对第一段和第二段进行加密，防止用户修改第一段和第二段（第一段和第二段是明文）。
> 如果用户修改第一段和第二段，就可以通过密文和明文比对发现。
> 加密算法在第一段中声明了
> 或许还会用到hmac。hmac和hashlib都是Python的默认库。

jwt加密密码是每次启动flask时清空，调用时如果为空使用```secret```包生成一份。

# auth

auth用户认证。包括用户身份认证，注册登录注销等。

首先使用了```flask_auth```包。
使用了里面的```HTTPTokenAuth```
里面的认证机制有两个。
1. authenticate
本来是用户名和密码进行验证。
```HTTPTokenAuth```对应的则是token能否被验证。这里通过pyjwt进行。
对应的函数需要使用```@auth.verify_token```装饰一下
2. authorize
是用来验证用户的角色的。访问某些url需要验证一下用户角色。
而这个项目的用户角色存放在token中，在解析token时就返回了。
总之建议阅读这个```authorize```的源码。
说实话，源码比文档好读。。

这里注册是密码直接明文放到数据库中了。至于如何加密，在flask文档中有。
登录就直接向前端发一个token。至于这个token后端也没有记录。
注销功能后端就直接没写。直接让前端删除token吧。反正前端估计也是我写。

# db

数据库使用的是python自带的sqlite3。
首先在flask文档里把db的句柄（就是sqlite3.connect返回的那个）存到了```g```对象中。
这是有原因的。
sqlite3的文件crud权限有同时只能有一个线程的限制。
所以文档里最后还有个```app.teardown_appcontext```
但是我这里的```init_db```就直接运行```db.py```就可以了。。

# db.execute

在数据库操作中的bug。。
首先，这个```db.execute```可以进行字符串转换，防止注入（好像是这样的）。
然后输入数据时需要```()```，如果只有一个变量，勿忘在变量后加一个逗号。
同时进行多组时可以使用```executemany```。

# 获得参数之后

第一步就是对参数的结构进行认证。
或者是确认参数类型？
为此直接在```utils.py```来了一发```req_need_key```函数。

# 其他

当然还有问题。
比如在编写到中途时修改数据库结构。
反正直接一发```init_db```就可以。
还有```task```任务需要时间线限制。还没编写。
总之，问题多多。大不了交给前端。
反正前端也是在下。