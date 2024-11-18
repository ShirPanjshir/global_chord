// world_chord.js

import React, { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { ArcLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl';
import Slider from '@mui/material/Slider'; // Ensure @mui/material is installed
import countryCoordinates from './countryCoordinates';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia3dwdGhlZ3JlYXQiLCJhIjoiY20zajljd3Z2MDExZjJycHRvcGE0dm9uYyJ9.9IwsWKd3rM0aVxjXND4LUQ'; // Replace with your actual Mapbox token

// Function to extract the year from a record dynamically
function extractYearFromRecord(record) {
  // Example: If the record has a `date` field with a year, extract it
  if (record.date) {
    const match = record.date.match(/\b(20\d{2})\b/); // Match years like 2000-2099
    return match ? parseInt(match[0], 10) : null;
  }

  // If no valid year can be extracted, return null
  console.warn('Year not found for record:', record);
  return null;
}

function WorldChord() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [year, setYear] = useState(1940); // Default year for the slider filter

  useEffect(() => {
    // Fetch data from converted_data.json
    fetch(`${process.env.PUBLIC_URL}/converted_data.json`)
      .then(response => response.json())
      .then(fetchedData => {
        console.log('Full Data Loaded:', fetchedData);

        // Add the `year` field dynamically if missing
        const updatedData = fetchedData.map(d => ({
          ...d,
          year: d.year || extractYearFromRecord(d) // Add year dynamically if needed
        }));

        console.log('Updated Data with Year Field:', updatedData);
        setData(updatedData);

        // Filter the data for the initial year
        const initialFilteredData = updatedData.filter(d => d.year === year);
        console.log('Filtered Data for Initial Year:', year, initialFilteredData);
        setFilteredData(initialFilteredData);
      })
      .catch(error => console.error('Error loading JSON data:', error));
  }, [year]);

  useEffect(() => {
    // Update filtered data when year changes
    if (data.length > 0) {
      const updatedFilteredData = data.filter(d => d.year === year);
      console.log('Filtered Data for Year:', year, updatedFilteredData);
      setFilteredData(updatedFilteredData);
    }
  }, [year, data]);

  // Handle slider change
  const handleYearChange = (event, newValue) => {
    setYear(newValue);
  };

  // Filter out invalid records
  const validFilteredData = filteredData.filter(d => {
    const source = countryCoordinates[d.origin];
    const target = countryCoordinates[d.destination];

    // Log missing countries
    if (!source) console.warn(`Missing source coordinates for: ${d.origin}`);
    if (!target) console.warn(`Missing target coordinates for: ${d.destination}`);

    // Keep only valid records
    return source && target;
  });

  const layers = new ArcLayer({
    id: 'arc-layer',
    data: validFilteredData, // Use only validated data
    getSourcePosition: d => countryCoordinates[d.origin],
    getTargetPosition: d => countryCoordinates[d.destination],
    getSourceColor: [0, 128, 255], // Blue for origin
    getTargetColor: [255, 0, 128], // Red for destination
    getWidth: d => Math.log(d.quantity + 1),
    pickable: true,
    getTooltip: ({ object }) =>
      object &&
      `${object.origin} to ${object.destination}: ${object.quantity} ${object.weapon} (${object.year})`
  });

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <DeckGL
        initialViewState={{
          latitude: 20,
          longitude: 0,
          zoom: 2,
          pitch: 30
        }}
        controller={true}
        layers={[layers]}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/light-v10"
        />
      </DeckGL>

      {/* Slider for Year Selection */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          width: '250px',
          background: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1,
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h4 style={{ margin: '0 0 10px 0' }}>Select Year: {year}</h4>
        <Slider
          min={1940} // Adjust based on your data range
          max={2023} // Adjust based on your data range
          value={year}
          onChange={handleYearChange}
          step={1}
          marks
          valueLabelDisplay="auto"
        />
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          top: 120, // Position below the slider
          left: 20,
          background: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1,
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h4 style={{ margin: '0 0 10px 0' }}>Legend</h4>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '20px',
              height: '10px',
              background: 'rgb(0,128,255)',
              marginRight: '10px'
            }}
          ></div>
          <span>Origin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
          <div
            style={{
              width: '20px',
              height: '10px',
              background: 'rgb(255,0,128)',
              marginRight: '10px'
            }}
          ></div>
          <span>Destination</span>
        </div>
      </div>
    </div>
  );
}

export default WorldChord;
