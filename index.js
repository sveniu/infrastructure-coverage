const map = L.map('map').setView([59.821438, 10.424995], 14);
map.addControl(new L.Control.Fullscreen());

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var markers = L.layerGroup().addTo(map);

function update_map() {
    markers.clearLayers();

    // Iterate through your data and add markers to the map.
    fetch('export.json')
        .then(response => response.json())
        .then(data => {
            data.filter(point => {
                const selected_infra = Array.from(
                    document.querySelectorAll("fieldset#infrastructure input:checked")).map(e => e.id).sort();
                const point_infra = Object.entries(point)
                    .filter(([key, value]) => value == 1)
                    .map(([key]) => key).sort();

                const intersect = selected_infra.filter(value => point_infra.includes(value));

                var logic_or = document.querySelector("#logic_or").checked;
                if (logic_or) {
                    return intersect.length > 0;
                } else {
                    if (selected_infra.length !== intersect.length) return false

                    for (let i = 0; i < selected_infra.length; i++) {
                        if (selected_infra[i] !== intersect[i]) return false
                    }

                    return true
                }
            }).forEach(point => {
                let marker = L.circleMarker(
                    // Offset the point to not overlap the house number.
                    [point.lat, point.lon].map(coord => coord + 0.00003),
                    {
                        radius: 4,
                        color: '#ff0000',
                        opacity: 0.75,
                    }).addTo(markers);

                let zero_coverage = (point.telia_hfc +
                    point.telia_collective +
                    point.telia_fiber +
                    point.vikenfiber_inhouse +
                    point.vikenfiber_border +
                    point.vikenfiber_away) == 0;

                marker.bindPopup(`<h3>${point.adressetekst}</h3>
            <ul>
            <li>Telia HFC: ${point.telia_hfc ? 'Yes' : 'No'}</li>
            <li>Telia Collective: ${point.telia_collective ? 'Yes' : 'No'}</li>
            <li>Telia Fiber: ${point.telia_fiber ? 'Yes' : 'No'}</li>
            <li>Altibox in house: ${point.vikenfiber_inhouse ? 'Yes' : 'No'}</li>
            <li>Altibox at border: ${point.vikenfiber_border ? 'Yes' : 'No'}</li>
            <li>Altibox further away: ${point.vikenfiber_away ? 'Yes' : 'No'}</li>
            <li>Zero coverage: ${zero_coverage ? 'Yes' : 'No'}</li>
            </ul>`);
            })
        })
        .catch(error => console.error('Error loading data:', error));
}

update_map();
