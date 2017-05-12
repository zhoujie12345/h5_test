// 根据传递的参数选择器内容，返回查找到的页面DOM元素
// 参数：
// 	selector:选择器，可取以下值
// 		#id
// 		.className
// 		tagName
//	context:查找元素的上下文，即 DOM 元素对象，默认为 document
function $(selector, context){
	context = context || document;
	if (selector.indexOf("#") === 0) // 根据id查找元素
		return document.getElementById(selector.slice(1));
	if (selector.indexOf(".") === 0) // 根据类名查找元素
		return getByClassName(selector.slice(1), context);
		// return context.getElementsByClassName(selector.slice(1));
	return context.getElementsByTagName(selector); // 根据元素名查找
}

// 解决 getElementsByClassName 兼容问题
function getByClassName(className, context) {
	context = context || document;
	if (document.getElementsByClassName) // 浏览器支持使用 getElementsByClassName
		return context.getElementsByClassName(className);

	/* 不支持使用 getElementsByClassName */
	// 保存查找到的元素的数组
	var result = [];
	// 查找 context 后代的所有元素
	var allTags = context.getElementsByTagName("*");
	// 遍历所有的元素
	for(var i = 0, len = allTags.length; i < len; i++) {
		// 获取当前遍历元素使用的所有 class 类名
		var classNames = allTags[i].className.split(" ");
		// 遍历当前元素的所有类名，和待查找的类名比较
		for (var j = 0, l = classNames.length; j < l; j++) {
			if (classNames[j] == className) { // 当前所在遍历的元素是要查找出来的其中一个
				result.push(allTags[i]);
				break;
			}
		}
	}
	// 返回查找结果
	return result;
}

// 返回指定element元素的CSS属性attr的属性值
// css($("#inner"), "top", "50px");
// css($("#inner"), "left", "200px");
// css($("#inner"), {top:"50px", left:"200px"});
function css(element, attr, value) {
	if (typeof attr === "object") { // 设置element元素各CSS属性值
		for (var prop in attr) {
			element.style[prop] = attr[prop];
		}
	} else if (typeof attr === "string" && typeof value !== "undefined"){ // 设置element元素attr对应属性的属性值
		element.style[attr] = value;
	} else { // 获取element元素CSS属性值
		return window.getComputedStyle 
				? getComputedStyle(element)[attr]
				: element.currentStyle[attr];
	}
}

// 获取指定元素在文档中的绝对定位，返回定位坐标对象
// 该对象有 top 与 left 两个属性
// 也可用于设置元素在文档中的绝对定位，传递定位坐标对象
// element: 指定DOM元素
// coordinates:设置的定位坐标对象，包含top与left两个属性
function offset(element, coordinates) {
	var _top = 0,
		_left = 0,
		current = typeof coordinates === "undefined" 
					? element 
					: element.offsetParent; // 待求解文档绝对定位元素
	// 循环求解元素在文档中绝对定位
	while (current !== null) {
		_top += current.offsetTop;
		_left += current.offsetLeft;
		current = current.offsetParent;
	}

	if (typeof coordinates === "undefined") // 获取元素在文档中绝对定位
		return {
			top:_top,
			left:_left
		};
	else // 设置元素在文档中绝对定位
		css(element, {
			top:coordinates.top - _top+"px",
			left:coordinates.left - _left+"px"
		});
}

// 获取指定元素在其有定位父元素中绝对定位位置
function position(element){
	return {
		top : element.offsetTop,
		left : element.offsetLeft
	};
}

// 注册指定元素的事件监听
// 事件冒泡
/*function on(element, type, callback) {
	if (element.addEventListener) { // 支持使用 addEventListener方法
		// if (type.slice(0, 2) === "on")
		if (type.indexOf("on") === 0)
			type = type.slice(2);
		element.addEventListener(type, callback, false);
	} else { // 不支持，则使用 attachEvent
		if (type.indexOf("on") !== 0)
			type = "on" + type;
		element.attachEvent(type, callback);
	}
}*/

