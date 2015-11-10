// Here You can type your custom JavaScript...
//$('body').append('<script type="text/javascript" src="http://datapoint.hu/6cams/sixcams.js"></script>');

// Here You can type your custom JavaScript...
var enlargeObject = function(obj) {
    obj.attr({
        width: 1024,
        height: 768
    });
};

var injectFireBase = function() {
    console.log('injecting firebase');
    var _script = $("<script type='text/javascript' src='https://cdn.firebase.com/js/client/2.2.1/firebase.js'></script>");
    _script.bind('load', function() {
       console.log('test');
    });
    $('body').append(_script);
};

var makeItSmall = function(obj) {
    obj.attr({
        width: 320,
        height: 240
    });
};

var mute_unmute = function(method, obj) {
    var fv = getJsonFromFlashVars(getFlashVars(obj));
    switch (method) {
        case 'mute':
            fv.mute = "Y";
            break;
        case 'unmute':
            fv.mute = "N";
            break;
    }

    setFlashVars(obj, serializeObj(fv));

    var parent = obj.parent();
    obj.remove().appendTo(parent);
};

var injectCSS = function() {
    var cssurl = 'http://datapoint.hu/6cams/sixcams.css?v=3a';
    cssurl = 'https://raw.githubusercontent.com/Koeroesi86/camTest/master/style.css';
    $('head').append('<link href="' + cssurl + '" rel="stylesheet" type="text/css">');
};

var injectControls = function(){
    var markup = $('<div class="controls"><h3 class="title">Controls</h3><ul class="ctls"></ul><h3 class="title">Favourites</h3><ul class="favlist"></ul></div>');
    // next / prev btns
    $('body').append(markup);
    markup.find('ul.ctls').append('<li class="next">next page</li><li class="prev">prev page</li>');

    var previewBoxes = $('.camPreview');
    previewBoxes.each(function (index, elem){
        var enlarge = $(elem).find('td').eq(1).append('<br><span class="enlarge-it">Enlarge</span>');
        var unmute = $(elem).find('td').eq(1).append('<span class="unmute-it">Sound</span>');
        var obj = $(elem).find('object');
        var nick = $(elem).find('td').eq(2).find('b').html();

        // appending stream container mask
        var streamContainer = $(elem).find('td:first');
        streamContainer.css({
            position: 'relative'
        });
        streamContainer.append('<div class="mask" style="position: absolute;left: 0;top: 0;width: 100%;height: 100%;z-index: 200;"></div>');

        // binding mute and enlarge icons
        unmute.find('.unmute-it').bind('click', function (){
            if(obj.hasClass('unmuted')){
                obj.removeClass('unmuted');
                $(this).removeClass('unmuted');
                mute_unmute('mute', obj);
            } else {
                obj.addClass('unmuted');
                $(this).addClass('unmuted');
                mute_unmute('unmute', obj);
            }
        });

        enlarge.find('.enlarge-it').bind('click', function (ev){
            if(obj.hasClass('enlarged')){
                makeItSmall(obj);
                obj.removeClass('enlarged');
            } else {
                enlargeObject(obj);
                obj.addClass('enlarged');
            }
        });

        var mask = streamContainer.find('.mask');
        mask.append('<div class="favicon" data-nick="' + nick + '"></div>');

        var favicon = mask.find('.favicon');

        favicon.bind('click', addRemoveFav);
    });
};

var ajaxPageLoad = function(type) {
    var currentPageInput = $("input[name='current_page']");
    var currentPage = parseInt(currentPageInput.val());
    var pageToLoad;
    switch (type) {
        case "next" :
            pageToLoad = currentPage + 1;
            break;
        case "prev" :
            pageToLoad = currentPage - 1;
            break;
    }
    currentPageInput.val(pageToLoad);

    $('.sm').click();
};

