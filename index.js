const map = L.map('map').setView([59.821438, 10.424995], 13);
map.addControl(new L.Control.Fullscreen());

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const coverageType = Object.freeze({
    TELIA_NONE: 0,
    TELIA_HFC: 1,
    TELIA_COLLECTIVE: 2,
    TELIA_FIBER: 3,
    ALTIBOX_NONE: 4,
    ALTIBOX_INHOUSE: 5,
    ALTIBOX_TOWALL: 6,
    ALTIBOX_TOBORDER: 7,
    ALTIBOX_AWAY: 8,
});

// Colors generated with http://medialab.github.io/iwanthue/
const distinct_colors = [
    //    "#ffc536",
    //    "#ff68d5",
    //    "#75ff7e",
    //    "#f00035",
    //    "#6ed1ff",
    //    "#e48300",
    //    "#005057",
    //    "#ffccca",
    //    "#041c00",
    //    "#5d002c",
    "#228b22",
    "#00008b",
    "#b03060",
    "#ff4500",
    "#ffff00",
    "#deb887",
    "#00ff00",
    "#00ffff",
    "#ff00ff",
    "#6495ed",
];

var markers = L.layerGroup().addTo(map);

function update_map() {
    markers.clearLayers();

    // Iterate through your data and add markers to the map.
    var datapoint_count = { total: 0, visible: 0 };
    fetch('export.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(point => {
                // Split csv to array.
                point.coverage = point.coverage.split(",").sort();

                // Get the selected coverage types from the UI.
                const selected_coverage = Array.from(
                    document.querySelectorAll("fieldset#coverage input:checked")).map(e => e.value).sort();

                // Get the intersection between the selected coverage types, and
                // those present in the point.
                // FIXME point.coverage is an array...
                const intersect = selected_coverage.filter(value => point.coverage.includes(value));

                // Get the logic operator.
                const logic_or = document.querySelector("#logic_or").checked;

                // OR logic.
                if (logic_or) {
                    // If there is no intersection, just return.
                    if (intersect.length == 0) {
                        return;
                    }
                }

                // AND logic.
                else {
                    // The number of selected and intersecting elements must
                    // match.
                    if (selected_coverage.length !== intersect.length) {
                        return;
                    }

                    // The values of selected and intersecting elements must
                    // match.
                    for (let i = 0; i < selected_coverage.length; i++) {
                        if (selected_coverage[i] !== intersect[i]) {
                            return;
                        }
                    }
                }

                point.coverage.forEach(coverage => {
                    // Set the point color to match the coverage type.
                    coverage_index = Object.keys(coverageType).indexOf(coverage);
                    point.color = distinct_colors[coverage_index];

                    let marker = L.circleMarker(
                        // Place the point near the lat,lon coordinates, but offset
                        // around a circle to better display multiple coverage types
                        // per coordinate.
                        // FIXME ^
                        [point.lat, point.lon], //.map(coord => coord + 0.00003),
                        {
                            radius: 4,
                            color: point.color,
                            opacity: 0.75,
                        }).addTo(markers);

                    popup_html = `<h3>${point.adressetekst}</h3>\n`;
                    popup_html += `<ul style="list-style-type:none; margin:0; padding:0;">\n`;
                    popup_html += point.coverage.map(c => `<li>${c}</li>`).join("\n");
                    popup_html += `\n</ul>`;
                    marker.bindPopup(popup_html);

                });

                datapoint_count.total++;
                if (map.getBounds().contains(L.latLng(point.lat, point.lon))) {
                    datapoint_count.visible++;
                }
            })
        })
        .catch(error => console.error('Error loading data:', error))
        .finally(() => {
            datapoint_html = `Total ${datapoint_count.total}. Visible ${datapoint_count.visible}`
            document.getElementById("datapoint_count").innerHTML = datapoint_html;
        });
}

update_map();
