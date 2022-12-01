---
layout: config.default_layout
title: "Pattern: Backends For Frontends 翻译尝试"
date: 2022-11-24 00:44:28
categories:
	- 前端
	- BFF
tags:
	- 前端
	- BFF
---

Pattern: Backends For Frontends
# 模式：Backends For Frontends
Written on Nov 18 2015
写于 2015.11.18
Single-purpose Edge Services for UIs and external parties
针对UI和外部的单一目标的边缘服务

Introduction
# 介绍
With the advent and success of the web, the de facto way of delivering user interfaces has shifted from thick-client applications to interfaces delivered via the web, a trend that has also enabled the growth of SAAS-based solutions in general. The benefits of delivering a user interface over the web were huge - primarily as the cost of releasing new functionality was significantly reduced as the cost of client-side installs was (in most cases) eliminated altogether.
随着web技术出现并取得成功，与用户的交互已经从厚重的客户端转向通过web界面，这一趋势也推动了基于SAAS的方案的增长。使用web界面与用户交互的好处是巨大的————主要是由于发布新功能的成本显著降低，大多数情况下客户端安装的成本被完全消除。

This simpler world didn't last long though, as the age of the mobile followed shortly afterwards. Now we had a problem. We had server-side functionality which we wanted to expose both via our desktop web UI, and via one or more mobile UIs. With a system that had initially been developed with a desktop-web UI in mind, we often faced a problem in accommodating these new types of user interface, often as we already had a tight coupling between the desktop web UI and our backed services.
然而随着移动时代的到来，这个简单的世界并没有持续多久。现在我们遇到了一个问题：我们希望通过web端的UI和移动端的UI调用服务端的功能，但是在最初考虑到桌面端UI的系统的时候，我们发现桌面端UI与服务端的接口之间已经紧密耦合。

The General-Purpose API Backend
# 通用API后端
A first step in accommodating more than one type of UI is normally to provide a single, server-side API, and add more functionality as required over time to support new types of mobile interaction:
适应多种UI的第一步通常是提供单一的服务端API，并根据需求添加更多功能，以支持新类型的移动交互  
![](./single-api.jpg "通用API后端")
<figcaption>通用API后端</figcaption>

If these different UIs want to make the same or very similar sorts of calls, then it can be easy for this sort of general-purpose API to be successful. However the nature of a mobile experience often differs drastically from a desktop web experience. Firstly, the affordances of a mobile device are very different. We have less screen real estate, which means we can display less data. Opening lots of connections to server-side resources can drain battery life and limited data plans. And secondly, the nature of the interactions we want to provide on a mobile device can differ drastically. Think of a typical bricks-and-mortar retailer. On a desktop app I might allow you to look at the items for sale, order online or reserve in store. On the mobile device though I might want to allow you scan bar codes to do price comparisons or give you context-based offers while in store. As we've built more and more mobile applications we've come to realise that people use them very differently and therefore the functionality we need to expose will differ too.
如果这些不同的UI想要有相同的或相似的调用，那么这种通用API很容易成功。然而，移动端和桌面端的体验本质上截然不同。首先，移动端UI的可利用资源与桌面端截然不同。我们有更少的屏幕空间，这意味着我们只能显示更少的数据；向服务器发送大量请求可能会消耗电池寿命和电池电量。其次，我们希望在移动端提供的用户交互会有很大不同。比如典型的实体零售商。在桌面端，我们可能会允许用户查看待售商品、在线订购和在商店预定。但在移动端，我可能会让用户扫描条形码进行价格比较，或者在商店里基于用户历史习惯提供内容。随着我们构建了越来越多的移动应用程序，我们开始意识到用户使用它们的方式非常不同，因此我们需要提供的功能（提供的接口？）也会有所不同。

So in practice, our mobile devices will want to make different calls, fewer calls, and will want to display different (and probably less) data than their desktop counterparts. This means that we need to add additional functionality to our API backend to support our mobile interfaces.
因此，在实践中，我们的移动端希望有不同的请求，更少的请求，与桌面端相比展示不同（一般情况下是更少）的数据。这意味着我们需要在后端API添加额外的功能，支持我们的移动端。