function getJsonFromFlashVars(flashVars) {
    var result = {};
    flashVars.split("&").forEach(function(part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}

var getFavLS = function() {
    var favs = localStorage.getItem('myfavs');
    if (favs) {
        return JSON.parse(favs);
    } else {
        return [];
    }
};

var addFav = function(nick) {
    var favs = getFavLS();
    if (typeof favs == 'object' && favs.indexOf(nick) == -1) {
        favs.push(nick);
        favs = JSON.stringify(favs);
        localStorage.setItem('myfavs', favs);
        var ip = $('input[name="ip"]').val();
        $('ul.favlist').append('<li class="favbtn" data-nick="' + nick + '"><a href="?nickname='+nick+'&ip=' + ip +'">' + nick + '</a><span class="remove">&#0215;</span></li>');
        var _ref = new Firebase('https://blazing-heat-28.firebaseio.com/' + nick);
        _ref.transaction(incrementDataRefValue);
        return true;
    }
    return false;
};

var removeFav = function(nick) {
    var favs = getFavLS();
    if (typeof favs == 'object' && favs.indexOf(nick) > -1) {
        var index = favs.indexOf(nick);
        favs.splice(index, 1);
        favs = JSON.stringify(favs);
        localStorage.setItem('myfavs', favs);
        $('.favicon[data-nick="' + nick + '"]').removeClass('added');
        $('.favbtn[data-nick="' + nick + '"]').remove();
        var _ref = new Firebase('https://blazing-heat-28.firebaseio.com/' + nick);
        _ref.transaction(decrementDataRefValue);
        return true;
    }
    return false;
};

var addRemoveFav = function(ev) {
    var target = $(ev.target);
    var favs = getFavLS();
    if (!favs) {
        favs = [];
    }
    var nick = target.attr('data-nick');
    if (target.hasClass('added')) {
        target.removeClass('added');
        removeFav(nick);
    } else {
        target.addClass('added');
        addFav(nick);
    }
};

var incrementDataRefValue = function (current_value) {
    return (current_value || 0) + 1;
};

var decrementDataRefValue = function (current_value) {
    return (current_value || 0) - 1;
};


var setFavsOnLoad = function() {
    var favs = getFavLS();
    if (favs.length) {
        $.each(favs, function(index, value){
            if (_firstRun) {
                var _ref = new Firebase('https://blazing-heat-28.firebaseio.com/' + value);
                _ref.transaction(incrementDataRefValue);
            }
            $('div[data-nick="' + value + '"').addClass('added');
            var ip = $('input[name="ip"]').val();
            $('ul.favlist').append('<li class="favbtn" data-nick="' + value + '"><a href="?nickname=' + value + '&ip=' + ip + '">' + value + '</a><span class="remove">&#0215;</span></li>');
        });
    }
};

var getFlashVars = function(obj) {
    return obj.find('param[name="flashvars"]').attr('value');
};

var setFlashVars = function(obj, fv) {
    obj.find('param[name="flashvars"]').attr('value', fv);
};

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

    if (sParam) {
        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    } else {
        return sPageURL ? sURLVariables : [];
    }
};

var serializeObj = function(obj) {
    var str = "";
    for (var key in obj) {
        if (str !== "") {
            str += "&";
        }
        str += key + "=" + encodeURIComponent(obj[key]);
    }
    return str;
};

var toggleFavIcon = function() {
  $('.favicon').toggle()
};

var checkFirstRun = function() {
    if (!localStorage.getItem('_firstRun')) {
        _firstRun = true;
        localStorage.setItem('_firstRun', 1);
    } else {
        _firstRun = false;
    }
};

var _dataRef,_firstRun = false;

var checkFireBase = function() {
  setTimeout(function() {
      if (typeof Firebase != "function") {
          console.log('not loaded');
          checkFireBase();
      } else {
          initScript();
      }
  }, 100);
};

var parseUri = function() {
    var params = getUrlParameter();

    console.log(params);

    $.each(params, function(index, param) {
        var pTomb = param.split('=');
        var key = pTomb[0];
        var value = pTomb[1];

        if (value !== 'undefined') {
            console.log(key, value);
            $('input[name="' + key + '"]').val(value);
        }
    });

    $('form[name="search_form"]').attr('action', '?');

    if (params.length || !$('.results').length) {
        $('.sm').click();
    }
};

var initScript = function() {
    checkFirstRun();
    injectCSS();
    injectControls();
    setFavsOnLoad();

    $('.next').bind('click', function() {
        ajaxPageLoad('next');
    });

    /*$('body').delegate(".favbtn", 'click', function(){
        window.location = '?nickname=' + $(this).attr('data-nick');
    });*/

    $('body').delegate(".favbtn a", 'click', function(ev){
        ev.stopPropagation();
    });

    $('body').delegate(".remove", "click", function(ev) {
        ev.stopPropagation();
        var parent = $(this).parent();
        var nick = parent.attr('data-nick');
        removeFav(nick);
        parent.remove();
    });

    $('.prev').bind('click', function() {
        ajaxPageLoad('prev');
    });

    setTimeout(function() {
        parseUri();
    }, 1000);
};

$(document).ready(function() {
    injectFireBase();
    checkFireBase();
});
