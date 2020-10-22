


/*1*/

(function () {

L.Control.FullScreen = L.Control.extend({
	options: {
		position: 'bottomright',
		title: 'شاشة كاملة',
		titleCancel: 'الخروج من وضع الشاشة الكاملة',
		forceSeparateButton: false,
		forcePseudoFullscreen: false,
		fullscreenElement: false
	},
	
	onAdd: function (map) {
		var className = 'leaflet-control-zoom-fullscreen', container, content = '';
		
		if (map.zoomControl && !this.options.forceSeparateButton) {
			container = map.zoomControl._container;
		} else {
			container = L.DomUtil.create('div', 'leaflet-bar');
		}
		
		if (this.options.content) {
			content = this.options.content;
		} else {
			className += ' fullscreen-icon';
		}

		this._createButton(this.options.title, className, content, container, this.toggleFullScreen, this);
		this._map.fullscreenControl = this;

		this._map.on('enterFullscreen exitFullscreen', this._toggleTitle, this);

		return container;
	},
	
	onRemove: function (map) {
		L.DomEvent
			.off(this.link, 'click', L.DomEvent.stopPropagation)
			.off(this.link, 'click', L.DomEvent.preventDefault)
			.off(this.link, 'click', this.toggleFullScreen, this);
		
		L.DomEvent
			.off(this._container, fullScreenApi.fullScreenEventName, L.DomEvent.stopPropagation)
			.off(this._container, fullScreenApi.fullScreenEventName, L.DomEvent.preventDefault)
			.off(this._container, fullScreenApi.fullScreenEventName, this._handleFullscreenChange, this);
		
		L.DomEvent
			.off(document, fullScreenApi.fullScreenEventName, L.DomEvent.stopPropagation)
			.off(document, fullScreenApi.fullScreenEventName, L.DomEvent.preventDefault)
			.off(document, fullScreenApi.fullScreenEventName, this._handleFullscreenChange, this);
	},
	
	_createButton: function (title, className, content, container, fn, context) {
		this.link = L.DomUtil.create('a', className, container);
		this.link.href = '#';
		this.link.title = title;
		this.link.innerHTML = content;

		this.link.setAttribute('role', 'button');
		this.link.setAttribute('aria-label', title);

		L.DomEvent
			.on(this.link, 'click', L.DomEvent.stopPropagation)
			.on(this.link, 'click', L.DomEvent.preventDefault)
			.on(this.link, 'click', fn, context);
		
		L.DomEvent
			.on(container, fullScreenApi.fullScreenEventName, L.DomEvent.stopPropagation)
			.on(container, fullScreenApi.fullScreenEventName, L.DomEvent.preventDefault)
			.on(container, fullScreenApi.fullScreenEventName, this._handleFullscreenChange, context);
		
		L.DomEvent
			.on(document, fullScreenApi.fullScreenEventName, L.DomEvent.stopPropagation)
			.on(document, fullScreenApi.fullScreenEventName, L.DomEvent.preventDefault)
			.on(document, fullScreenApi.fullScreenEventName, this._handleFullscreenChange, context);

		return this.link;
	},
	
	toggleFullScreen: function () {
		var map = this._map;
		map._exitFired = false;
		if (map._isFullscreen) {
			if (fullScreenApi.supportsFullScreen && !this.options.forcePseudoFullscreen) {
				fullScreenApi.cancelFullScreen();
			} else {
				L.DomUtil.removeClass(this.options.fullscreenElement ? this.options.fullscreenElement : map._container, 'leaflet-pseudo-fullscreen');
			}
			map.fire('exitFullscreen');
			map._exitFired = true;
			map._isFullscreen = false;
		}
		else {
			if (fullScreenApi.supportsFullScreen && !this.options.forcePseudoFullscreen) {
				fullScreenApi.requestFullScreen(this.options.fullscreenElement ? this.options.fullscreenElement : map._container);
			} else {
				L.DomUtil.addClass(this.options.fullscreenElement ? this.options.fullscreenElement : map._container, 'leaflet-pseudo-fullscreen');
			}
			map.fire('enterFullscreen');
			map._isFullscreen = true;
		}
	},
	
	_toggleTitle: function () {
		this.link.title = this._map._isFullscreen ? this.options.title : this.options.titleCancel;
	},
	
	_handleFullscreenChange: function () {
		var map = this._map;
		map.invalidateSize();
		if (!fullScreenApi.isFullScreen() && !map._exitFired) {
			map.fire('exitFullscreen');
			map._exitFired = true;
			map._isFullscreen = false;
		}
	}
});

L.Map.include({
	toggleFullscreen: function () {
		this.fullscreenControl.toggleFullScreen();
	}
});

L.Map.addInitHook(function () {
	if (this.options.fullscreenControl) {
		this.addControl(L.control.fullscreen(this.options.fullscreenControlOptions));
	}
});

L.control.fullscreen = function (options) {
	return new L.Control.FullScreen(options);
};

/* 
Native FullScreen JavaScript API
-------------
Assumes Mozilla naming conventions instead of W3C for now

source : http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/

*/

	var 
		fullScreenApi = { 
			supportsFullScreen: false,
			isFullScreen: function () { return false; }, 
			requestFullScreen: function () {}, 
			cancelFullScreen: function () {},
			fullScreenEventName: '',
			prefix: ''
		},
		browserPrefixes = 'webkit moz o ms khtml'.split(' ');
	
	// check for native support
	if (typeof document.exitFullscreen !== 'undefined') {
		fullScreenApi.supportsFullScreen = true;
	} else {
		// check for fullscreen support by vendor prefix
		for (var i = 0, il = browserPrefixes.length; i < il; i++) {
			fullScreenApi.prefix = browserPrefixes[i];
			if (typeof document[fullScreenApi.prefix + 'CancelFullScreen'] !== 'undefined') {
				fullScreenApi.supportsFullScreen = true;
				break;
			}
		}
		if (typeof document['msExitFullscreen'] !== 'undefined') {
			fullScreenApi.prefix = 'ms';
			fullScreenApi.supportsFullScreen = true;
		}
	}
	
	// update methods to do something useful
	if (fullScreenApi.supportsFullScreen) {
		if (fullScreenApi.prefix === 'ms') {
			fullScreenApi.fullScreenEventName = 'MSFullscreenChange';
		} else {
			fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';
		}
		fullScreenApi.isFullScreen = function () {
			switch (this.prefix) {
				case '':
					return document.fullscreen;
				case 'webkit':
					return document.webkitIsFullScreen;
				case 'ms':
					return document.msFullscreenElement;
				default:
					return document[this.prefix + 'FullScreen'];
			}
		};
		fullScreenApi.requestFullScreen = function (el) {
			switch (this.prefix) {
				case '':
					return el.requestFullscreen();
				case 'ms':
					return el.msRequestFullscreen();
				default:
					return el[this.prefix + 'RequestFullScreen']();
			}
		};
		fullScreenApi.cancelFullScreen = function () {
			switch (this.prefix) {
				case '':
					return document.exitFullscreen();
				case 'ms':
					return document.msExitFullscreen();
				default:
					return document[this.prefix + 'CancelFullScreen']();
			}
		};
	}

	// jQuery plugin
	if (typeof jQuery !== 'undefined') {
		jQuery.fn.requestFullScreen = function () {
			return this.each(function () {
				var el = jQuery(this);
				if (fullScreenApi.supportsFullScreen) {
					fullScreenApi.requestFullScreen(el);
				}
			});
		};
	}

	// export api
	window.fullScreenApi = fullScreenApi;
})();