Another problem with the general-purpose API backend is that they are by definition providing functionality to multiple, user-facing applications. This means that the single API backend can become a bottleneck when rolling out new delivery, as so many changes are trying to be made to the same deployable artifact.
通用API后端的另一个问题是，它为不同用户界面提供功能。这意味着，单一的后端API成为了瓶颈，当提供新的功能交付时，对一个可部署工件会做许多更改。

The tendency for the general-purpose API backend to take on multiple responsibilities, and therefore require lots of work, often results in a team being created specifically to handle this code base. This can make the problem much worse, as now front-end teams have to interface with a separate team to get changes made - a team which will have to balance both the priorities of the different client teams, and also work with multiple downstream teams to consume new APIs as they become available. It could be argued that at this point we have just created a smart-piece of middleware in our architecture, something which is not focused on any particular business domain - something which goes against many people's views of what sensible Service Oriented Architecture should look like.
随着通用后端API承担越来越多的功能，会产生大量工作需求，结果就是需要专门创建一个团队来管理后端代码。这可能会导致问题变得更糟：现在前端团队会为了需求更改与另一个团队（后端）来进行沟通————而后端团队也必须平衡多种不同客户端之间的需求，并且与多个下游团队合作，创建新的可用API。就这样我们创建了一个智能的中间件，但是它没有专注于任何特定的业务领域，与人们对于面向服务的智能体系架构的想法相违背。

![](general-purpose-api-teams.jpg "使用通用支持API时的通用团队结构")
<figcaption>使用通用支持API时的通用团队结构</figcaption>

Introducing The Backend For Frontend
Backend For Frontend介绍

One solution to this problem that I have seen in use at both REA and SoundCloud is that rather than have a general-purpose API backend, instead you have one backend per user experience - or as (ex-SoundClouder) Phil Calçado called it a Backend For Frontend (BFF). Conceptually, you should think of the user-facing application as being two components - a client-side application living outside your perimeter, and a server-side component (the BFF) inside your perimeter.
我在REA和SoundCloud看到的这个问题的一个解决方案就是，为每一个用户UI创建一个后端，取消原来的通用后端API————这被一位前SoundClouder Phil Calçado成为Backend For Frontend (BFF)。从概念上讲，应当将面向用户的应用程序分为两个组件————一个是在外的客户端应用程序，一个是在内的服务端组件（BFF）。

The BFF is tightly coupled to a specific user experience, and will typically be maintained by the same team as the user interface, thereby making it easier to define and adapt the API as the UI requires, while also simplifying process of lining up release of both the client and server components.
BFF与特定的用户UI紧密耦合，通常由构建用户界面的团队进行维护，从而使得根据UI的需求定制调整API变得更加容易，同时也简化了客户端和服务器组件的发布流程。
![](bff-overview.jpg "每一个用户界面使用一个服务端的BFF")
<figcaption>每一个用户界面使用一个服务端的BFF</figcaption>

BFF专注于一个单独的UI，这使得它能够被定制化，从而变得更小型化。

How Many BFFs?
我们需要多少个BFF？

当谈到为不同平台提供相同（或相似）的用户体验时，我看到了两种不同的方案。我更喜欢的模型是阉割为每种不同的客户端提供一个BFF————这是我在REA看到的一个模型：
![](one-bff-per-mobile.jpg "不同的移动平台，不同的BFF，在REA中")
<figcaption>不同的移动平台，不同的BFF，在REA中</figcaption>

The other model, which I have seen in use at SoundCloud, uses one BFF per type of user interface. So both the Android and iOS versions of the listener native application use the same BFF:
另一种模型，就像我在SoundCloud看到的，为每种类型的用户界面创建一个BFF。所以Android和iOS使用了同一个移动端的BFF：
![](generic-mobile-bff.jpg "为不同的移动端创建一个BFF，在SoundCloud中")
<figcaption>为不同的移动端创建一个BFF，在SoundCloud中</figcaption>

