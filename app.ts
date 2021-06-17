import express from 'express';
import { Client, TravelMode, UnitSystem } from "@googlemaps/google-maps-services-js";
import { ReverseGeocodingLocationType } from '@googlemaps/google-maps-services-js/dist/geocode/reversegeocode';
const bodyParser = require("body-parser");
const router = express.Router();

const app = express();
require('dotenv').config()
const port = 3000;

// Configure express to use body-parser as middleware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// add router in the Express app.
app.use("/", router);

// Google maps service setup
const client = new Client({});

interface LocationWithTimeZone {
    start: {
        country: string,
        timezone: string,
        location: string
    },
    end: {
        country: string,
        timezone: string,
        location: string
    },
    distance: {
        value: number,
        unit: string
    },
    time_diff: {
        value: number,
        unit: string
    },
}

router.post('/api/get_distance_and_time', async (req, res) => {
    console.log(req.body);
    const units = req.body.units;
    const endLat = req.body.end.lat;
    const endLng = req.body.end.lng;
    const startLat = req.body.start.lat;
    const startLng = req.body.start.lng;
    const endCoordinates = endLat + ',' + endLng;
    const startCoordinates = startLat + ',' + startLng;
    const responseObj: LocationWithTimeZone = {
        start: {
            country: '',
            timezone: '',
            location: ''
        },
        end: {
            country: '',
            timezone: '',
            location: ''
        },
        distance: {
            value: null,
            unit: ''
        },
        time_diff: {
            value: null,
            unit: 'hours'
        },
    }

    try {
        // Countries names
        responseObj.start.country = await getCountryName(startLat, startLng);
        responseObj.end.country = await getCountryName(endLat, endLng);
        
        // Distance between start and end
        const distanceAndUnit = await getDistance(startCoordinates, endCoordinates, units)
        responseObj.distance.value = Number(distanceAndUnit.split(' ')[0].replace(',', ''));
        responseObj.distance.unit = distanceAndUnit.split(' ')[1];
    
        // Time zones
        const startTimeZone = await getCountryTimeZone(startLat, startLng);
        const endTimeZone = await getCountryTimeZone(endLat, endLng);
        responseObj.end.timezone = 'GMT' + endTimeZone;
        responseObj.start.timezone = 'GMT' + startTimeZone;
    
        // Time Diff
        const diffTime = Math.abs(Number(startTimeZone) - Number(endTimeZone));
        responseObj.time_diff.value = diffTime
    
        // Locations
        responseObj.start.location = req.body.start;
        responseObj.end.location = req.body.end;
    
        console.log(responseObj);
        res.json(responseObj);
    } catch (err) {
        res.json({ error: err.message || err.toString() });
    }
  });

function getCountryName(lat, lng): Promise<string> {
    // Send query to get country name from latitude & longitude
    return new Promise((resolve, reject) => {
        client
            .reverseGeocode({
                params: {
                    location_type: [ReverseGeocodingLocationType.APPROXIMATE],
                    latlng: lat + ',' + lng,
                    key: process.env.GOOGLE_MAPS_API_KEY
                },
                timeout: 1000,
            })
            .then((response) => {
                const resultsLength = response.data.results.length;
                const lastResult = response.data.results[resultsLength - 1];
                console.log(lastResult.formatted_address); 
                resolve(lastResult.formatted_address);
            })
            .catch((e) => {
                reject(e);
            });
    });
}

function getCountryTimeZone(lat, lng): Promise<string> {
    // Send query to get country timezone from latitude & longitude
    return new Promise((resolve, reject) => {
        client
            .timezone({
                params: {
                    location: lat + ',' + lng,
                    timestamp: new Date('1/1/1970'),
                    key: process.env.GOOGLE_MAPS_API_KEY,
                },
                timeout: 1000,
            })
            .then((response) => {
                // console.log(response.data);
                const timeZone = Number(response.data.rawOffset) / 3600
                const formattedTimeZone = timeZone > 0 ? '+' + String(timeZone) : timeZone < 0 ? String(timeZone) : ''
                resolve(formattedTimeZone);
            })
            .catch((e) => {
                reject(e);
            });
    });
}

function getDistance(origin, destination, units = "metric"): Promise<string> {
    // Send query to get the distance between the two points
    return new Promise((resolve, reject) => {
        client
            .distancematrix({
                params: {
                    origins: [origin],
                    destinations: [destination],
                    units: units === "imperial" ? UnitSystem.imperial : UnitSystem.metric,
                    key: process.env.GOOGLE_MAPS_API_KEY,
                    mode: TravelMode.walking,
                },
                timeout: 1000,
            })
            .then((response) => {
                const distance = response.data.rows[0]?.elements[0].distance.text
                resolve(distance);
            })
            .catch((e) => {
                reject(e);
            });
    });
}

app.listen(port, () => {
    console.log(`Geo-cities is running on port ${port}`);
})