/*2*/


function C(e){return(document.cookie.match("(^|; )"+encodeURIComponent(e)+"=([^;]*)")||-1)[2]}

function sC(e,n){var a=new Date;a.setTime(a.getTime()+158112e5),document.cookie=e+"="+n+";expires="+a.toUTCString()+";path=/"}

function ev(e){dataLayer&&dataLayer.push({event:e})}

function changeLocation(){var t=["ar"],n=["en"],a=(navigator.language||navigator.userLanguage).substring(0,2),t="";sC("l",a),e.indexOf(a)>-1?t="ar":n.indexOf(a)>-1&&(t="ar"),""!=t&&redirect[t]&&-1==window.location.pathname.indexOf("/"+t)&&(window.location=redirect[t])}

function getParamFromUrlCookie(e,n,a){var t=getURLParameter(e);return null==t&&null==(t=C(n))&&(t=a),t}

function getURLParameter(e){return decodeURIComponent((new RegExp("[?|&]"+e+"=([^&;]+?)(&|#|;|$)").exec(location.search)||[,""])[1].replace(/\+/g,"%20"))||null}dataLayer=[],C("l")||changeLocation();



/*3*/
var maps = [{

 base: L.tileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}{r}.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d'), reference: null 

},{
	 base: L.tileLayer("https://api.mapbox.com/styles/v1/androidksa/ck3gm472008v21co0kg0a7xkr/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW5kcm9pZGtzYSIsImEiOiJjazM2cjkydHYwMzk2M25tdWUwMXI1cTNyIn0.Zv7a2Oi31HQFzps0BVOhEA",), reference: null
 
 },{

 base: L.tileLayer("https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}{r}.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d"
,), reference: null
 

 },{

	 base: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",), reference: null
	 
 },{

     base: L.tileLayer("http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",), reference: null
  
 
 },{

     base: L.tileLayer("https://b.tile.openstreetmap.de/{z}/{x}/{y}.png",), reference: null
  
 
 },{

     base: L.tileLayer("https://a.tile.opentopomap.org/{z}/{x}/{y}.png",), reference: null
  
 
},{

     base: L.tileLayer("https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png",), reference: null
  
 
 },{

     base: L.tileLayer("https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png",), reference: null
  
 
 },{

     base: L.tileLayer("https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}{r}.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d",), reference: null
  
 
},{

     base: L.tileLayer("https://a.tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d",), reference: null
  
 
},{

     base: L.tileLayer("https://a.tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d",), reference: null
  
 
 
},{

     base: L.tileLayer("https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYW5kcm9pZGtzYSIsImEiOiJjazM2cjkydHYwMzk2M25tdWUwMXI1cTNyIn0.Zv7a2Oi31HQFzps0BVOhEA",), reference: null
  
 
 },{

     base: L.tileLayer("https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",), reference: null
 
},{

      base: L.tileLayer("https://api.mapbox.com/styles/v1/androidksa/ck3gf6o2u02jc1clcp9hituzj/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW5kcm9pZGtzYSIsImEiOiJjazM2cjkydHYwMzk2M25tdWUwMXI1cTNyIn0.Zv7a2Oi31HQFzps0BVOhEA",), reference: null
 
 },{

      base: L.tileLayer("https://api.mapbox.com/styles/v1/androidksa/ck3jmy0eg0bms1cmwm3dxwirg/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW5kcm9pZGtzYSIsImEiOiJjazM2cjkydHYwMzk2M25tdWUwMXI1cTNyIn0.Zv7a2Oi31HQFzps0BVOhEA",), reference: null
 
},{

      base: L.tileLayer("https://api.mapbox.com/styles/v1/androidksa/ck3hx799819rg1cpka2vl4ro9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW5kcm9pZGtzYSIsImEiOiJjazM2cjkydHYwMzk2M25tdWUwMXI1cTNyIn0.Zv7a2Oi31HQFzps0BVOhEA",), reference: null
 
},{

      base: L.tileLayer("https://api.mapbox.com/styles/v1/androidksa/ck3xvlxsm0ld31co3v1dh4vwr/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW5kcm9pZGtzYSIsImEiOiJjazM2cjkydHYwMzk2M25tdWUwMXI1cTNyIn0.Zv7a2Oi31HQFzps0BVOhEA",), reference: null
 
},{

       base: L.tileLayer("https://api.mapbox.com/styles/v1/lukasmartinelli/cj2amg3qv001g2so47fcnb49y/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibHVrYXNtYXJ0aW5lbGxpIiwiYSI6ImNqMmFvNDF4ODAwOGczM3M1cGJoOG13Y20ifQ.2A3lELT-I1U68zoCwUnPdw",), reference: null
 
 }];