My main concern with the second model is just that the more types of clients you have using a single BFF, the more temptation there may be for it to become bloated by handling multiple concerns. The key thing to understand here though is that even when sharing a BFF, it is for the same class of user interface - so while SoundCloud's listener Native applications for both iOS and Android use the same BFF, other native applications would use different BFFs (for example the new Creator application Pulse uses a different BFF). I'm also more relaxed about using this model if the same team owns both the Android and iOS applications and own the BFF too - if these applications are maintained by different teams, I'm more inclined to recommend the more strict model. So you can see your organisation structure as being one of the main drivers to which model makes the most sense (Conway's Law wins again). It's worth noting that the SoundCloud engineers I spoke to suggested that having one BFF for both Android and iOS listener applications was something they might reconsider if making the decision again today.
我对于第二个模型的主要担忧是，随着使用单一BFF的客户端类型越多，处理多种请求可能会导致体积臃肿。这里需要理解的关键是，即使共享同一个BFF，它也适用于同一类用户界面————因此当SoundCloud的侦听器侦听到Android和iOS的客户端时，会调用移动端的BFF；侦听到其他类型的客户端时，会调用其他的BFF（例如新出的应用Pulse使用了不同的BFF）。如果是由同一个团队负责Android和iOS的客户端以及对应的BFF时，我也更乐于使用第二种模式————反之，如果是由不同的团队分别负责，我更倾向于更严格的第一种模式。因此，你可以将你的组织架构思维模型选择的主要驱动因素之一（康威定律再次获胜）。值得一提的是，当年我口中说的为Android和iOS的客户端提供一个BFF的SoundCloud工程师说，如果是今日再选择BFF可能会重新考虑方案（或许是与往日不同的组织架构？）。

One guideline that I really like from Stewart Gleadow (who in turn credited Phil Calçado and Mustafa Sezgin) was 'one experience, one BFF'. So if the iOS and Android experiences are very similar, then it is easier to justify having a single BFF. If however they diverge greatly, then having separate BFFs makes more sense.
我非常喜欢Stewart Gleadow（他反过来称赞Phil Calçado和Mustafa Sezgin）的一条指导原则，“一种体验，一个BFF”。因此，如果iOS和Android的用户体验非常相似，那么更容易证明拥有一个BFF是合理的。反之，如果两者的用户体验分歧巨大，那么拥有单独的BFF更合理。

Pete Hodgson made the observation that BFFs work best when aligned around team boundaries, so team structure should drive how many BFFs you have. So that if you have a single mobile team, you should have one BFF, but if you had separate iOS and Android teams, you'd have separate BFFs. My concern is that team structures tend to be more fluid than our system design. So if you have a single BFF for mobile, then split the team into iOS and Android specialisations, do you then have to split the BFF too? If the BFFs were already separate, then splitting the team would be easier as you can reassign ownership of the already independent asset. The interplay of BFF and team structure is important though, something we'll explore more shortly.
Pete Hodgson观察到，围绕团队架构来构建BFF时BFF的工作情况最佳，因此团队结构决定你应构建多少BFF。因此，如果你有一个单一的移动端团队，应该为此构建一个BFF；如果有分开的Android和iOS团队，应该为之分别构建BFF。我担心的是，团队结构往往比我们的系统架构设计更具流动性。所以，当你的单独的移动端团队被分割成Android和iOS两个团队时，是否也必须拆分BFF？如果BFF已经拆分，那么拆分软对将更容易，因为你可以重新分配独立资产的所有权。BFF和团队结构之间的相互作用很重要，我们稍后会对此进行深入探讨。

Often the driver towards having a smaller number of BFFs is around reusing server-side functionality to avoid too much duplication, but there are other ways to handle this which we’ll cover shortly.
通常，占驱动因素较小比重的是重用服务端功能，避免过多的冗余。但这里还有其他方案解决这一问题，我们将很快介绍。