/* 简易事件委派版本 */
// on($("#box"), "click", ".test", function(){
// 	console.log(this);
// })
function on(element, type, selector, callback) {
	var _callback;
	if (typeof selector === "string") {
		_callback = function(e){
			e = e || event;
			var src = e.target || e.srcElement;
			console.log("target:" , src);
			var __callback = callback.bind(src);
			if (selector.indexOf(".") === 0) {
				var classNames = src.className.split(" ");
				var index = inArray(selector.slice(1), classNames);
				if (index !== -1) {
					__callback(e);
				}
			} else if (src.nodeName.toLowerCase() === selector.toLowerCase()) {
				__callback(e);
			}
		};
	} else if (typeof selector === "function") {
		_callback = selector;
	}

	if (element.addEventListener) { // 支持使用 addEventListener方法
		if (type.indexOf("on") === 0)
			type = type.slice(2);
		element.addEventListener(type, _callback, false);
	} else { // 不支持，则使用 attachEvent
		if (type.indexOf("on") !== 0)
			type = "on" + type;
		element.attachEvent(type, _callback);
	}
}

// 解除指定元素绑定的事件监听
function off(element, type, callback) {
	if (element.removeEventListener) { // 支持使用 removeEventListener方法
		if (type.indexOf("on") === 0)
			type = type.slice(2);
		element.removeEventListener(type, callback, false);
	}else { // 不支持，则使用 detachEvent
		if (type.indexOf("on") !== 0)
			type = "on" + type;
		element.detachEvent(type, callback);
	}
}

// 保存/读取cookie信息
// key: cookie名称
// value: cookie值，可选，不为 undefined 则表示设置 cookie
// options: 可选，保存 cookie 时的配置参数
// options = {
// 	expires:7, // 失效时间，如果是数字，则表示指定天数后失效，可以取数字或 Date 对象
// 	path:"/", // 路径
// 	domain:"", // 域名
// 	secure:true // 是否安全链接
// }
function cookie(key, value, options) {
	if (typeof value === "undefined"){ // 读取cookie
		// 将所有 cookie 保存到数组中，每个元素的格式如：key=value
		var cookies = document.cookie.split("; ");
		// 遍历数组中的每个 cookie 字符串结构
		for (var i = 0, len = cookies.length; i < len; i++) {
			// 以 = 号分隔字符串，返回数组中第一个元素为 cookie名，第二个元素为 cookie 值
			var cookie = cookies[i].split("=");
			// 判断当前cookie名与待查找的cookie名称是否一致
			if (key === decodeURIComponent(cookie.shift()))
				return decodeURIComponent(cookie.join("="));
		}

		// 找不到 cookie，则返回 null
		return null;
	} 

	// 保存 cookie
	var cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value);
	// 是否有其它设置，比如失效时间
	options = options || {};
	// 失效时间
	if (typeof options.expires !== "undefined") {
		if (typeof options.expires === "number") { // 失效时间是数字时间
			var date = new Date()
			date.setDate(date.getDate() + options.expires);
			cookie += ";expires=" + date.toUTCString();
		} else if (typeof options.expires === "object") {
			cookie += ";expires=" + options.expires.toUTCString();
		}
	}

	// 路径
	if (options.path)
		cookie += ";path=" + options.path;
	// 域名
	if (options.domain)
		cookie += ";domain=" + options.domain;
	// 安全链接
	if (options.secure)
		cookie += ";secure";

	// 保存 cookie
	document.cookie = cookie;
}

// 删除 cookie
function removeCookie(key, options) {
	options = options || {};
	// 删除时，将 cookie 失效时间设置为当前时间之前某一刻
	options.expires = -1;
	// 覆盖保存 cookie 即实现删除
	cookie(key, "", options);
}

// 查找指定value在数组array中的下标
function inArray(value, array) {
	if (Array.prototype.indexOf) // 支持 indexOf 方法使用
		return array.indexOf(value);

	for (var i = 0, len = array.length; i < len; i++) {
		if (value === array[i])
			return i;
	}

	return -1;
}

// 去掉字符串前后空白
function trim(str) {
	if (String.prototype.trim) // 支持使用字符串对象的 trim 方法
		return str.trim();

	var reg = /^\s+|\s+$/g;
	return str.replace(reg, "");
}

