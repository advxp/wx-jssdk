var xExtend = require('define-js-class');
var crypto = require('crypto');
var https = require('https');
var async = require('async');
var WxJsSDK = xExtend(function () {}, {
	_constructor: function (appId, appSecret) {
		this.appId = appId;
		this.appSecret = appSecret;
	},

	genWxNonceStr : function () {
		var len = len || 32;
	　　var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
	　　var maxPos = chars.length;
	　　var pwd = '';
	　　for (i = 0; i < len; i++) {
	　　　　pwd += chars.charAt(Math.floor(Math.random() * maxPos));
	　　}
	　　return pwd;
	},

	getSignature: function (data) {
		var ar = [];
		for (var i in data) {
			if (data.hasOwnProperty(i)) {
				ar.push(i);
			}
		}
		console.log(data);
		ar.sort();
		var ret = [];
		for (var i = 0; i < ar.length; i++) {
			ret.push(ar[i] + '=' + data[ar[i]]);
		}
		var str = ret.join('&');
		console.log(str);
	    var md5sum = crypto.createHash('sha1');
	    md5sum.update(str);
	    str = md5sum.digest('hex');
		return str;
	},

	getAccessToken: function (cb) {
		if (!WxJsSDK.wxAccessToken) {
			var appid = this.appId;
			var secret = this.appSecret;
			var options = {
		    	hostname: 'api.weixin.qq.com',
		    	port: 443,
		    	path: '/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret,
		    	method: 'GET'
		    };
		    var req = https.request(options, function(res) {
		        var bdy = [];
		    	res.on('data', function(d) {
		            bdy.push(d);
		    	});
		    	res.on('end', function () {
		            var token = bdy.join('');
		            console.log('get wx toke ok[' + token + ']');
		            var tk = JSON.parse(token);
		            cb (null, WxJsSDK.wxAccessToken = tk.access_token);
		            setTimeout(function () {
		            	WxJsSDK.wxAccessToken = '';
		            }, 1000 * 60 * 110);
		    	});
		    });
		    req.end();
		    req.on('error', function(e) {
		    	console.error(e);
		    });
		}
		else {
			cb(null, WxJsSDK.wxAccessToken);
		}
	},

	getJsApiTicket: function (token, cb) {
		if (!WxJsSDK.wxJsApiTicket) {
			var options = {
		    	hostname: 'api.weixin.qq.com',
		    	port: 443,
		    	path: '/cgi-bin/ticket/getticket?access_token=' + token + '&type=jsapi',
		    	method: 'GET'
		    };

		    var req = https.request(options, function(res) {
		        var bdy = [];
		    	res.on('data', function(d) {
		            bdy.push(d);
		    	});
		    	res.on('end', function () {
		            var token = bdy.join('');
		            console.log('get wx js api ticket ok[' + token + ']');
		            var tk = JSON.parse(token);
		            cb (null, WxJsSDK.wxJsApiTicket = tk.ticket);
		            setTimeout(function () {
		            	WxJsSDK.wxJsApiTicket = '';
		            }, 1000 * 60 * 110);
		    	});
		    });
		    req.end();
		    req.on('error', function(e) {
		    	console.error(e);
		    });
		}
		else {
			cb(null, WxJsSDK.wxJsApiTicket);
		}
	},

	getJsApiConfig: function (url, cb) {
		var t = this;
		var ret = {
			timestamp: Math.floor(new Date().getTime() / 1000),
			noncestr: t.genWxNonceStr(),
			url: decodeURIComponent(url)
		};

		async.waterfall([
			// 获取token
			function (cb) {
				t.getAccessToken(function (err, token) {
					cb (err, token);
				});
			},

			// 获取ticket
			function (token, cb) {
				t.getJsApiTicket(token, function (err, ticket) {
					cb (null, ticket);
				});
			},

			// 生成签名
			function (ticket, cb) {
				ret.jsapi_ticket = ticket;
				ret.signature = t.getSignature(ret);
				ret.appId = t.appId;
				delete ret.jsapi_ticket;
				delete ret.url;
				cb(null, ret);
			}
		], function (err, rst) {
			if (err) {
				console.error(err);
				cb (err);
			}
			else {
				cb (null, rst)
			}
		});
	},

	'static': {
		getInstance: function () {},
		'wxAccessToken': '',
		'wxJsApiTicket': ''
	}
});

module.exports = WxJsSDK;
