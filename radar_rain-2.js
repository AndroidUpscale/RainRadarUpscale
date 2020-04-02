   mapboxgl.setRTLTextPlugin('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js');

var myToken = 'pk.eyJ1IjoibHVrYXNtYXJ0aW5lbGxpIiwiYSI6ImNqMmFvNDF4ODAwOGczM3M1cGJoOG13Y20ifQ.2A3lELT-I1U68zoCwUnPdw';

var map = L.map("map", {
  center: [24.48335, 39.61351],
  zoom: 4,
    fullscreenControl: {
        pseudoFullscreen: false
}
});


     map.fullscreenControl.setPosition('topright');
     

      map.addControl(L.control.locate({
             locateOptions: {
                   maxZoom: 10

                       }},'topright'));



L.control.layers({
    'Mapbox Blue': L.mapboxGL({
    accessToken: myToken,
    style: 'https://rawcdn.githack.com/AndroidUpscale/RainRadarUpscale/024bf3a6fba95246b94b6290b6024619660bec27/mapblue.json',
}),
    'Mapbox Dark': L.mapboxGL({
    accessToken: myToken,
    style: 'https://rawcdn.githack.com/AndroidUpscale/RainRadarUpscale/cc46f0cc10b75ae023d58b69d828545579631df5/dark-v10.json',
}).addTo(map),
    'Mapbox Streets-v11': L.mapboxGL({
    accessToken: myToken,
    style: 'https://rawcdn.githack.com/AndroidUpscale/RainRadarUpscale/cc46f0cc10b75ae023d58b69d828545579631df5/streets-v11.js',
}),
    'Mapbox Dark Green Blue': L.mapboxGL({
    accessToken: 'no-token',
    style: 'https://rawcdn.githack.com/AndroidUpscale/RainRadarUpscale/e3e3107f896ea6062be2306fb48dfd359c085914/dark_green_blue_ar.json',
}),
    'Mapbox Bright': L.mapboxGL({
    accessToken: myToken,
    style: 'https://rawcdn.githack.com/AndroidUpscale/RainRadarUpscale/03155159356ac83c9b303d0fcc7b25e958cba035/bright-v9_ar.json',
}),
    'Mapbox Bright Green': L.mapboxGL({
    accessToken: myToken,
    style: 'https://rawcdn.githack.com/AndroidUpscale/RainRadarUpscale/b08b88d1d7863bb5d9313329cf865f2cfbf2986b/bright-v9_ar_green.json',
}),
    'Mapbox Satellite Streets': L.mapboxGL({
    accessToken: myToken,
    style: 'https://rawcdn.githack.com/AndroidUpscale/RainRadarUpscale/af413766574cdf3482e06055f78ed1b4f588bc46/satellite-streets-v11.json',
}),
    'Mapbox OutDoors': L.mapboxGL({
    accessToken: myToken,
    style: 'https://rawcdn.githack.com/AndroidUpscale/RainRadarUpscale/af413766574cdf3482e06055f78ed1b4f588bc46/outdoors-v11.json',
}),
    'Mapbox Preview Night': L.mapboxGL({
    accessToken: myToken,
    style: 'https://rawcdn.githack.com/AndroidUpscale/RainRadarUpscale/af413766574cdf3482e06055f78ed1b4f588bc46/navigation-preview-night-v4.json',
})
},).addTo(map);




     map.zoomControl.setPosition('topright');





     /*_________⬇___RADAR____⬇_________*/

            var handle = document.getElementById('handle'),
                start = false,
                startTop;
            handle.onmousedown = function(e) {
            // Record initial positions.
               start = parseInt(e.clientY, 10);
               startTop = handle.offsetTop - 5;
               return false;
                };

              document.onmouseup = function(e) {
              start = null;
                };



    var timestamps = [];
    var radarLayers = [];
    var animationPosition = 0;
    var animationTimer = false;

    /**
     * Load actual radar animation frames timestamps from RainViewer API
     */
    var apiRequest = new XMLHttpRequest();
    apiRequest.open("GET", "https://api.rainviewer.com/public/maps.json", true);
    apiRequest.onload = function(e) {

        // save available timestamps and show the latest frame: "-1" means "timestamp.lenght - 1"
        timestamps = JSON.parse(apiRequest.response);
        showFrame(-1);
    };
    apiRequest.send();

    /**
     * Animation functions
     * @param db
     */
    function addLayer(db) {
        if (!radarLayers[db]) {
            radarLayers[db] = new L.TileLayer('https://tilecache.rainviewer.com/v2/radar/' + db + '/256/{z}/{x}/{y}/3/0_0.png', {
                tileSize: 256,
                opacity: 0.001,
                zIndex: db
            });

            
        }
        if (!map.hasLayer(radarLayers[db])) {
            map.addLayer(radarLayers[db]);



        }
    }

    /**
    
     */
    function changeRadarPosition(position, preloadOnly) {
        while (position >= timestamps.length) {
            position -= timestamps.length;
        }
        while (position < 0) {
            position += timestamps.length;
        }

        var currentTimestamp = timestamps[animationPosition];
        var nextTimestamp = timestamps[position];

        addLayer(nextTimestamp);

        if (preloadOnly) {
            return;
        }

        animationPosition = position;

        if (radarLayers[currentTimestamp]) {
            radarLayers[currentTimestamp].setOpacity(0);
        }
        
          radarLayers[nextTimestamp].setOpacity(1 - (handle.offsetTop / 200));
        

          document.onmousemove = function(e) {
            if (!start) return;
           // Adjust control.
           handle.style.top = Math.max(-5, Math.min(195, startTop + parseInt(e.clientY, 10) - start)) + 'px';
          // Adjust opacity.
          radarLayers[nextTimestamp].setOpacity(1 - (handle.offsetTop / 200));
           };



        document.getElementById("timestamp").innerHTML = (new Date(nextTimestamp * 1000)).toLocaleTimeString();
    }

    /**
     * Check avialability and show particular frame position from the timestamps list
     */
    function showFrame(nextPosition) {
        var preloadingDirection = nextPosition - animationPosition > 0 ? 1 : -1;

        changeRadarPosition(nextPosition);

        // preload next next frame (typically, +1 frame)
        // if don't do that, the animation will be blinking at the first loop
        changeRadarPosition(nextPosition + preloadingDirection, true);
    }

    /**
     * Stop the animation
     * Check if the animation timeout is set and clear it.
     */
    function stop() {
        if (animationTimer) {
            clearTimeout(animationTimer);
            animationTimer = false;
            return true;
        }
        return false;
    }

    function play() {
        showFrame(animationPosition + 1);

        // Main animation driver. Run this function every 500 ms
        animationTimer = setTimeout(play, 500);
    }

    function playStop() {
        if (!stop()) {
            play();
        }
    }



    /*popupp*/


     /*modal-content*/

        function myFunction() {
        var popupp = document.getElementById("myPopupp");
       popupp.classList.toggle("show"); }

var modal = document.getElementById("myModal");
var btn = document.getElementById("myBtn");
var span = document.getElementsByClassName("close")[0];
btn.onclick = function() {
  modal.style.display = "block";
}
span.onclick = function() {
  modal.style.display = "none";
}
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}



