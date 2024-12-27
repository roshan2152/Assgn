const axios = require("axios");
const { type } = require("os");
require("dotenv").config();

exports.getVideoCaptions = async (Id) => {
    const API_KEY = process.env.RAPID_API_KEY;
    console.log(API_KEY)
    console.log(Id)

    const options = {
        method: 'POST',
        url: 'https://youtube-scraper-2023.p.rapidapi.com/video_transcript',
        headers: {
            'x-rapidapi-key': process.env.RAPID_API_KEY,
            'x-rapidapi-host': 'youtube-scraper-2023.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {
            videoId: Id
        }
    };

    try {
        const response = await axios.request(options);
        const transcript = response.data;

        return transcript;
    } catch (error) {
        console.error(error);
    }
};