/*4*/

function Progress(e, t) {
    var a = 0,
        i = 0;
    this.addLoading = function() {
            0 == a && o(),
                ++a,
                n()
        },
        this.addLoaded = function() {
            setTimeout(function() {
                ++i, n()
            }, 100)
        },
        this.isLoading = function() {
            return 0 != a
        };
    var n = function() {
            e.innerHTML = "",
                a == i && (a = 0, i = 0, setTimeout(function() {
                    r()
                }, 500))
        },
        o = function() {
            e.style.visibility = "visible",
                t.className = "loader"
        },
        r = function() {
            a == i && (e.style.visibility = "hidden", t.className = "loader hidden")
        }
}

function Networking(e, t) {
    this.timer = null,
        this.imageUrl = "https://tilecache.rainviewer.com",
        this.timestamps = [],
        this.length = 0,
        this.cb = e,
        this.progress = t
}

function bind(e, t, a) {
    var i = document.getElementById(t),
        n = e.split(" ");
    if (i)
        for (var o = 0, r = n.length; o < r; o++) i.addEventListener(n[o], function(e) {
            a(e), updateMainSiteLink()
        }, !1);
    return i
}

function setMapType(e) {
    map && maps[e] && (layerBaseMap.remove(), layerBaseMap = maps[e].base, layerReferenceMap && layerReferenceMap.remove(), maps[e].reference && (layerReferenceMap = maps[e].reference, map.addLayer(layerReferenceMap), layerReferenceMap.bringToFront()), map.addLayer(layerBaseMap), layerBaseMap.bringToBack())
}

