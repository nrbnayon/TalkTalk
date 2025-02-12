import axios from 'axios';
import config from '../config';

const getDistanceFromOriginDestination = async (location: any) => {
    const apiKey = config.google_maps;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${location?.origin.latitude},${location?.origin.longitude}&destinations=${location?.destinations.latitude},${location?.destinations.longitude}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.rows[0].elements[0].status === 'OK') {
            const distance = data.rows[0].elements[0].distance.text;
            return distance;
        } else {
            return;
        }
    } catch (error) {
        return;
    }
};

export default getDistanceFromOriginDestination;