// 运动框架
// 参数说明：
//		element:
// 		options:
//		speed: 
//		fn: 运动结束后要执行的函数，可选
function animate(element, options, speed, fn) {
	// 先取消在 element 元素上之前已有的运动动画计时器
	clearInterval(element.timer);

	// 求解运动各属性初始值
	var start = {}, orgion = {};
	for (var attr in options) {
		start[attr] = parseFloat(css(element, attr));
		orgion[attr] = options[attr] - start[attr];
	}

	// 记录开始运动前一刻时间毫秒值
	var startTime = +new Date(); // Date.now()

	// 启动计时器，开始实现运动动画效果
	element.timer = setInterval(function(){
		// 计算运动经过的时长（毫秒）
		var elapsed = Math.min(+new Date() - startTime, speed);
		// 为每个运动属性计算当前运动值
		for (var attr in options) {
			var result = elapsed * orgion[attr] / speed + start[attr];
			// 设置元素对应 attr CSS属性值
			element.style[attr] = result + (attr === "opacity" ? "" : "px");
			if (attr === "opacity")
				element.style.filter = "alpha(opacity="+(result*100)+")";
		}
		// 判断是否运动结束
		if (elapsed === speed){
			clearInterval(element.timer);
			// 运动执行结束，判断是否有继续要执行的函数，有，则调用执行
			fn && fn();
		}
	}, 1000/60);
}

// 淡入
function fadeIn(element, speed, fn) {
	element.style.opacity = 0;
	element.style.display = "block";

	animate(element, {opacity:1}, speed, fn);
}

// 淡出
function fadeOut(element, speed, fn) {
	animate(element, {opacity:0}, speed, function(){
		element.style.display = "none";
		fn && fn();
	})
}

// 封装ajax操作函数
// 参数 options 为可配置项内容
// options = {
// 	type : "get|post", // 请求方式，默认为 get
// 	url : "http://xxx", // URL
// 	async : true, // 是否异步，默认为异步
// 	data : {username:""}, // 需要向服务器提交的数据
// 	dataType : "text|json", // 预期从服务器返回的数据格式
// 	headers : {"name":"value"}, // 额外设置的请求头
// 	success : function(respData){}, // 请求成功时执行的函数
// 	error : function(errMsg){}, // 请求失败时执行的函数
// 	complete : function(xhr){} // 不论成功/失败都会执行的函数
// }
function ajax(options) {
	options = options || {};
	// 判断是否有连接的URL
	var url = options.url;
	if (!url) // 如果没有连接的URL，则结束函数执行
		return;

	// 创建核心对象
	var xhr;
	if (window.XMLHttpRequest)
		xhr = new XMLHttpRequest();
	else
		xhr = new ActiveXObject("Microsoft.XMLHTTP");
	// 设置请求方式
	var method = options.type || "get";
	// 设置是否异步
	var async = (typeof options.async === "boolean") ? options.async : true;
	// 判断是否有向服务器传递参数
	var param = null; // 保存查询字符串的变量
	if (options.data) { // 有传递参数
		var array = []; // 保存键值对结构的数组
		for (var attr in options.data) {
			array.push(attr + "=" + options.data[attr]); // ["key=value", "key=value"]
		}
		param = array.join("&"); // key=value&key=value&key=value
	}
	// 如果是 get 请求，则将查询字符串连接在 URL 后
	if (method === "get" && param){
		url += "?" + param;
		param = null;
	}
	// 建立连接
	xhr.open(method, url, async);
	// post传递参数时，设置请求头 Content-Type
	if (method === "post"){
		// 设置请求头信息
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	}
	// 其它额外设置的请求头
	if (options.headers) {
		for (var attr in options.headers) {
			xhr.setRequestHeader(attr, options.headers[attr]);
		}
	}
	// 发送请求
	xhr.send(param);
	// 处理响应
	xhr.onreadystatechange = function(){
		if (xhr.readyState === 4) {
			// 无论成功或失败都会执行的函数
			options.complete && options.complete(xhr);

			if (xhr.status === 200) { // 成功
				var data = xhr.responseText;
				// 判断配置中预期从服务器返回的数据类型
				// 如果是 json，则调用 JSON.parse() 解析
				if (options.dataType === "json")
					data = JSON.parse(data);
				// 处理响应数据逻辑
				options.success && options.success(data);
			} else { // 失败
				options.error && options.error(xhr.statusText);
			}
		}
	}
}

// 使用 Promise 对象实现ajax异步操作
function get(_url) {
	return new Promise(function(resolve, reject){
		ajax({
			url : _url,
			type : "get",
			dataType : "json",
			success : function(data){
				resolve(data);
			},
			error : function(errorMsg){
				reject(errorMsg);
			}
		});
	});
}