function initializePage() {
    function e(e) {
        function t(e, t) {
            var o = i + e + " " + i + t;
            a[e + t] = L.DomUtil.create("div", o, n)
        }
        var a = e._controlCorners,
            i = "leaflet-",
            n = e._controlContainer;
        t("verticalcenter", "left"),
            t("verticalcenter", "right")
    }
    var t;
    showFullScreenMap(isFullScreen),
        isAutoPlay && playStopAnimation(),
        bind("change", "input-fast-animation", function(e) {
            isFastAnimation = e.target.checked ? 1 : 0, sC("fast-animation", isFastAnimation), ev("fast-animation"), updateMainSiteLink()
        }).checked = 1 == isFastAnimation,
        bind("change", "input-coverage", function(e) {
            isCoverage = e.target.checked ? 1 : 0, sC("coverage", isCoverage), ev("coverage"), 1 == isCoverage ? map.addLayer(coverageLayer) : map.removeLayer(coverageLayer)
        }).checked = 1 == isCoverage,
        bind("change", "input-utc-time", function(e) {
            isUtcTime = e.target.checked ? 1 : 0, sC("utc-time", isUtcTime), ev("utc-time"), updateTimeSelection(networking.getTimestamps())
        }).checked = 1 == isUtcTime,
        bind("change", "input-legend", function(e) {
            isLegend = e.target.checked ? 1 : 0, sC("color-scheme", isLegend), ev("color-scheme"), showHideLegend()
        }).checked = 1 == isLegend,
        bind("change", "input-dark-theme", function(e) {
            isDarkTheme = e.target.checked ? 1 : 0, sC("dark-theme", isDarkTheme), ev("dark-theme"), switchDarkTheme()
        }).checked = 1 == isDarkTheme,
        bind("change", "input-smooth", function(e) {
            isSmooth = e.target.checked ? 1 : 0, sC("smooth", isSmooth), ev("smooth"), refreshTiledLayers()
        }).checked = 1 == isSmooth,
        bind("change", "input-snow", function(e) {
            isSnow = e.target.checked ? 1 : 0, sC("snow", isSnow), ev("snow"), refreshTiledLayers()
        }).checked = 1 == isSnow,
        bind("change", "input-colors-scheme", function(e) {
            var t = colorScheme;
            colorScheme = parseInt(e.target.value), sC("colors-scheme", colorScheme), ev("colors-scheme");
            var a = document.getElementById("color-scheme-map");
            a.classList.add("cs-" + colorScheme), a.classList.remove("cs-" + t), refreshTiledLayers()
        }).value = colorScheme,
        bind("change", "select-time", function(e) {
            for (var t = networking.getTimestamps(), a = t.length - 1; a >= 0; a--)
                if (parseInt(e.target.value) == t[a]) {
                    changeRadarPosition(a);
                    break
                }
        }),
        bind("change keyup mouseup", "input-opacity", function(e) {
            var t = parseInt(e.target.value);
            if (t >= 0 && t <= 100) {
                if (msTileOpacity = t, networking) {
                    var a = networking.getTimestampForIndex(currentPosition);
                    radarLayers[a] && radarLayers[a].setOpacity(msTileOpacity / 100)
                }
                sC("opacity", t), ev("opacity")
            }
        }).value = msTileOpacity,
        bind("click", "btn-opt", function() {
            var e = document.getElementById("options-popup");
            e.style.display = "block" == e.style.display ? "none" : "block"
        }),
        bind("click", "button-play", function() {
            playStopAnimation()
        }),
        bind("click", "button-prev", function() {
            stopAnimation(), changeRadarPosition(currentPosition - 1)
        }),
        bind("click", "button-next", function() {
            stopAnimation(), changeRadarPosition(currentPosition + 1)
        }),
        bind("change", "input-map-type", function(e) {
            mapType = e.target.value, sC("rmt", mapType), setMapType(mapType)
        }).value = mapType;
    var a = [
        ["AR",
            24.17,
            45.09,
            4
        ],
        ["SA",
            24.6218,
            46.6658,
            4
        ],
    ];
    for (var i in a)
        if (language == a[i][0].toLowerCase()) {
            t = {
                lat: a[i][1],
                lng: a[i][2],
                zoom: a[i][3]
            };
            break
        }
    t || (t = {
            lat: 24.17,
            lng: 45.09,
            zoom: 4
        }),
        coverageLayer = L.tileLayer(getCoverageUrl(), {
            opacity: .32,
            zIndex: 20,
            visible: !1
        }),
        layerBaseMap = maps[mapType].base,
        layerReferenceMap = null,
        (map = L.map("map-canvas", {
            layers: [],
            center: [t.lat, t.lng],
            zoom: t.zoom
        })).scrollWheelZoom.disable(),
        e(map),
        map.zoomControl.setPosition("verticalcenterright"),
        L.control.scale({
            position: "bottomleft"
        }).addTo(map),
        map.on("moveend",
            saveMapState),
        setMapType(mapType),
        loadMapState(),
        showLoadingMark(!0),
        updateMainSiteLink(),
        networking.sync(isAutoUpdate),
        1 == isCoverage && map.addLayer(coverageLayer)
}