And Multiple Downstream Services (Microservices!)
# 以及多个下游服务（微服务！）

BFFs can be a useful pattern for architectures where there are a small number of backend services. For organisations using a large number of services however they can be essential, as the need to aggregate multiple downstream calls to deliver user functionality increases drastically. In such situations it will be common for a single call in to a BFF to result in multiple downstream calls to microservices. For example, imagine an application for an e-commerce company. We want to pull back a list of items in a user’s wish list, displaying stock levels, and price:
BFF对于后端服务较少的架构来说是一种可选的模式。但是对于提供大量服务的组织来说，由于聚合多个下游调用以提供用户功能的需求急剧增加，BFF是必不可少的。在这种情况下，对BFF的单个调用，会导致对微服务的多个下游调用。例如，想象一个电子商务公司的应用程序。我们希望返回一个用户的愿望清单，显示库存水平和价格：

|||||
|---|---|---|---|
|The Brakes - Give Blood|In Stock! (14 items remaining)|$5.99|order now|
|Blue Juice - Retrospectable|Out Of Stock|$17.50|pre order|
|Hot Chip - Why Make Sense?|Going fast (2 items left)|$9.99|order now|

|||||
|---|---|---|---|
|Brakes - Give Blood|现货! (14件剩余)|$5.99|下单|
|蓝汁 - Retrospectable|售空|$17.50|预定|
|Hot Chip - Why Make Sense?|库存量少 (2件剩余)|$9.99|下单|
其实三项都是音乐专辑。。

Multiple services hold the pieces of information we want. The Wishlist service stores information about the list, and IDs of each item. The Catalog service stores the name and price of each item, and the Stock levels are stored in our inventory service. So in our BFF we'd expose a method for retrieving the full playlist, which would consist of at least 3 calls:
一个服务只包含我们需要的部分信息。其中，Wishlist服务存储清单的信息以及每件商品的ID，Catalog服务存储每件商品的名称和价格，Stock服务存储了库存数量信息。所以，在我们的BFF中，将创建一个检索完整播放列表的方法，该方法至少包含三个调用：

![](sequence.jpg "构建愿望清单，需要调用多个下游服务")
<figcaption>构建愿望清单，需要调用多个下游服务</figcaption>

From an efficiency point of view, it would be much smarter to run as many calls in parallel as possible. Once the initial call to the Wishlist service completes, ideally we'd like to then run the calls to the other services at the same time to reduce the overall call time. This need to mix calls that we want to run in parallel vs those that run in sequence can quickly become painful to manage, especially for more complex scenarios. This is one area where a reactive style of programming can help (such as that provided by RxJava or Finagle's futures system) as the composition of multiple calls becomes easier to manage.
从效率的角度来看，尽可能多地并行调用会更好。所以，一旦Wishlist服务调用完成，我们应立即调用剩余所有的服务。这种需要并行调用和顺序调用的方式混合，可能会使得代码变得难以管理，尤其是对于更复杂的场景。这就是一个反应式编程风格可以解决的领域（例如RxJava或Finagle的期货系统提供的编程风格），这种方式可以使多个调用的组合变得容易管理。

Failure modes though become important to understand. In our example above, we could insist that all downstream calls have to return in order for us to return a payload to our client. However is this sensible? Obviously we can't do anything if the Wishlist service is down, but if only the Inventory service was down, wouldn't it be better to just degrade the functionality we pass back to the client, perhaps just by removing the stock level indicator? These concerns have to be managed by the BFF itself in the first instance, but we also need to make sure that the client making the call to the BFF can interpret a partial response and render it correctly.
了解故障处理也很重要。在上面的示例中，我们可以假设所有下游调用都必然有返回，以便我们想客户端返回有效内容。然而，这是现实的吗？显然，如果Wishlist服务宕机，我们无计可施，但如果仅有Inventory服务宕机了呢？我们减少返回给客户端的数据不就可以了吗？也许只是删掉库存水平显示功能？这些问题必须由BFF自己管理，但我们还需要确保调用BFF的客户端能够解析返回的不全信息并能够正确显示。

