var xExtend = require('define-js-class');
var crypto = require('crypto');
var async = require('async');
var request = require('request');

var WxJsSDK = xExtend(function () {}, {
    ticketExpiredTime: null,
    accessTokenExpiredTime: null,
    disTime: 5 * 60 * 1000,
    cachedTicket: '',
    cachedAccessToken: '',
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

	/**
	 * 应用层应该自行对获取到token进行缓存防止到达微信的日访问上限而被封锁
	 * 可以使用memcached、redis、mongodb等你熟悉的任何存储工具进行缓存
	 * 微信默认的实效是2个小时，你需要注意缓存的淘汰时间
	 */
	getAccessToken: function (cb) {
        var t = this;
		var appid = this.appId;
		var secret = this.appSecret;
        if (Date.now() < t.accessTokenExpiredTime && t.cachedAccessToken) {
            cb (null, t.cachedTicket);
        }
        else {
            var options = {
                url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret,
                method: 'GET'
            };
            var req = request(options, function(error, response, bdy) {
                if (error) {
                    cb (error);
                }
                else {
                    console.log('get wx toke ok[' + bdy + ']');
                    var tk = JSON.parse(bdy);
                    t.accessTokenExpiredTime = Date.now() + 1000 * tk.expires_in - t.disTime;
                    cb (null, t.cachedAccessToken = tk.access_token, tk.expires_in);
                }
            });
        }
	},

	/**
	 * 应用层应该自行对获取到token进行缓存防止到达微信的日访问上限而被封锁
	 * 可以使用memcached、redis、mongodb等你熟悉的任何存储工具进行缓存
	 * 微信默认的实效是2个小时，你需要注意缓存的淘汰时间
	 */
	getJsApiTicket: function (token, cb) {
        var t = this;
		var options = {
	    	url: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + token + '&type=jsapi',
	    	method: 'GET'
	    };

        if (Date.now() < t.ticketExpiredTime && t.cachedTicket) {
            cb (null, t.cachedTicket)
        }
        else {
            var req = request(options, function(error, response, bdy) {
                if (error) {
                    callback (error);
                }
                else {
                    console.log('get wx js api ticket ok[' + bdy + ']');
                    var tk = JSON.parse(bdy);
                    t.ticketExpiredTime = Date.now() + 1000 * tk.expires_in - t.disTime;
                    cb (null, t.cachedTicket = tk.ticket, tk.expires_in);
                }
            });
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

	refreshAccessToken: function (refresh_token, callback) {
		var opt = {
	    	method: 'GET',
			url: 'https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=' + this.appId+ ' &grant_type=refresh_token&refresh_token=' + refresh_token
		};

		request(options, function(error, response, bdy) {
			if (error) {
				callback (error);
			}
			else{
				var ret = JSON.parse(bdy);
				if (ret.errcode) {
					callback (ret);
				}
				else {
					callback (null, ret);
				}
			}
	    });
	},

	/**
	 * 通过微信跳转回来的code换取用户信息
	 * 在换取用户信息前先换取access_token
	 */
	getUserInfoByCode: function (code, callback) {
		var t = this;
		if (code) {
			var options = {
		    	method: 'GET',
				url: 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + this.appId + '&secret=' + this.appSecret + '&code=' + code + '&grant_type=authorization_code'
			};
			request(options, function(error, response, bdy) {
                console.log(bdy);
				if (error) {
					callback (error);
				}
				else{
					var ret = JSON.parse(bdy);
					if (ret.errcode) {
						callback (ret);
					}
					else {
						var openid = ret.openid;
						// 需要获取用户基本信息，头像 昵称等
						if (ret.scope.indexOf('snsapi_userinfo') > -1) {
							t._fetchUserInfo(ret.access_token, openid, callback);
						}
						else {
							callback (null, ret);
						}
					}
				}
		    });
		}
		else {
			callback ({msg: '参数错误，需要code换取access_token', code: -10000});
		}
	},

	/**
	 * 调用微信的api获取用户信息
	 */
	_fetchUserInfo: function (access_token, openid, callback) {
		var options = {
		    method: 'GET',
			url: 'https://api.weixin.qq.com/sns/userinfo?access_token=' + access_token + '&openid=' + openid + '&lang=zh_CN'
		};
		request(options, function(error, response, bdy) {
			if (error) {
				callback (error);
			}
			else{
				var ret = JSON.parse(bdy);
				if (ret.errcode) {
					callback (ret);
				}
				else {
					callback (null, ret);
				}
			}
	    });
	},

    /**
     * 根据media_id从微信呢mp平台下载素材
     * t.downloadMedia(media_id, function (err, req) {
     *      req.pipe(fs.createWriteStream(yourlocalpath))
     * })
     */
    downloadMedia: function (media_id, callback) {
		var t = this;
		t.getAccessToken(function (err, token) {
			var url = 'https://api.weixin.qq.com/cgi-bin/media/get?access_token=' + token + '&media_id=' + media_id;
			callback(null, request(url));
		})
	}
});

module.exports = WxJsSDK;