function getTileUrl(e) {
    return networking.getImageUrl() + "/v2/radar/" + e + "/" + msTileSize + "/{z}/{x}/{y}/" + (1 + parseInt(colorScheme)) + "/" + isSmooth + "_" + isSnow + "_1.png"
}

function getCoverageUrl() {
    return networking.getImageUrl() + "/v2/coverage/0/" + msTileSize + "/{z}/{x}/{y}.png"
}

function playAnimation() {
    var e,
        t;
    map && progress && !progress.isLoading() && (changeRadarPosition(networking.normalize(currentPosition + 1)),
            e = networking.normalize(currentPosition + 1),
            addLayer(t = networking.getTimestampForIndex(e)),
            radarLayers[t].setOpacity(.001)),
        animation = setTimeout(playAnimation,
            0 == e ? 1500 : animationDelay > 0 ? animationDelay : isFastAnimation ? 100 : 400)
}

function stopAnimation() {
    clearTimeout(animation),
        animation = null
}

function playStopAnimation() {
    document.getElementById("button-play").value = animation ? "تشغيل" : "إيقاف ", animation ? stopAnimation() : playAnimation(), isAutoPlay = animation ? 1 : 0, sC("autoplay", isAutoPlay), ev("autoplay")
}

function changeRadarPosition(e) {
    if (map && currentPosition != e) {
        var t = networking.getTimestampForIndex(currentPosition);
        currentPosition = networking.normalize(e);
        var a = networking.getTimestampForIndex(currentPosition),
            i = document.getElementById("option-time" + a);
        i && (i.selected = "selected"),
            addLayer(a),
            radarLayers[t] && radarLayers[t].setOpacity(0),
            radarLayers[a].setOpacity(msTileOpacity / 100)
    }
}

