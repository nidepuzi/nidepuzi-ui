$(document).ready(function() {
	var $top = $('.act-0405-2-top')[0];
	var screenWidth = document.body.clientWidth;
	$top.style.height = screenWidth * 1.28 + 'px';
	//倒计时
	var intDiff = parseInt(417729158 / 1000);

	var timer = function(intDiff) {
		window.setInterval(function() {
			var day,
				hour,
				minute,
				second;
			if (intDiff <= 0) {
				window.location.href = '../html/act-0405-4.html';
			}
			//时间默认值		
			if (intDiff > 0) {
				day = Math.floor(intDiff / (60 * 60 * 24));
				hour = Math.floor(intDiff / (60 * 60)) - (day * 24);
				minute = Math.floor(intDiff / 60) - (day * 24 * 60) - (hour * 60);
				second = Math.floor(intDiff) - (day * 24 * 60 * 60) - (hour * 60 * 60) - (minute * 60);
			}
			$('#day_show').html('<img  src="../img/' + (Math.floor(day / 10)) + '.png" /> <img  src="../img/' + ((day / 10).toString().split('.')[1] || 0) + '.png" />');
			$('#hour_show').html('<img  src="../img/' + (Math.floor(hour / 10)) + '.png" /> <img  src="../img/' + ((hour / 10).toString().split('.')[1] || 0) + '.png" />');
			$('#minute_show').html('<img  src="../img/' + (Math.floor(minute / 10)) + '.png" /> <img  src="../img/' + ((minute / 10).toString().split('.')[1] || 0) + '.png" />');
			$('#second_show').html('<img  src="../img/' + (Math.floor(second / 10)) + '.png" /> <img  src="../img/' + ((second / 10).toString().split('.')[1] || 0) + '.png" />');
			intDiff--;
		}, 1000);
	};
	var requestData = function() {
		var end_time, current_time, rest_time;
		$.ajax({
			type: 'GET',
			url: '/sale/promotion/apply/3/',
			success: function(resp) {
				//set rest time of activity
				end_time = resp.end_time;
				current_time = (new Date()).getTime();
				rest_time = parseInt((end_time - current_time) / 1000);
				console.log('end_time:' + end_time);
				console.log('current_time:' + current_time);
				timer(rest_time);
				addCard();
				popup(resp);
			}
		});
	};
	var downloadClick = function() {
		window.location.href = '/sale/promotion/appdownload/';
	};
	var addCard = function() {
		var h = [];
		h.push('<div class="act-cards-container">');
		for (var i = 1; i < 10; i++) {
			h.push('<div class="col-xs-4 no-padding act-card">');
			h.push('<img src="../img/card_hide_' + i + '.png" class="card_' + i + '">');
			h.push('</div>');
		}
		h.push('</div>');
		$('.act-0405-time').after(h.join(''));
	};
	var popup = function(resp) {
		var h = [];
		h.push('<div class="act-popup" >');
		h.push('<img src="../img/getCard_first.png" class="act-card-get"/>');
		h.push('</div>');
		$('body').append(h.join(''));
	};
	var closePopup = function() {
		var $popup = $('.act-popup');
		$popup.remove();
		$('.card_1')[0].src = '../img/card_1.png';
	};
	$(document).on('click', '.act-0405-2-download', downloadClick);
	$(document).on('click', '.act-popup', closePopup);
	requestData();
});