Reuse and BFFs
# 重用和BFF

One of the concerns of having a single BFF per user interface is that you can end up with lots of duplication between the BFFs themselves. For example they may end up performing the same types of aggregation, have the same or similar code for interfacing with downstream services etc. Some people react to this by wanting to merge these back together, and so have a general-purpose aggregating Edge API service. This model has proven time and again to lead to highly bloated code with multiple concerns squashed together.
每个用户界面配一个BFF的问题之一是，BFF之间可能会出现大量冗余。例如，他们最终可能会有相同类型的功能，与下游服务会有相同或类似的代码调用。一些人想要将这些冗余整合，于是诞生了通用目的的边缘API聚合服务模型。这个模型一次又一次证明会导致代码高度臃肿，多个关注点挤在一起。

As I have said many times before, I am fairly relaxed about duplicated code across services. Which is to say that while in a single process boundary I will typically do whatever I can to refactor out duplication into suitable abstractions, I don't have the same reaction when confronted by duplication across services. This is mostly as I am often more worried about the potential for extracting shared code to lead to tight coupling between services - something I am more worried about than duplication in general. That said, there are certainly cases where this is warranted.
正如之前提及，我对于跨服务之间的代码冗余相当宽松。也就是说，在同一个流程中，我会尽可能将代码冗余抽象重构；但当遇到跨服务之间的冗余时，我就不会这样做。这主要是因为我更担心抽象重构会导致服务之间的紧密耦合，而这令我更加担心。也就是说，在某些情况下，代码冗余是有必要的。

My colleague Pete Hodgson has pointed out that when you don't have BFFs, then often the 'common' logic ends up being baked into the different clients themselves. Due to the fact that these clients use very different technology stacks, identifying the fact that this duplication is occurring can be difficult. With organisations tending to have a common technology stack for server-side components, having multiple BFFs with duplication may be easier to spot and factor out.
我的同事Pete Hodgson指出，当你没有BFF时，经常会为不同的客户端提供一些共同的功能。由于这些客户端使用了非常不同的技术堆栈，因此很难确定这种“共同”存在的事实。随着为服务端提供共同的技术堆栈，拥有多个重复的BFF可能更容易发现排除问题所在。


When the time does arise to extract shared code, there are two obvious options. The first, which is often cheapest but more fraught, is to extract a shared library of some sort. The reason this can be problematic is that shared libraries are a prime source of coupling, especially when used to generate client-libraries for calling downstream services. Nonetheless there are situations where this feels right - especially when the code being abstracted is purely a concern inside the service.
当需要提取共享代码时，有两个明显的选择：一是提取出某种类型的共享库，这通常是成本最低且更令人担忧的。这是因为，这些共享库往往就是耦合的主要来源，尤其是生成用于调用下游服务的客户端库时。尽管如此，在某些情况下是正确的选择，特别当抽取共享代码时一个服务的内部的问题时。

The other option is to extract out the shared functionality in a new service, which can work well if you can conceptualise the new service has something modeled around the domain in question.
另一种选择是提取出一个新服务的共享功能。如果你能够将新服务概念化，那么它可以很好地工作。

A variation of this approach might be to push aggregation responsibilities to services further downstream. Take the example above where we discussed rendering of a wish list. Let's imagine we are rendering a wishlist in two places - on Android, iOS Web. Each of our BFFs are making the same three calls:
这种选择的一种变体，或许是将公共功能提取出来作为一种下游服务。以上面的例子举例，我们探讨了愿望清单的实现。让我们想象一下，我们需要在Android和iOS两个地方提高愿望清单。我们的每个BFF都进行相同的三个调用：
![](bff-duplication.jpg "多个BFF实现相同的功能")
<figcaption>多个BFF实现相同的功能</figcaption>