function addLayer(e) {
    if (!radarLayers[e]) {
        var t = new L.TileLayer(getTileUrl(e), {
            tileSize: msTileSize,
            opacity: .001,
            zIndex: 10
        });
        t.on("loading",
                progress.addLoading),
            t.on("load",
                progress.addLoaded),
            radarLayers[e] = t
    }
    map.hasLayer(radarLayers[e]) || map.addLayer(radarLayers[e]),
        layerReferenceMap && layerReferenceMap.bringToFront()
}

function showLoadingMark(e) {
    document.getElementById("loading-mark").className = e ? "loader" : "loader hidden"
}

function saveMapState(e) {
    sC("latest-map-coordinates",
            getMapCenterLatLonZoom(e.map)),
        updateMainSiteLink()
}

function getMapCenterLatLonZoom() {
    var e = map.getCenter();
    return Math.round(1e4 * e.lat) / 1e4 + "," + Math.round(1e4 * e.lng) / 1e4 + "," + map.getZoom()
}

function loadMapState() {
    var e = getParamFromUrlCookie("loc",
        "latest-map-coordinates",
        "");
    if (e) {
        var t = e.split(e.indexOf("_") > 0 ? "_" : ","),
            a = parseFloat(t[0]),
            i = parseFloat(t[1]),
            n = parseFloat(t[2]);
        !map || isNaN(a) || isNaN(i) || isNaN(n) || map.setView(new L.LatLng(a,
                i),
            n)
    }
}

function getTime(e) {
    var t = new Date(1e3 * e),
        a = {
            hour: "numeric",
            minute: "numeric"
        };
    return isUtcTime && (a.timeZone = "UTC"),
        t.toLocaleString(language,
            a) + (isUtcTime ? " UTC" : "")
}

function updateTimeSelection(e) {
    for (var t = document.getElementById("select-time"); t.hasChildNodes();) t.removeChild(t.lastChild);
    for (var a = e.length - 1; a >= 0; a--) {
        var i = document.createElement("option");
        i.id = "option-time" + e[a],
            i.value = e[a],
            i.text = getTime(e[a]),
            i.selected = a == currentPosition ? "selected" : "", t.appendChild(i)
    }
}

/*12345*/

function updateMainSiteLink() {
    for (var e = document.querySelectorAll("a.main-site-link"),
            t = getMapLink(),
            a = 0; a < e.length; a++) e[a].href = t
}


