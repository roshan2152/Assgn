const axios = require("axios");
const { type } = require("os");

exports.getVideoCaptions = async (Id) => {
    const API_KEY = process.env.Rapid_API_KEY;
    console.log(API_KEY)
    console.log(Id)

    const options = {
        method: 'POST',
        url: 'https://youtube-scraper-2023.p.rapidapi.com/video_transcript',
        headers: {
            'x-rapidapi-key': '862da741c4msh4cbf048bf53b907p1c298cjsn59542c73510a',
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