Instead, we could change the Wishlist service to make the downstream calls for us, thereby simplifying the job for the callers:
相反，我们可以更改Wishlist服务，将其作为一种下游服务，从而简化调用：
![](removing-duplication.jpg "将公共功能作为下游服务，消除BFF中的代码冗余")
<figcaption>将公共功能作为下游服务，消除BFF中的代码冗余</figcaption>

I have to say that the same code being used in two places wouldn't necessarily cause me to want to extract out a service in this way, but I'd be certainly considering it if the transaction cost of creating a new service was low enough, or I was using it in more than a couple of places (for example maybe on the desktop web). I think the old adage of creating an abstraction when you're about to implement something for the 3rd time still feels like a good rule of thumb, even at the service level.
我不得不说，仅在两个地方使用冗余代码不一定让我想到以这种方式处理，但如果创建一个新的下游服务的成本足够低，或者我将在多个地方使用它（例如，可能在桌面web上），我肯定会考虑这样做。我认为，即使在你需要第三次实现某个东西时，进行抽象重构仍然是一个很好的经验法则。

BFFs for Desktop Web and Beyond
# 桌面端的BFF以及延伸

You can think of BFFs as just having a use in solving the constraints of mobile devices. The desktop web experience is typically delivered on more powerful devices with better connectivity, where the cost of making multiple downstream calls is manageable. This can allow your web application to make multiple calls directly to downstream services without the need for a BFF.
你可以将BFF视为解决移动端的限制条件的良药。桌面web通常功能更加强大，会运行在性能更强的设备商，在这些设备上调用多个下游服务的成本是可控的。这可以允许你的web应用程序直接调用多个下游服务，而无需BFF。