function getMapLink(e) {
    return e || (e = document.location.pathname.replace("map.html",
            "")),
        document.location.protocol + "//" + document.location.host + e + "?loc=" + getMapCenterLatLonZoom(map) + "&oFa=" + isFastAnimation + "&oC=" + isCoverage + "&oU=" + isUtcTime + "&oCS=" + isLegend + "&oF=" + isFullScreen + "&oAP=" + isAutoPlay + "&rmt=" + mapType + "&c=" + colorScheme + "&o=" + msTileOpacity + "&lm=" + isLegendMinimized + "&th=" + isDarkTheme + "&sm=" + isSmooth + "&sn=" + isSnow
}



function showHideLegend() {
    var e = document.getElementById("info-popup");
    e && (e.style.display = 1 == isLegend ? "block" : "none")
}

function showFullScreenMap(e) {
    document.getElementsByTagName("body")[0].className = e ? "full-screen" : "", map && map.invalidateSize()
}

function minimizeLegend() {
    isLegendMinimized = 1 == isLegendMinimized ? 0 : 1, sC("legend-minimized", isLegendMinimized), ev("legend-minimized"), minimizeLegendVisibility()
}

function minimizeLegendVisibility() {
    var e = document.getElementById("info-popup").classList;
    1 == isLegendMinimized ? e.add("legend-minimized") : e.remove("legend-minimized")
}

function switchDarkTheme() {
    var e = document.getElementById("radar-app").classList;
    1 == isDarkTheme ? e.add("dark-theme") : e.remove("dark-theme")
}

function refreshTiledLayers() {
    for (var e = networking.getTimestamps(),
            t = e.length; t >= 0; t--) {
        if (radarLayers[e[t]]) radarLayers[e[t]].setUrl(getTileUrl(e[t]))
    }
}

var mtMultiplier = (isRetina(),
        1),
    mtSize = 256,
    msTileSize = mtMultiplier * mtSize,
    msTileOpacity = getParamFromUrlCookie("o",
        "opacity",
        73),
    radarLayers = [],
    isAutoUpdate = getParamFromUrlCookie("oAU",
        "auto-update",
        1) > 0 ? 1 : 0,
    isFastAnimation = getParamFromUrlCookie("oFa",
        "fast-animation",
        0) > 0 ? 1 : 0,
    isCoverage = getParamFromUrlCookie("oC",
        "coverage",
        0),
    isUtcTime = getParamFromUrlCookie("oU",
        "utc-time",
        0) > 0 ? 1 : 0,
    isLegend = getParamFromUrlCookie("oCS",
        "color-scheme",
        1),
    isLegendMinimized = getParamFromUrlCookie("lm",
        "legend-minimized",
        0),
    isDarkTheme = getParamFromUrlCookie("th",
        "dark-theme",
        0),
    isFullScreen = getParamFromUrlCookie("oF",
        "full-screen",
        0) > 0 ? 1 : 0,
    isAutoPlay = getParamFromUrlCookie("oAP",
        "autoplay",
        0) > 0 ? 1 : 0,
    isColorUniversalBlue = getParamFromUrlCookie("oCUB",
        "color-universal-blue",
        1) > 0 ? 1 : 0,
    colorScheme = getParamFromUrlCookie("c",
        "colors-scheme",
        2),
    isSnow = getParamFromUrlCookie("sn",
        "snow",
        1),
    isSmooth = getParamFromUrlCookie("sm",
        "smooth",
        1),
    animationDelay = getParamFromUrlCookie("aDelay",
        "animation-delay",
        0);
typeof colorScheme == undefined && (colorScheme = isColorUniversalBlue ? 1 : 0),
    (colorScheme < 0 || 4 == colorScheme || colorScheme > 8) && (colorScheme = 1);
var el = document.getElementById("color-scheme-map");
el && el.classList.add("cs-" + colorScheme);
var mapType = getParamFromUrlCookie("rmt",
    "rmt",
    14);
