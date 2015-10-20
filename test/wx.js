var should = require ('should')
var WxJsSDK = require ('../src/index.js');
var appid = 'wxc773fcf427453604';
var appsecret = 'ef8e93e687ced614eb02510a23163ea9';

describe('wx-jssdk test', function () {
    var instance = new WxJsSDK(appid, appsecret);
    it ('...method getAccessToken', function (done) {
        instance.getAccessToken (function (err, token) {
            if (err) {
                should.fail(err);
            }
            else {
                token.should.be.a.String;
                console.log('was:[' + token + ']');
            }
            done();
        });
    });

    it ('...method getJsApiConfig', function (done) {
        instance.getJsApiConfig ('https://www.a.com/aaa', function (err, config) {
            if (err) {
                should.fail(err);
            }
            else {
                config.should.be.a.Object;
                config.should.have.keys('signature', 'appId', 'timestamp', 'noncestr')
                console.log('was:');
                console.dir (config);
            }
            done();
        })
    })
})
