
function C(e){return(document.cookie.match("(^|; )"+encodeURIComponent(e)+"=([^;]*)")||-1)[2]}

function sC(e,n){var a=new Date;a.setTime(a.getTime()+158112e5),document.cookie=e+"="+n+";expires="+a.toUTCString()+";path=/"}

function ev(e){dataLayer&&dataLayer.push({event:e})}

function changeLocation(){var t=["ar"],n=["en"],a=(navigator.language||navigator.userLanguage).substring(0,2),t="";sC("l",a),e.indexOf(a)>-1?t="ar":n.indexOf(a)>-1&&(t="ar"),""!=t&&redirect[t]&&-1==window.location.pathname.indexOf("/"+t)&&(window.location=redirect[t])}

function getParamFromUrlCookie(e,n,a){var t=getURLParameter(e);return null==t&&null==(t=C(n))&&(t=a),t}

function getURLParameter(e){return decodeURIComponent((new RegExp("[?|&]"+e+"=([^&;]+?)(&|#|;|$)").exec(location.search)||[,""])[1].replace(/\+/g,"%20"))||null}dataLayer=[],C("l")||changeLocation();


//# sourceMappingURL=/assets/source-maps/common.js.map
//# sourceURL=_assets/js/common.js
