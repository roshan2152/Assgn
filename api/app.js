const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

const fetchResults = require("./fetchresults");
const youtube = require("./youtube");
const shorts = require("./shorts")

require("dotenv").config();
const app = express();

const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(cors());

app.use("/static", express.static(path.join(__dirname, "static")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "index.html"));
});

app.post("/process_video", async (req, res) => {
    const url = req.body.url;
    console.log(url)
    const videoId = url.split("=")[1];

    try {
        const transcripts = await youtube.getVideoCaptions(videoId);
        console.log("transcript fetched");
        // console.log(transcripts)
        let allShorts = await fetchResults.extractShort(transcripts.transcript);
        allShorts = allShorts[0].reels;
        // console.log("ALL SHORT", allShorts)

        await shorts.createShort(url, allShorts)

    } catch (error) {
        console.log("Caught error in app.js");
        console.error("An Error occurred -> " + error);
        return res.json({ success: false, error: error.toString() });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
