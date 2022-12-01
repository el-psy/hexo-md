---
layout: config.default_layout
title: hexo主题修改1
date: 2022-11-23 14:29:45
update: 2022-11-23 14:29:45
categories: 
	- hexo
	- 主题
tags: 
	- hexo主题
---

# hexo基本简介

至于hexo的到处都是的东西我就不说了。  
首先有render，hexo可以换render的。上网一搜就能找到，基本是```hexo-render```开头的npm包。  
然后也有一个渲染的钩子函数之类的东西，我也不是很清楚。  
最后也有插件。在hexo的包里就能找到```plugin```文件夹。里面就是通过插件的方式加入的hexo基础功能，比如文档里介绍的变量和函数。  

渲染模板有很多，比如ejs。可以去ejs的文档里找。。  

# 修改indigo

indigo是hexo官网里就能找到的主题。不过直接```git clone```是使用不了的。  
总之各种问题。

首先是lodash的问题。旧版hexo会携带lodash包，并且在变量里用```_```引入。在新版hexo中，需要用插件的方式将其引入，使得indigo可用。

```javascript
hexo.extend.filter.register('template_locals', locals => {
	locals._ = lodash;
});
```

然后的日期问题。hexo文档里虽说是用```moment```来格式化时间，实际上是```moment-timezone```。

在插件文件中加入，实现月份的中文化。

```javascript
const moment = require('moment')

moment.updateLocale('zh-cn', {
    months: [
      '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'
    ]
  })
moment.locale()

hexo.extend.helper.register('data_format', (date, format)=>{
	return moment(date).format(format)
})
```

# 本人的其他修改

细节就不多说了。
比如简单的格式修改。
还有滚动文章页面时，原代码里劫持了事件，我给注释了。
就是这篇文章。。页内锚点链接需要```encodeURI```转换。

重点是```tag```和```category```。初用者一定不清楚两者之间区别。
实际上，```tag```译为标签，一篇文章里的标签之间是平级关系；```category```却不是。  
可以在hexo中的```plugin```文件夹里寻找到```list_categories```函数的实现。顺便在插件文件中复制一份，并且打印一下```category```就会发现，它是有```parent```这种东西的。
所以我就将其作为目录一样的存在，并在插件中实现了一下，在```/categories```路径下渲染了一下。

# 最后

最后的结果，虽然页面和原先很像，但也经过一定的美化，并且在新版的hexo变得可用了，更符合我的心意。
然后我上传到github上，[my-hexo-theme](https://github.com/el-psy/my-hexo-theme)
自己用的时候别范那种把我的邮箱放到最终页面上的低级错误。。。