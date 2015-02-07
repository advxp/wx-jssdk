##wx-jssdk简介
微信jssdk的开发者经常会面临获取token和获取ticket的操作，wx-jssdk是将这些操作进行封装，开发者引入到自己的项目就可以使用

##如何安装？

    npm install wx-jssdk


##用法实例

```javascript
  var WxJsSDKUtil = require('wx-jssdk');
  var obj = new WxJsSDKUtil(appid, appsecret);
  // 获取某个url下的wx.config参数
  obj.getJsConfig(url, function (err, ret) {
    if (err) {
      console.error(err);
    }
    else {
      // you handler
    }
  })
```
