import express from 'express';
import { Client } from "@googlemaps/google-maps-services-js";
const bodyParser = require("body-parser");
const router = express.Router();
import { request } from 'http';

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

// interface LocationWithTimeZone {
//     start: {
//         country: string,
//         timezone: string,
//         location: string
//     },
//     end: {
//         country: string,
//         timezone: string,
//         location: string
//     },
//     distance: {
//         value: number,
//         unit: string
//     },
//     time_diff: {
//         value: number,
//         unit: string
//     },
// }

router.post('/api/get_distance_and_time',(req, res) => {
    console.log(req.body);
    
    const startLat = req.body.start.lat;
    const startLng = req.body.start.lng;

    console.log("startLat = "+startLat+", startLng is "+startLng);
    client
        .elevation({
            params: {
            locations: [{ lat: startLat, lng: startLng }],
            key: "AIzaSyBrRh0NjtrSopoOrG-4_W3OP0nmzSDQK-M",
            },
            timeout: 1000, // milliseconds
        })
        .then((r) => {
            console.log(r.data.results[0].elevation);
            res.end(r.data.results[0].elevation)
        })
        .catch((e) => {
            console.log(e.response.data.error_message);
        });
  });

app.listen(port, () => {
    console.log(`Geo-cities is running on port ${port}`);
})