"roadmap" == mapType ? mapType = 0 : "hybrid" == mapType ? mapType = 1 : "rain_viewer" == mapType ? mapType = 2 : (mapType < 0 || mapType > 16) && (mapType = 0);
var layerBaseMap,
    layerReferenceMap,
    map,
    coverageLayer,
    language = window.navigator.userLanguage || window.navigator.language,
    currentPosition = 0,
    animation = null,
    progress = new Progress(document.getElementById("loading-count"),
        document.getElementById("loading-mark")),
    networking = new Networking(function(e) {
            document.getElementById("time-section").className = "",
                document.getElementById("play-section").className = "";
            var t = e.getTimestamps(),
                a = t.length - 1;
            for (var i in showLoadingMark(!1),
                    changeRadarPosition(a),
                    updateTimeSelection(t),
                    radarLayers) - 1 == t.indexOf(parseInt(i)) && (map.removeLayer(radarLayers[i]),
                delete radarLayers[i])
        }

        ,
        progress);
minimizeLegendVisibility(),
    switchDarkTheme(),
    Networking.prototype.sync = function(e) {
        this.progress.addLoading(),
            e = void 0 === e || e;
        var t = this,
            a = new XMLHttpRequest;
        a.open("GET",
                "https://tilecache.rainviewer.com/api/maps.json?" + (new Date).getTime()),
            a.onload = function() {
                if (200 == a.status) {
                    var e = JSON.parse(a.responseText);
                    e && e[0] && e[0] > 0 && (0 != t.length && e.length === t.length && e[0] === t.timestamps[0] || (t.timestamps = e,
                        t.length = e.length,
                        t.cb(t)))
                }
                t.progress.addLoaded()
            },
            a.send(),
            e && !this.timer && (this.timer = setTimeout(function() {
                    t.stopSync(),
                        t.sync()
                },
                6e4))
    }

,
Networking.prototype.getImageUrl = function() {
    return this.imageUrl
}

,
Networking.prototype.getTimestamps = function() {
    return this.timestamps
}

,
Networking.prototype.getTimestampForIndex = function(e) {
    return this.timestamps[this.normalize(e)]
}

,
Networking.prototype.stopSync = function() {
    clearTimeout(this.timer),
        this.timer = null
}

,
Networking.prototype.normalize = function(e) {
    return e < 0 ? e = this.length - 1 : e >= this.length && (e = 0), e
}

,
addEventListener in document ? document.addEventListener("load",
        initializePage(), !1) : document.onload = initializePage(),
    document.onkeydown = function(e) {
        switch ((e = e || window.event).which || e.keyCode) {
            case 37:
                stopAnimation(), changeRadarPosition(currentPosition - 1);
                break;
            case 39:
                stopAnimation(), changeRadarPosition(currentPosition + 1);
                break;
            default:
                return
        }
        return e.preventDefault(), !1
    }

,
showHideLegend();



/****

*/

        // create fullscreen control

        map.addControl(L.control.fullscreen());
        map.on('enterFullscreen', function(){
        if(window.console) window.console.log('enterFullscreen');
        });
        map.on('exitFullscreen', function(){
        if(window.console) window.console.log('exitFullscreen');
        });

        
lc = L.control.locate({
    strings: {
                title: "حدد موقعي",
                metersUnit: "متر",
                feetUnit: "قدم",
                popup: "انت تبعد {distance} {unit} من هذه النقطة",
                outsideMapBoundsMsg: "يبدو انك تقع خارج حدود الخريطة"
            },
    circleStyle: {
                className:   'leaflet-control-locate-circle',
                color:       '#136AEC',
                fillColor:   '#13EC6A',
                fillOpacity: 0.19,
                weight:      1
            },
    markerStyle: {
                className:   'leaflet-control-locate-marker',
                color:       '#fff',
                fillColor:   '#097',
                fillOpacity: 1,
                weight:      3,
                opacity:     1,
                radius:      9
            }
}).addTo(map);







