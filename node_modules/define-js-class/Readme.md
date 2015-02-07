##define-js-class简介
define-js-class是一个可以定义js类的方法，支持继承，方法override等特性

##如何安装？

    npm install define-js-class

##经典用法
* Qzone日志编辑器
* Qzone6.0-8.0
* 微信公众号红包
* 腾讯公益自助建站系统

##用法实例

```javascript
  var xExtend = require('define-js-class');
  
  var Base = xExtend(function () {}, {
    _constructor: function (key) {
        this.key = key;
    },
    
    check: function () {}
  });
  
  var Sub = xExtend(Base, {
    _constructor: function (key, value) {
        this.value = value;
    }
  });
  
  // 下面是应用
  var sub = new Sub();
  sub.check();
  alert (sub.key);
  alert (sub.value);
```