I have seen situations though where the use of a BFF for the web too can be useful. When you are generating a larger portion of the web UI on the server-side (e.g using server-side templating), a BFF is the obvious place where this can be done. It can also simplify caching somewhat as you can place a reverse proxy in front of the BFF, allowing you to cache the results of aggregated calls (although you have to make sure you set your cache controls accordingly to ensure that the aggregated content's expiry is as short as the freshest piece of content in the aggregation needs it to be). I've seen it used multiple times in fact without calling it a BFF - in fact the general-purpose API backend often grows from such a beast.
不过，我也见过在web端使用BFF的情况。当你在服务器端生成大部分web UI的时候（例如使用服务端模板），BFF很明显可以做到这一点。你也可以在BFF前放置一个反向代理，允许你缓存调用的结果（虽然你必须相应地设置缓存空间，确保聚合内容的到期时间和聚合中最新内容所需时间一样短）。实际上，我见过它多次被使用，但没有将其成为BFF--事实上，通用API后端通常是从这样一个庞然大物成长起来的。


I've seen at least one organisation use BFFs for other external parties that need to make calls. Coming back to my perennial example of a music shop, I might expose a BFF to allow 3rd parties to extract royalty payment information, provide Facebook integration or allow streaming to a range of set-top box devices:
我至少见过一个组织为第三方的接口调用提供一个BFF。回到我之前提到的音乐商店的例子，我可能hi暴露一个BFF，允许第三方提取版税支付信息，提供Facebook集成，或允许为一系列机顶盒设备提供流服务。
![](3rd-parties.jpg "使用BFF为第三方提供API")
<figcaption>使用BFF为第三方提供API</figcaption>

This approach can be especially effective as third-parties often have limited to no ability (or desire) to use or change the API calls they make. With a general-purpose API backend, you may have to keep old versions of the API around just to satisfy a small subset of your outside parties unable to make a change - with BFF this problem is substantially reduced.
这种方法相当有效，因为第三方通常无法（或者不希望）使用或修改他们所做的API调用。如果使用通用API后端，您可能不得不保留旧版本的API，以满足一小部分服务于第三方的需要————使用BFF将大大减少这一问题。

And Autonomy
# 分散定律

Quite often we see situation where one team is working on a frontend, and a different team is creating the backend services. In general, we're trying to avoid this by moving to microservices which are aligned around business verticals, but even then there are situations where this is hard to avoid. Firstly, at a certain level of scale or complexity, multiple teams need to get involved. Secondly, the depth of technical skills required to execute a good Android or iOS experience often need specialised teams.
我们通常看到这样的情况：一个团队负责前端，另一个团队扶着创建后端服务。一般来说，我们通过构建围绕业务纵向的微服务来试图避免这种情况。但即使如此，也存在难以避免的情况。首先，如果项目达到一定规模和复杂程度，就需要多个团队参与。其次，实现Android或iOS交互体验需要的专业技能需要一支专业的团队。

So teams building user interfaces are confronted with the situation that they are calling an API which another team is driving, and often than API is evolving while the user interface is being developed. The BFF can help here, especially if it is owned by the team creating the user interface. They evolve the API of the BFF at the same time as creating the front end. They can iterate both quickly. The BFF itself still needs to call the other downstream services, but this can be done without having to interrupt development of the user interface.
因此，构建用户界面的团队面临的情况是，他们正在调用另一个团队驱动开发的API，而在开发用户界面的过程中，API往往不断演变。BFF可以在这里提供帮助，特别是如果它是由创建用户界面的团队负责。他们在构建前端的同时，也完善了BFF的API。他们可以快速迭代。BFF本身仍然需要调用其他下游服务，但这可以在不中断用户界面开发的情况下完成。
![](team-ownership.jpg "使用BFF的团队的所有权界限")
<figcaption>使用BFF的团队的所有权界限</figcaption>

The other benefit of using a BFF aligned along team boundaries like this is that the team creating the interface can be much more fluid in thinking about where functionality lives. For example they could decide to push functionality on to the server-side to promote reuse in the future and simplify a native mobile application, or to allow for the faster release of new functionality (as you can bypass the app store review processes). This decision is one that can be made by the team in isolation if they own both the mobile application and the BFF - it doesn't require any cross-team coordination.
使用这样的与团队架构一致的BFF的好处是，创建界面的团队在思考功能时会更加灵活。例如，他们可以决定将功能推到服务端，以促进未来的重用并简化本地移动端程序，或者允许更快地发布新功能（因为你可以绕过应用商店审查流程）。如果团队同时拥有移动端和BFF，则可以单独做出这一决定————这不需要任何团队协调。

General Perimeter Concerns
# 一般周边问题

Some people use BFFs to implement generic perimeter concerns, such as authentication/authorisation or request logging. I'm torn about this. On the one hand, much of this functionality is so generic that I'd be inclined to implement it using another layer sitting further upstream, perhaps using something like a tier of Nginx or Apache servers. On the other hand, such an additional layer can't help but add latency. BFFs are often used in microservice environment where we are already very sensitive about latency due to the high number of network calls being made. Also, the more layers you have to deploy to make a production-like stack can make development and test more complex - having all of these concerns inside the BFF as a more self-contained solution can be attractive as a result:
一些人使用BFF来解决一般的外围问题，例如身份验证/授权或请求日志记录。我为此感到难过。一方面，这种功能的大部分是通用的，所以我倾向于使用更上游的一层来实现它，可能使用Nginx或者Apache之类的东西。另一方面，这样的附加层会增加延迟。BFF通常用于微服务环境，在微服务环境中，由于进行了大量的网络调用，我们对延迟非常敏感。此外，为了制作类似生产的堆栈，你必须部署的层越多，开发和测试就越复杂。因此，将所有这些问题作为一个更独立的解决方案放在BFF中可能会更有吸引力：
![](perimeter-layer.jpg "使用网络应用实现一般的外围问题")
<figcaption>使用网络应用实现一般的外围问题</figcaption>

As we discussed earlier, another way to factor out this duplication could be to use a shared library. Assuming your BFFs are using the same technology, this shouldn't be too difficult, although the usual caveats about shared libraries in a microservice architecture apply.
正如我们之前讨论的，消除这种冗余的另一种方案就是使用共享库。假设你的BFF使用相同的技术，这应该不会太困哪，尽管微服务架构中共享库的常见警告仍然适用。

When To Use
# 何时应用

For an application which is only providing a web UI, I suspect a BFF will only make sense if and when you have a significant amount of aggregation required on the server-side. Otherwise, I think other UI composition techniques can work just as well without requiring an additional server-side component (I'll hopefully talk about those soon).
对于只提供web UI的应用程序，我怀疑只有在服务端需要大量聚合时，BFF才有意义。否则，我认为其他UI组合技术也可以正常工作，而不需要额外的服务端组件（我希望很快就会讨论这些）。

The moment that you need to provide specific functionality for a mobile UI or third party though, I would strongly consider using a BFFs for each party from the outset. I might reconsider if the cost of deploying additional services is high, but the separation of concerns that a BFF can bring make it a fairly compelling proposition in most cases. I'd be even more inclined to use a BFF if there is a significant separation between the people building the UI and downstream services, for reasons outlined above.
当你需要为移动端或第三方提供特定功能时，我会强烈考虑从一开始就为每一方构建一个BFF。如果部署额外服务的成本很高，我可能会重新考虑，但BFF可能带来的消解耦合使它在大多数情况下是一个相当有说服力的建议。如果构建UI的人员和下游服务之间存在明显的分离，处于上述原因，我更倾向于使用BFF。

Further Reading (And Viewing)
# 延伸阅读（或访谈）

- Since I wrote this piece, Lukasz Plotnicki from ThoughtWorks has published a great article on SoundCloud's use of the BFF pattern
- Lukasz being interviewed about the pattern (and other things) on a recent episode of the Software Engineering Podcast.
- Bora Tunca from SoundCloud also goes into more detail during a talk at microxchg 2016.

- 在我写了这篇文章之后，Lukasz Plotnicki在ThoughtWorks发了[一篇文章](https://www.thoughtworks.com/insights/blog/bff-soundcloud)，讲述了在SoundCloud如何使用BFF模式
- Lukasz在最近一集的Software Engineering Podcast中接受了关于模式（和其他事情）的[采访](http://softwareengineeringdaily.com/2016/02/04/moving-to-microservices-at-soundcloud-with-lukasz-plotnicki/)。
- SoundCloud的Bora Tunca也在[一次访谈](https://www.youtube.com/watch?v=jfN6HOgURXM)中讲述了一些细节

Conclusion
# 结论

Backends For Frontends solve a pressing concern for mobile development when using microservices. In addition they provide a compelling alternative to the general-purpose API backend, and many teams make use of them for purposes other than just mobile development. The simple act of limiting the number of consumers they support makes them much easier to work with and change, and helps teams developing customer-facing applications retain more autonomy.
Backends For Frontends解决了使用微服务时移动端开发的一个紧迫问题。此外，它们为通用API后端提供了一个引人注目的替代方案，许多团队将其用于移动端开发之外的其他目的。简单地限制客户端支持的用户数量使他们更容易处理和更改，并帮助开发面向客户的应用程序的团队在开发面向客户的应用程序时保留更多的自主权。

Thanks go to Matthias Käppler, Michael England, Phil Calçado, Lukasz Plotnicki, Jon Eaves, Stewart Gleadow and Kristof Adriaenssens for their help in researching this article, and Giles Alexander, Ken McCormack, Sriram Viswanathan, Kornelis Sietsma, Hany Elemary, Martin Fowler, Vladimir Sneblic, and Pete Hodgson for general feedback. I'd really appreciate any further feedback too, so feel free to leave a comment below!
感谢Matthias Käppler、Michael England、Phil Calçado、Lukasz Plotnicki、Jon Eaves、Stewart Gleadow和Kristof Adriaenssens在研究本文时提供的帮助，感谢Giles Alexander、Ken McCormack、Sriram Viswanathan、Kornelis Sietsma、Hany Elemary、Martin Fowler、Vladimir Sneblic和Pete Hodgson提供的一般反馈。我也非常感谢任何进一步的反馈，所以欢迎在下面留言！