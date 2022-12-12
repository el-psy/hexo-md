const lodash = require('lodash');
const moment = require('moment')

moment.updateLocale('zh-cn', {
    months: [
      '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'
    ]
  })
moment.locale()

hexo.extend.helper.register('get_category', function (categories, url_for, path) {
	let orderby = 'name'
	let order = 1
	let depth = 0;

	const prepareQuery = parent => {
	  const query = {};
  
	  if (parent) {
		query.parent = parent;
	  } else {
		query.parent = {$exists: false};
	  }
	  return categories.find(query).sort(orderby, order).filter(cat => cat.length);
	};

	// let posts_buff = []
	// posts.forEach((item)=> {
	// 	id = ''
	// 	item.categories.forEach((i)=>{
	// 		id = id + ' ' + i._id
	// 	})
	// 	id = id.slice(1)
	// 	posts_buff.push({title: item.title, path: url_for(item.path), id:id});
	// });

	// console.log(path.split('/').slice(1))

	const flatList = (level, url, parent) => {
	  let result = {categories:{}, 'url':url};
	  prepareQuery(parent).forEach((cat, i) => {
		// console.log(url_for(cat.path));

		if (!depth || level + 1 < depth) {

		  result.categories[cat.name] = flatList(level + 1, url_for(cat.path), cat._id)
		  // {categories: flatList(level + 1, url_for(cat.path), cat._id), url: url_for(cat.path)}
		}
	  });
  
	  return result;
	};


	categories = flatList(0, '/categories')
	get_now_cat = function(categories, path){
		path = path.split('/')
		path = path.slice(0, path.length-1)
		path = path.slice(1)
		// console.log(path)
		// console.log(categories)
		let cat = categories
		if(path.length<=1){
			parent_name = 'root'
		}else {
			parent_name = path[path.length-2] 
		}
		let parent = {url:'/categories/'+path.slice(0, path.length-1).join('/'), name:parent_name}
		// console.log(parent)
		for(let p of path){
			cat = cat.categories[p]
			// console.log(cat)
		}
		return [cat, parent]
	}

	let [cat, parent] =  get_now_cat(categories, path)



	generate_ul = function(cat, parent){
		let pre = '<ul class=category-list>'
		let end = '</ul>'

		let mid = ''
		// console.log(cat)
		cat = cat.categories
		for(let c_name in cat){
			mid += `<li class="category-list-item"> <a href="${cat[c_name].url}" class="category-list-link waves-effect waves-button">${c_name}</a> </li>`
		}

		parent = `<div class="categorate-root-container"><a href="${parent.url}" class="category-list-link waves-effect waves-button">${parent.name}</a></div>`

		return parent+pre+mid+end
	}
	// console.log(parent)

	cat_ul = generate_ul(cat, parent)
	return cat_ul

})

hexo.extend.helper.register('data_format', (date, format)=>{
	return moment(date).format(format)
})

hexo.extend.filter.register('template_locals', locals => {
	locals._ = lodash;
});