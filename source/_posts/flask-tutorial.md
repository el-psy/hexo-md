---
title: flask-tutorial
date: 2022-11-29 14:14:23
categories:
	- 后端
	- flask
tags:
	- 后端
	- flask
---

# 起因

最近简单看了flask的文档。  
然后把里面[教程](https://dormousehole.readthedocs.io/en/latest/tutorial/index.html)的那一章敲了一遍。  
敲完的代码放到了[这里](https://github.com/el-psy/flask-tutorial)。
但是只是浮光掠影，对于flask还是不甚了解。
所以准备将这些代码中不懂的部分简单总结一下。虽然总结之后还是不懂，但总是方便查找了。

# 概括

flask大概就是通过装饰器装饰函数，使用url调用该函数，返回值可以通过模板的方式合成html页面。  
至于项目。  
可以分为4个部分：
- ```__init__.py```主体部分。包括配置引入。
- ```auth.py```认证部分。包括登录注册注销，以及一个装饰器，用于那些需要登录才能访问的url。
- ```db.py```数据部分。包括连接数据库，初始化数据库，关闭数据库连接之类的。
- ```blog.py```blog部分。主要功能所在。包括增加修改删除功能。

# \_\_init\_\_

```python
import os
from flask import Flask

def create_app(test_config=None):
	app = Flask(__name__, instance_relative_config = True)
	app.config.from_mapping(
		SECRET_KEY = 'dev',
		DATABASE = os.path.join(app.instance_path, 'flask.sqlite'),
	)
	if test_config is None:
		app.config.from_pyfile('config.py', silent = True)
	else:
		app.config.from_mapping(test_config)

	try:
		os.makedirs(app.instance_path)
	except OSError:
		pass

	@app.route('/hello')
	def hello():
		return 'Hello, World!'

	from . import db
	db.init_app(app)
	
	from . import auth
	app.register_blueprint(auth.bp)

	from . import blog
	app.register_blueprint(blog.bp)
	app.add_url_rule('/', endpoint='index')

	return app
```

1. ```instance_relative_config```
> 配置文件路径相关。默认是“相对于应用的根目录”，这个值为```True```的时候为“相对于实例文件夹”。

2. SECRET_KEY
> 说是秘钥，但也没有明显发现其他代码哪里用到了。或许是```auth.py```中的```generate_password_hash```之类的？

3. DATABASE
> 数据库文件路径。在```db.py```中使用。

4. app.add_url_rule
> 完全看不懂

# db

```python
import sqlite3
import click
from flask import current_app, g
from flask.cli import with_appcontext

def get_db():
	if 'db' not in g:
		g.db = sqlite3.connect(
			current_app.config['DATABASE'],
			detect_types=sqlite3.PARSE_DECLTYPES
		)
		g.db.row_factory = sqlite3.Row

	return g.db

def close_db(e=None):
	db = g.pop('db', None)
	if db is not None:
		db.close()

def init_db():
	db = get_db()
	with current_app.open_resource('schema.sql') as f:
		db.executescript(f.read().decode('utf-8'))

@click.command('init-db')
@with_appcontext
def init_db_command():
	init_db()
	click.echo('Initialized the database.')

def init_app(app):
	app.teardown_appcontext(close_db)
	app.cli.add_command(init_db_command)
```

1. current_app
> 类型是LocalProxy
> 像全局变量一样工作，但只能在处理请求期间且在处理它的线程中访问
> 返回的栈顶元素不是应用上下文，而是flask的应用实例对象
> Flask 应用对象app具有config的属性，这些属性对于在视图或者在命令调试中访问很方便。但是现在项目的模块导入app 实例会容易出现循环导入的问题
> Flask 通过应用情景解决了这个问题，不是直接引用一个app，而是使用current_app 代理，该代理指向处理当前活动的应用；
> 至于到底是什么我也不知道。。。感谢百度。

2. g
> flask的全局变量

3. g.db.row_factory = sqlite3.Row
> 这样查询会返回 Row 对象，而不是字典。 Row 对象是 namedtuple ，因 此既可以通过索引访问也以通过键访问。

4. current_app.open_resource
> 打开文件。相对于应用的相对路径。在```__init__.py```中设置过。

5. with_appcontext
> 包装回调，以确保它能够与脚本的应用程序上下文一起执行。如果回调直接注册到app.cli对象，则默认情况下，除非禁用此函数，否则将使用此函数包装回调。

6. app.teardown_appcontext
> 注册应用程序上下文结束时要调用的函数。当弹出请求上下文时，通常也会调用这些函数。

7. init_app
> 最终注册的函数。

# auth

```python
bp = Blueprint('auth', __name__, url_prefix='/auth')
```

1. 所谓的蓝图
> name="auth" 蓝图的名称。将在每个端点名称前加上前缀。
> import_name=\_\_name\_\_ 蓝图包的名称，通常为__name__。这有助于定位蓝图的root_path。
> url_prefix="/auth" 一个路径，用于在蓝图的所有URL前加上前缀，使其与应用程序的其他路径不同。

```python
@bp.route('/register', methods=['GET', 'POST'])
def register():
	if request.method == 'POST' :
		username = request.form['username']
		password = request.form['password']
		db = get_db()
		error = None
		if not username:
			error = 'Username is required.'
		elif not password:
			error = 'Password is required.'
		if error is None:
			try:
				db.execute(
					'insert into user (username, password) values (?, ?)',
					(username, generate_password_hash(password)),
				)
				db.commit()
			except db.IntegrityError:
				error = f"User {username} is already registered."
			else:
				return redirect(url_for('auth.login'))
		flash(error)
	return render_template('auth/register.html')
```

1. request
> 请求体。试试文档api中的```Incoming Request Data```？
2. db.execute
> 会进行字符串转换的。。
3. generate_password_hash
> 加密
4. flash
> 所谓的error提示。其实会在模板中会有体现。

```python
@bp.route('/login', methods=['GET', 'POST'])
def login():
	if request.method == 'POST':
		username = request.form['username']
		password = request.form['password']
		db = get_db()
		error = None
		user = db.execute(
			'select * from user where username = ?',
			(username,)
		).fetchone()
		if user is None:
			error = 'Incorrect username.'
		elif not check_password_hash(user['password'], password):
			error = 'Incorrect password.'
		if error is None:
			session.clear()
			session['user_id'] = user['id']
			return redirect(url_for('index'))

		flash(error)

	return render_template('auth/login.html')
```

1. check_password_hash
> 验证加密。
2. session
> session和cookie的作用有点类似，都是为了存储用户相关的信息的，区别在于 session 是保存在服务器端的，用 session_id 来标识用户。而 cookie 是保存在客户端，session 的出现，是为了解决 cookie 存储数据不安全的问题的。
> flask中的session机制是：把敏感数据经过加密后放入session中，然后再把session存放到cookie中，下次请求的时候，再从浏览器发送过来的cookie中读取session，然后再从session中读取敏感数据，并进行解密，获取最终的用户数据。
> 使用session需要设置SECRET_KEY

```python
@bp.before_app_request
def load_logged_in_user():
	user_id = session.get('user_id')
	if user_id is None:
		g.user = None
	else:
		g.user = get_db().execute(
			'select * from user where id = ?',
			(user_id,)
		).fetchone()
```

1. before_app_request
> 这样的函数在每次请求之前执行，即使在蓝图之外。
2. g
> 别问我为什么需要将user数据设置在g里。我也不知道。。。
> 2.1. 生命周期
> 请求过来创建，请求结束销毁；
> 仅适用于单次请求，g的生命周期即一个请求的生命周期
> 注：和session不同，session是多个请求都可以使用的
> 2.2. g是什么
> g相当于单次请求中的“全局变量”，能在单词请求中调用，但是和其他请求是互相隔离的
> 可以参考上下文管理部分，g的创建与销毁流程理解
> 2.3. g能做什么
> 可以在单次请求中定义一些值和操作，随着本次请求结束而销毁；
> 如，权限管理

```python
@bp.route('/logout')
def logout():
	session.clear()
	return redirect(url_for('index'))
```

1. session.clear()
> 清空session。cookie也随之清空。

```python
def login_required(view):
	@functools.wraps(view)
	def wrapped_view(**kwargs):
		if g.user is None:
			return redirect(url_for('auth.login'))
		return view(**kwargs)
	return wrapped_view
```

1. functools.wraps
> 首先这是一个装饰器，用于需要经过验证才能访问的url的。
> 标准库 functools 中的 wrap 函数用于包装函数, 不改变原有函数的功能, 仅改变原有函数的一些属性, 例如 \_\_name\_\_, \_\_doc\_\_, \_\_annotations\_\_ 等属性
> 我也不知道在这里使用到底有什么用。。

# blog

```python
from flask import ( Blueprint, flash, g, redirect, render_template, request, url_for )
from werkzeug.exceptions import abort

from flaskr.auth import login_required
from flaskr.db import get_db

bp = Blueprint('blog', __name__)

@bp.route('/')
def index():
	db = get_db()
	posts = db.execute(
		'select p.id, title, body, created, author_id, username from post p join user u on p.author_id = u.id order by created desc'
	).fetchall()
	return render_template('blog/index.html', posts = posts)

@bp.route('/create', methods=['GET', 'POST'])
@login_required
def create():
	if request.method == 'POST':
		title = request.form['title']
		body = request.form['body']
		error = None

		if not title:
			error = 'Title is required.'

		if error is not None:
			flash(error)
		else:
			db = get_db()
			db.execute(
				'insert into post (title, body, author_id) values (?,?,?)',
				(title, body, g.user['id'])
			)
			db.commit()
			return redirect(url_for('blog.index'))
	return render_template('blog/create.html')

def get_post(id, check_author = True):
	post = get_db().execute(
		'select p.id, title, body, created, author_id, username from post p join user u on p.author_id = u.id where p.id = ?',
		(id,)
	).fetchone()
	if post is None:
		abort(404, f'Post id {id} doesn\'t exist.')
	if check_author and post['author_id'] != g.user['id']:
		abort(403)
	return post

@bp.route('/<int:id>/update', methods=['GET', 'POST'])
@login_required
def update(id):
	post = get_post(id)
	if request.method == 'POST':
		title = request.form['title']
		body = request.form['body']
		error = None
		if not title:
			error = 'Title is required.'
		if error is not None:
			flash(error)
		else:
			db = get_db()
			db.execute(
				'update post set title = ?, body = ? where id = ?',
				(title, body, id)
			)
			db.commit()
			return redirect(url_for('blog.index'))
	return render_template('blog/update.html', post = post)

@bp.route('/<int:id>/delete', methods=['POST'])
@login_required
def delete(id):
	get_post(id)
	db = get_db()
	db.execute(
		'delete from post where id = ?', (id,)
	)
	db.commit()
	return redirect(url_for('blog.index'))
```

最后的blog.py并没有什么要讲的。就是简单的crud。。