var WebSocket = require('ws');

var saleData1 = require('./assertions/read/saleData1');
var _ = require('lodash');
const assert = require('assert');




describe('Read Tests', function(suite) {
    var ws;
    var token;
    before(function(done) {
        setTimeout(function() {
            ws = new WebSocket("ws://localhost:4000");
            ws.on('message', (raw1) => {
                let mes = JSON.parse(raw1);
                if (mes.command == "handshake") {
                    token = mes.token;
                    var login = {
                        "command":"login",
                        "token":token,
                        "id":0,
                        "data":{"login":"neerone","password":"iq9VT21j"}
                    };
                    console.log(login)
                    setTimeout(function() {

                        ws.send(JSON.stringify(login),() => {
                            console.log("LOGGED IN SUCCESSEFULLY")
                            done();
                        });
                    }, 2000);
                }
            })
        }, 5000);
    });


    it('Получаем данные для таблицы 101', function(done) {
        var reqId = _.uniqueId();

        let tabrequest = {"command":"autoPost","token":token,"widgetKey":"new9-1084","id":reqId,"data":[{"modelId":"349","elementId":"new5","drafts":{"349":{"new5":{"autofilled":"0","category_id":"","create_by_source_url":"https://ru.aliexpress.com/item/LS4G-Double-Side-Dog-Brush-Dematting-Matbreaker-Grooming-Deshedding-Trimmer-Tool-Comb-Pet-Brush-Rake-10/32670671471.html?spm=a2g0v.search0104.3.48.txgZMr&ws_ab_test=searchweb0_0,searchweb201602_1_10152_10065_10151_10068_10307_10301_10137_10060_10155_10154_10056_10055_10054_10059_303_100031_10099_10338_10103_10102_440_10169_10052_10053_10142_10107_10050_10051_10326_10084_10083_10080_10082_10081_10110_10111_10112_10113_10114_143_10312_10313_10314_10317_10318_10078_10079_10073_10125-10102_10318,searchweb201603_1,ppcSwitch_5&btsid=55c12f91-5380-4c43-99dc-b930986921ef&algo_expid=ad92161b-120a-4426-98be-f243dba653a5-6&algo_pvid=ad92161b-120a-4426-98be-f243dba653a5","description":"","id":"new5","label":"","site_page_id":"new6"}},"351":{"new11":{"aliexpress_product_id":"","aliexpress_url":"https://ru.aliexpress.com/item/2017-Dematting-matbreaker-Deshedding/32668201706.html?spm=a2g0v.search0104.3.81.txgZMr&ws_ab_test=searchweb0_0%2Csearchweb201602_1_10152_10065_10151_10068_10307_10301_10137_10060_10155_10154_10056_10055_10054_10059_303_100031_10099_10338_10103_10102_440_10169_10052_10053_10142_10107_10050_10051_10326_10084_10083_10080_10082_10081_10110_10111_10112_10113_10114_143_10312_10313_10314_10317_10318_10078_10079_10073_10125-10102_10318%2Csearchweb201603_1%2CppcSwitch_5&btsid=55c12f91-5380-4c43-99dc-b930986921ef&algo_expid=ad92161b-120a-4426-98be-f243dba653a5-10&algo_pvid=ad92161b-120a-4426-98be-f243dba653a5","cost":"","epn_url":"","id":"new11","label":"","product_id":"new5","seller_id":""}},"353":{"new6":{"id":"new6","seo_description":"","seo_keys":"","seo_url":""}}}}]};
        


        ws.wsend(tabrequest, (data) => {
        });



    });


        






});