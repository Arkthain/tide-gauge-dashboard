const stationSelect = document.getElementById('stationSelect');
const dateSelect = document.getElementById('dateSelect');
const form = document.getElementById('queryForm');
const output = document.getElementById('output');
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");

// Load stations into memory for later lookup
let stationsList = [];
// Load stations list from JSON
async function loadStations() {
  const res = await fetch('../data/stations.json');
  if (!res.ok) {
    console.error('Failed to load stations.json:', res.status, res.statusText);
    return;
  }
  const stations = await res.json();

  // 1) Keep your working filter
  const filtered = [];
  for (const station of stations) {
    const label = (station.label || '').toString();
    if (label.toLowerCase().includes('rainfall')) continue;
    filtered.push(station);
  }

  // 2) Sort safely by label (handles missing labels)
  filtered.sort((a, b) =>
    String(a.label || '').localeCompare(String(b.label || ''), undefined, { sensitivity: 'base' })
  );

  // 3) Populate dropdown
  stationSelect.innerHTML = '';
  stationSelect.appendChild(new Option('Select a station…', ''));
  for (const station of filtered) {
    const opt = document.createElement('option');
    opt.value = station.id;
    opt.textContent = station.label || station.id || 'Unknown station';
    stationSelect.appendChild(opt);
  }

  console.log(`Loaded ${filtered.length} stations (from ${stations.length} total).`);
}

// Format ISO datetime to just date
function formatDate(isoStr) {
  return isoStr.split('T')[0];
}

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const stationId = stationSelect.value;
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  output.innerHTML = "Loading data...";

  try {
    const res = await fetch(`../data/${stationId}.json`);
    const data = await res.json();

    // Filter readings between start & end dates
    const readings = data.items.filter(r =>
      r.dateTime >= startDate && r.dateTime <= (endDate || startDate)
    );

    if (readings.length === 0) {
      output.innerHTML = `<p>No tidal data available for that range.</p>`;
      return;
    }

    // Look up station name
    const station = stationsList.find(s => s.id === stationId);
    const stationName = station ? station.label : stationId;

    // Build chart
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: readings.map(r => r.dateTime),
        datasets: [{
          label: `Tide Level (m) at ${stationName}`,
          data: readings.map(r => r.value),
          borderColor: 'blue',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { type: 'time', time: { unit: 'hour' } },
          y: { title: { display: true, text: 'Water Level (m)' } }
        }
      }
    });

    output.innerHTML = ""; // clear loading text
  } catch (err) {
    console.error(err);
    output.innerHTML = `<p>Error fetching data.</p>`;
  }
});

// Initialize on load
loadStations();
