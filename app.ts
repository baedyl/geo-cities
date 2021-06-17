import express from 'express';
import { Client, TravelMode, UnitSystem } from "@googlemaps/google-maps-services-js";
const bodyParser = require("body-parser");
const router = express.Router();
import { request } from 'http';
import { ReverseGeocodingLocationType } from '@googlemaps/google-maps-services-js/dist/geocode/reversegeocode';
import { log, time } from 'console';
import { resolve } from 'path/posix';
import { rejects } from 'assert';
import { timezone } from '@googlemaps/google-maps-services-js/dist/timezone';

const app = express();
const port = 3000;

// Configure express to use body-parser as middleware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

router.post('/handle',(request, response) => {
    //code to perform particular action.
    //To access POST variable use req.body()methods.
    console.log(request.body);
});

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
            unit: ''
        },
    }
    const startLat = req.body.start.lat;
    const startLng = req.body.start.lng;
    const endLat = req.body.end.lat;
    const endLng = req.body.end.lng;

    console.log("startLat = "+startLat+", startLng = "+startLng);
    responseObj.start.country = await getCountryName(startLat, startLng);
    responseObj.end.country = await getCountryName(endLat, endLng);
    const distanceAndUnit = await getDistance(startLat + ',' + startLng, endLat + ',' + endLng)
    
    // Distance between start and end
    responseObj.distance.value = Number(distanceAndUnit.split(' ')[0].replace(',', ''));
    responseObj.distance.unit = distanceAndUnit.split(' ')[1];

    // Time zones
    responseObj.end.timezone = 'GMT' + await getCountryTimeZone(endLat, endLng);
    responseObj.start.timezone = 'GMT' + await getCountryTimeZone(startLat, startLng);

    // Locations
    responseObj.start.location = req.body.start;
    responseObj.end.location = req.body.end;

    console.log(responseObj);
    res.end(responseObj);
  });

function getCountryName(lat, lng): Promise<string> {
    // Send query to get country name from latitude & longitude
    return new Promise((resolve, reject) => {
        client
            .reverseGeocode({
                params: {
                    location_type: [ReverseGeocodingLocationType.APPROXIMATE],
                    latlng: lat + ',' + lng,
                    key: "AIzaSyAEBHtNbJA4OO0nfPLNHfDl4McYmXS-m_I",
                },
                timeout: 1000, // milliseconds
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
    // Send query to get country name from latitude & longitude
    return new Promise((resolve, reject) => {
        client
            .timezone({
                params: {
                    location: lat + ',' + lng,
                    timestamp: new Date('1/1/1970'),
                    key: "AIzaSyAEBHtNbJA4OO0nfPLNHfDl4McYmXS-m_I",
                },
                timeout: 1000, // milliseconds
            })
            .then((response) => {
                console.log(response.data);
                // const resultsLength = response.data.results.length;
                // const lastResult = response.data.results[resultsLength - 1];
                const timeZone = Number(response.data.rawOffset) / 3600
                const formattedTimeZone = timeZone > 0 ? '+' + String(timeZone) : timeZone < 0 ? String(timeZone) : ''
                console.log(formattedTimeZone);
                resolve(formattedTimeZone);
            })
            .catch((e) => {
                reject(e);
            });
    });
}

function calcTime(offset): Date {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (1000 * offset));
    
    return nd
}

function getDistance(origin, destination): Promise<string> {
    // Send query to get country name from latitude & longitude
    console.log(origin, destination);
    
    return new Promise((resolve, reject) => {
        client
            .distancematrix({
                params: {
                    origins: [origin],
                    destinations: [destination],
                    key: "AIzaSyAEBHtNbJA4OO0nfPLNHfDl4McYmXS-m_I",
                    mode: TravelMode.walking,
                },
                timeout: 1000, // milliseconds
            })
            .then((response) => {
                const distance = response.data.rows[0]?.elements[0].distance.text
                // console.log(distance);
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