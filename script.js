var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib='Map data © <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
var osm = new L.TileLayer(osmUrl, {
    attribution: osmAttrib,
    detectRetina: true
});

var gsimapsUrl='https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg';
var gsimapsAttrib='Map data © <a href="https://maps.gsi.go.jp/">GSI</a>';
var gsimaps = new L.TileLayer(gsimapsUrl, {
    attribution: gsimapsAttrib,
    detectRetina: true
});

// please replace this with your own mapbox token!
var token = 'pk.eyJ1IjoiZG9tb3JpdHoiLCJhIjoiY2o0OHZuY3MwMGo1cTMybGM4MTFrM2dxbCJ9.yCQe43DMRqobazKewlhi9w';
var mapboxUrl = 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/{z}/{x}/{y}@2x?access_token=' + token;
var mapboxAttrib = 'Map data © <a href="http://osm.org/copyright">OpenStreetMap</a> contributors. Tiles from <a href="https://www.mapbox.com">Mapbox</a>.';
var mapbox = new L.TileLayer(mapboxUrl, {
  attribution: mapboxAttrib,
  tileSize: 512,
  zoomOffset: -1
});

var map = new L.Map('map', {
    //layers: [mapbox],
    layers: [gsimaps],
    center: [37.66, 138.18],
    zoom: 5,
    zoomControl: true
});

// add location control to global name space for testing only
// on a production site, omit the "lc = "!
lc = L.control.locate({
    strings: {
        title: "Show me where I am, yo!"
    }
}).addTo(map);

// define toolbar options
var options = {
    position: 'topleft', // toolbar position, options are 'topleft', 'topright', 'bottomleft', 'bottomright'
    useFontAwesome: false, // use fontawesome instead of geomanIcons (you need to include fontawesome yourself)
    drawMarker: false, // adds button to draw markers
    drawPolyline: false, // adds button to draw a polyline
    drawRectangle: true, // adds button to draw a rectangle
    drawPolygon: false, // adds button to draw a polygon
    drawCircle: false, // adds button to draw a cricle
    cutPolygon: false, // adds button to cut a hole in a polygon
    editMode: false, // adds button to toggle edit mode for all layers
    removalMode: true, // adds a button to remove layers

};

// add leaflet.pm controls to the map
map.pm.addControls(options);

const polygons = [];
// listen to when a new layer is created
map.on('pm:create', function(e) {
    // 元の図形を削除
    map.removeLayer(e.layer);

    // 回転・編集ができる図形を生成
    const polygon = L.polygon(e.layer._latlngs, { transform: true, draggable: true}).addTo(map);
    polygon.transform.setOptions({ uniformScaling: false }).enable();

    // 作成したポリゴンをリストに保存
    polygons.push(polygon);
});

// 削除時に保存したポリゴンを削除
map.on('pm:remove', function(e) {
    for (const i in polygons) {
        const polygon = polygons[i];
        if (e.layer === polygon) {
            // 編集モード解除
            polygon.transform.disable();

            if (e.layer === polygon) {
                //  削除されたポリゴンをリストから削除
                polygons.splice(i, 1);
            }
        }
    }
});


function download() {
    const geoJson = {
        type: "FeatureCollection",
        features: []
    };

    geoJson.features = polygons.map(poly => {
        console.log(poly._latlngs);
        return {
            type: "Feature",
            properties: {},
            geometry: {
                type: "Polygon",
                // latlngから配列に変換
                coordinates: poly._latlngs.map(latlngs => {
                    const lls = latlngs.map((latlng) => {
                        return [
                            latlng['lng'], latlng['lat']
                        ];
                    });
                    // Polygonはfirstとlastが同じ座標である必要がある
                    lls.push(lls[0]);
                    return lls;
                })
            }
        }
    });

    // データを生成
        const data = new Blob(
            [
                // polygonsからlatlngの作成してJSONに変換
                JSON.stringify(geoJson, null, 4)
            ], 
            {
                type:'application/json'
        }
    );

    // ダウンロードURLを生成
    const url = URL.createObjectURL(data);

    // ダウンロード用のボタン(見えない)を生成
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rect.json';

    // スクリプトでクリック
    link.click();

    // ダウンロードURLを削除
    URL.revokeObjectURL(url);
};


